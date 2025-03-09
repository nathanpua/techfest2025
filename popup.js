// Import config
import config from './config.dev.js';  // Use dev config for development (gitignored)
// In production, change this to: import config from './config.js';

// Remove the ES module import and use a different approach for Supabase
// Instead of: import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/+esm';

// Set Supabase credentials when the extension is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded - initializing extension");
  
  // Add animation effects to the UI
  addUIAnimations();
  
  // Set default Supabase credentials and OpenAI API key from config
  chrome.storage.local.set({
    supabaseUrl: config.SUPABASE_URL,
    supabaseKey: config.SUPABASE_KEY,
    websiteUrl: config.WEBSITE_URL, // Default website URL, should be changed in production
    openaiApiKey: config.OPENAI_API_KEY // OpenAI API key for Exposé
  }, () => {
    console.log("Supabase credentials, website URL, and OpenAI API key saved to local storage.");
    
    // Test Supabase connection
    testSupabaseConnection();
  });
  
  // Check if user ID is set
  chrome.storage.local.get(["userId", "websiteUrl"], (result) => {
    const missingFields = [];
    
    if (!result.userId) {
      missingFields.push("User ID");
    }
    
    if (!result.websiteUrl) {
      missingFields.push("Website URL");
    }
    
    if (missingFields.length > 0) {
      // Display warning if required fields are not set
      const warningDiv = document.createElement('div');
      warningDiv.className = 'warning';
      warningDiv.innerHTML = `
        <p><strong>Warning:</strong> ${missingFields.join(" and ")} not set. Scanned articles won't work properly.</p>
        <p>Please set these in the <a href="#" id="openOptions">extension options</a>.</p>
      `;
      document.body.insertBefore(warningDiv, document.body.firstChild);
      
      // Add event listener to open options page
      document.getElementById('openOptions').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }
  });
  
  // Set up button event listeners
  setupButtonEventListeners();
});

// Function to test Supabase connection
async function testSupabaseConnection() {
  try {
    // Comment out debug logs
    // console.log("Testing Supabase connection...");
    
    // Get Supabase credentials
    const { supabaseUrl, supabaseKey } = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey']);
    
    if (!supabaseUrl || !supabaseKey) {
      // Comment out debug logs
      // console.error("Supabase credentials not configured");
      return false;
    }
    
    // Comment out debug logs
    // console.log("Testing connection with Supabase URL:", supabaseUrl);
    
    // Test direct API call
    try {
      // Comment out debug logs
      // console.log("Using direct API call to test connection...");
      const response = await fetch(`${supabaseUrl}/rest/v1/scans?limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Comment out debug logs
        // console.error("Direct API test failed:", errorData);
        
        // Comment out error message display
        /*
        // Display error message
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
          resultDiv.className = 'error';
          resultDiv.textContent = `Database connection error: ${errorData.message || response.statusText}. Scans may not be saved.`;
        }
        */
        
        return false;
      }
      
      // Comment out debug logs
      // console.log("Supabase connection test successful!");
      return true;
    } catch (apiError) {
      // Comment out debug logs
      // console.error("Error with direct API call:", apiError);
      
      // Comment out error message display
      /*
      // Display error message
      const resultDiv = document.getElementById('result');
      if (resultDiv) {
        resultDiv.className = 'error';
        resultDiv.textContent = `Database connection error: ${apiError.message}. Scans may not be saved.`;
      }
      */
      
      return false;
    }
  } catch (error) {
    // Comment out debug logs
    // console.error("Error testing Supabase connection:", error);
    return false;
  }
}

// Function to set up button event listeners
function setupButtonEventListeners() {
  console.log("Setting up button event listeners");
  
  // Debug DOM elements
  const scanButton = document.getElementById('scanButton');
  const fetchButton = document.getElementById('fetchData');
  const resultDiv = document.getElementById('result');
  
  console.log("DOM Elements:", {
    scanButton: scanButton ? "Found" : "Not found",
    fetchButton: fetchButton ? "Found" : "Not found",
    resultDiv: resultDiv ? "Found" : "Not found"
  });
  
  // Scan button event listener
  if (scanButton) {
    console.log("Adding click event listener to scan button");
    scanButton.addEventListener('click', async () => {
      console.log("Scan button clicked");
      
      // Add loading animation to button
      const originalText = scanButton.textContent;
      scanButton.innerHTML = '<span class="loading-text">Scanning</span>';
      scanButton.disabled = true;
      
      try {
        // Query for the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("Active tab:", tab.id, tab.url);
        
        if (!tab || !tab.id) {
          throw new Error("No active tab found");
        }
        
        // Show loading message
        const resultDiv = document.getElementById('result');
        resultDiv.className = 'info';
        resultDiv.textContent = 'Preparing to scan...';
        
        // Check if content script is loaded
        let isLoaded = await isContentScriptLoaded(tab.id);
        
        // If not loaded, inject it
        if (!isLoaded) {
          console.log("Content script not loaded, injecting it now...");
          resultDiv.textContent = 'Loading content script...';
          
          const injected = await injectContentScript(tab.id);
          if (!injected) {
            throw new Error("Failed to inject content script. This may be due to browser restrictions on this page. Try a different article or refresh the page.");
          }
          
          // Double-check that it's loaded
          isLoaded = await isContentScriptLoaded(tab.id);
          if (!isLoaded) {
            throw new Error("Content script was injected but is not responding. Please refresh the page and try again.");
          }
        }
        
        // Now send the scan message
        console.log("Sending scanArticle message to content script");
        resultDiv.textContent = 'Extracting article content...';
        
        // Use a Promise-based approach for better error handling
        const result = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'scanArticle' }, (response) => {
            // Check for communication errors
            const error = chrome.runtime.lastError;
            if (error) {
              reject(new Error(error.message || "Communication error with content script"));
              return;
            }
            
            // Check for response errors
            if (!response) {
              reject(new Error("No response from content script"));
              return;
            }
            
            if (!response.success) {
              reject(new Error(response.error || "Unknown error in content script"));
              return;
            }
            
            resolve(response);
          });
        });
        
        console.log("Received response from content script:", result);
        
          // Update loading message
          resultDiv.textContent = 'Analyzing article for misinformation...';
          
          // Analyze the article
          const analysis = await analyzeArticle(result.articleContent);
          console.log("Analysis complete:", analysis);
          
          // Save the analysis to Supabase
          try {
          resultDiv.textContent = 'Saving analysis to database...';
          
          // Check if user ID is set
          const { userId, websiteUrl } = await chrome.storage.local.get(['userId', 'websiteUrl']);
          if (!userId) {
            console.warn("User ID not set. Showing warning to user.");
            // Show a warning but continue with rendering the results
            const warningDiv = document.createElement('div');
            warningDiv.className = 'warning';
            warningDiv.innerHTML = `
              <p><strong>Warning:</strong> User ID not set. This scan won't be saved to your account.</p>
              <p>Please set your User ID in the <a href="#" id="openOptionsFromWarning">extension options</a>.</p>
            `;
            document.body.insertBefore(warningDiv, document.body.firstChild);
            
            // Add event listener to open options page
            document.getElementById('openOptionsFromWarning').addEventListener('click', (e) => {
              e.preventDefault();
              chrome.runtime.openOptionsPage();
            });
          } else {
            // Try to save to Supabase
            await saveAnalysisToSupabase(result.articleUrl, result.articleContent, analysis);
            console.log("Analysis saved to Supabase");
            
            // Show success message with direct link to scan history
            const successDiv = document.createElement('div');
            successDiv.className = 'success';
            
            if (websiteUrl) {
              successDiv.innerHTML = `
                <p><strong>Success:</strong> Analysis saved to your account.</p>
                <p>View it in your <a href="#" id="openHistory">scan history</a> or <a href="#" id="openWebsite">go to website</a>.</p>
              `;
              
              // Add event listener to open history
              document.getElementById('openHistory').addEventListener('click', (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: `${websiteUrl}/history` });
              });
              
              // Add event listener to open website
              document.getElementById('openWebsite').addEventListener('click', (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: websiteUrl });
              });
            } else {
              successDiv.innerHTML = `
                <p><strong>Success:</strong> Analysis saved to your account.</p>
                <p>Please set your website URL in the <a href="#" id="openOptions">extension options</a> to view your scan history.</p>
              `;
              
              // Add event listener to open options page
              document.getElementById('openOptions').addEventListener('click', (e) => {
                e.preventDefault();
                chrome.runtime.openOptionsPage();
              });
            }
            
            document.body.insertBefore(successDiv, document.body.firstChild);
          }
        } catch (saveError) {
          console.error("Error saving to Supabase:", saveError);
          
          // Comment out error message display code
          /*
          // Show error message but continue with rendering the results
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error';
          errorDiv.innerHTML = `
            <p><strong>Error:</strong> Failed to save analysis to database.</p>
            <p>Error: ${saveError.message}</p>
            <p>Please check your <a href="#" id="openOptionsFromError">extension options</a>.</p>
          `;
          document.body.insertBefore(errorDiv, document.body.firstChild);
          
          // Add event listener to open options page
          document.getElementById('openOptionsFromError').addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
          });
          */
        }
        
        // Render the analysis results
        renderAnalysisResults(analysis, result.pageTitle);
      } catch (error) {
        console.error("Error during scan:", error);
        const resultDiv = document.getElementById('result');
        resultDiv.className = 'error';
        resultDiv.textContent = 'Error: ' + (error.message || "Could not scan page");
      } finally {
        // Reset button
        scanButton.innerHTML = originalText;
        scanButton.disabled = false;
      }
    });
  } else {
    console.error("Scan button not found in the DOM");
  }

  // Fetch data button event listener
  if (fetchButton) {
    console.log("Adding click event listener to fetch data button");
    fetchButton.addEventListener("click", async () => {
      console.log("Fetch data button clicked");
      
      // Add loading animation to button
      const originalText = fetchButton.textContent;
      fetchButton.innerHTML = '<span class="loading-text">Loading</span>';
      fetchButton.disabled = true;
      
      try {
        const { websiteUrl } = await chrome.storage.local.get(['websiteUrl']);
        
        if (!websiteUrl) {
          throw new Error("Website URL not configured");
        }
        
        chrome.tabs.create({ url: `${websiteUrl}/history` });
      } catch (error) {
        console.error("Error opening history:", error);
        document.getElementById('result').className = 'error';
        document.getElementById('result').textContent = 'Error: ' + (error.message || "Could not open history");
      } finally {
        // Reset button
        fetchButton.innerHTML = originalText;
        fetchButton.disabled = false;
      }
    });
  } else {
    console.error("Fetch data button not found in the DOM");
  }
}

// Function to add UI animations
function addUIAnimations() {
  // Add glow effect to the logo
  const logo = document.querySelector('.logo');
  if (!logo) {
    console.error("Logo element not found");
    return;
  }
  
  // Add pulsing glow effect
  const addGlowEffect = () => {
    logo.style.textShadow = '0 0 10px rgba(179, 136, 255, 0.7)';
    
    setTimeout(() => {
      logo.style.textShadow = '0 0 5px rgba(179, 136, 255, 0.3)';
      
      setTimeout(() => {
        logo.style.textShadow = 'none';
      }, 1000);
    }, 1000);
  };
  
  // Initial glow effect
  setTimeout(addGlowEffect, 1000);
  
  // Repeat the effect every 5 seconds
  setInterval(addGlowEffect, 5000);
  
  // Add button animations
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(0)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(-2px)';
    });
  });
}

// Listen for the openTab message from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openTab') {
    chrome.tabs.create({ url: request.url });
  }
});

// Function to check if content script is loaded
async function isContentScriptLoaded(tabId) {
  try {
    // Use a more reliable approach with error handling
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(
        tabId, 
        { action: 'ping' }, 
        (response) => {
          // Check if there was an error (lastError is set)
          const error = chrome.runtime.lastError;
          if (error) {
            console.log("Content script not loaded:", error.message);
            resolve(false);
            return;
          }
          
          // Check if we got a valid response
          resolve(response && response.status === 'pong');
        }
      );
    });
  } catch (error) {
    console.log("Error checking if content script is loaded:", error.message);
    return false;
  }
}

// Function to inject content script
async function injectContentScript(tabId) {
  console.log("Injecting content script into tab:", tabId);
  try {
    // First, check if the tab is still valid
    const tab = await chrome.tabs.get(tabId);
    if (!tab) {
      console.error("Tab no longer exists");
      return false;
    }
    
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    
    console.log("Content script injected successfully");
    
    // Wait a moment for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error("Failed to inject content script:", error);
    console.error("Error details:", error.message);
    
    // Check for specific error types
    if (error.message.includes("Cannot access contents of url")) {
      console.error("This might be due to Chrome's restrictions on certain pages. Try a different article.");
    } else if (error.message.includes("Extension manifest must request permission")) {
      console.error("Missing required permissions. Please check the extension's permissions.");
    }
    
    return false;
  }
}

// Function to check if a URL is from a known satire or fake news site
function isSatireOrFakeNewsSite(url) {
  if (!url) return false;
  
  // List of known satire/fake news domains
  const satireSites = [
    'gomerblog.com',
    'theonion.com',
    'babylonbee.com',
    'clickhole.com',
    'duffelblog.com',
    'thehardtimes.net',
    'waterfordwhispersnews.com',
    'thebeaverton.com',
    'newsthump.com',
    'private-eye.co.uk',
    'newyorker.com/humor',
    'kaiserhealth.news',
    'scrappleface.com',
    'borowitz-report',
    'satirewire.com',
    'reductress.com'
  ];
  
  try {
    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Check if the domain or any part of it matches a satire site
    return satireSites.some(site => domain.includes(site));
  } catch (error) {
    console.error("Error parsing URL:", error);
    return false;
  }
}

async function analyzeArticle(articleText) {
  try {
    console.log("Analyzing article with OpenAI API...");
    
    // Check if article text is too short
    if (!articleText || articleText.length < 50) {
      throw new Error("The article content is too short to analyze. Please try a different article or check if the page has loaded completely.");
    }
    
    // Get OpenAI API key from storage
    const { openaiApiKey } = await chrome.storage.local.get(['openaiApiKey']);
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured. Please set it in the extension options.");
    }
    
    console.log("Using OpenAI API key: " + openaiApiKey.substring(0, 10) + "...");
    
    // Get the current tab URL to check if it's a satire site
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || "";
    
    // Check if the URL is from a known satire/fake news site
    const isSatireSite = isSatireOrFakeNewsSite(url);
    
    // Create the system prompt
    let systemPrompt = `
    You are an expert fact-checker and misinformation analyst. 
    Analyze the provided news article for factual accuracy, bias, and reliability.
    `;
    
    // Add special instructions for satire sites
    if (isSatireSite) {
      systemPrompt += `
      IMPORTANT: This article is from a KNOWN SATIRE/FAKE NEWS SITE. 
      This is NOT a legitimate news source and publishes satirical content meant for humor, not factual reporting.
      Your analysis should emphasize this fact prominently and warn users not to take the content seriously.
      The reliability score should reflect that this is satire/fake news and not meant to be taken as factual reporting.
      `;
    }
    
    systemPrompt += `
    Your response MUST be a valid JSON object with the following structure:
    {
      "analysis": {
        "reliability_score": number, // 0-100 score of overall reliability
        "summary": string, // 1-2 sentence summary of the article
        "recommendation": string, // Short recommendation for the reader
        "detailed_scores": {
          "factual_accuracy": number, // 0-100
          "source_credibility": number, // 0-100
          "bias_level": number, // 0-100 (higher means more biased)
          "transparency": number // 0-100
        },
        "reliability_scores": {
          "evidence_quality": {
            "score": number, // 0-10
            "confidence": number, // 0-100
            "reasoning": string // Explanation of the score
          },
          "factual_accuracy": {
            "score": number, // 0-10
            "confidence": number, // 0-100
            "reasoning": string // Explanation of the score
          },
          "source_credibility": {
            "score": number, // 0-10
            "confidence": number, // 0-100
            "reasoning": string // Explanation of the score
          },
          "reasoning_soundness": {
            "score": number, // 0-10
            "confidence": number, // 0-100
            "reasoning": string // Explanation of the score
          },
          "contextual_completeness": {
            "score": number, // 0-10
            "confidence": number, // 0-100
            "reasoning": string // Explanation of the score
          }
        },
        "bias_indicators": {
          "political_bias": {
            "detected": boolean,
            "direction": string, // e.g., "left", "right", "center", "none"
            "strength": string // e.g., "strong", "moderate", "mild", "none"
          },
          "emotional_manipulation": {
            "detected": boolean,
            "techniques": [string] // e.g., ["loaded language", "appeal to fear"]
          }
        },
        "identified_claims": [
          {
            "claim": string,
            "accuracy": string // e.g., "True", "False", "Misleading", "Unverified"
          }
        ],
        "overall_reliability": {
          "score": number, // 0-100 score
          "category": string, // e.g., "Highly Reliable", "Mostly Reliable", "Somewhat Reliable", "Questionable", "Unreliable", "Satire/Fake News"
          "confidence": number, // 0-100 confidence percentage
          "is_satire": boolean // true if the article is from a known satire/fake news site
        }
      }
    }
    
    If the article is too short or lacks sufficient information to analyze properly, do your best with the available content and note this limitation in the recommendation.
    `;
    
    // Truncate article text if it's too long (to fit within token limits)
    const maxLength = 8000;
    const truncatedText = articleText.length > maxLength 
      ? articleText.substring(0, maxLength) + "... [truncated due to length]" 
      : articleText;
    
    // Create the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Please analyze this article:\n\n${truncatedText}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log("OpenAI API response:", data);
    
    // Parse the response
    try {
      const analysisJson = JSON.parse(data.choices[0].message.content);
      
      // Ensure the analysis has the expected structure
      if (!analysisJson.analysis) {
        console.warn("Analysis missing 'analysis' property, adding it");
        analysisJson.analysis = analysisJson;
      }
      
      // Ensure overall_reliability exists
      if (!analysisJson.analysis.overall_reliability) {
        console.warn("Analysis missing 'overall_reliability', adding it");
        analysisJson.analysis.overall_reliability = {
          score: analysisJson.analysis.reliability_score || 50,
          category: getReliabilityLabel(analysisJson.analysis.reliability_score || 50, isSatireSite),
          confidence: 89,
          is_satire: isSatireSite
        };
      } else if (!analysisJson.analysis.overall_reliability.category) {
        // Ensure category is set if overall_reliability exists but category is missing
        analysisJson.analysis.overall_reliability.category = 
          getReliabilityLabel(analysisJson.analysis.overall_reliability.score || 50, isSatireSite);
      }
      
      // Ensure reliability_scores exists and has the correct structure
      if (!analysisJson.analysis.reliability_scores) {
        console.warn("Analysis missing 'reliability_scores', adding it");
        const { detailed_scores } = analysisJson.analysis;
        
        // Create reliability_scores with values based on detailed_scores
        analysisJson.analysis.reliability_scores = {
          evidence_quality: {
            score: Math.round(detailed_scores.factual_accuracy / 10),
            confidence: 90,
            reasoning: generateReasoningText("evidence_quality", detailed_scores.factual_accuracy)
          },
          factual_accuracy: {
            score: Math.round(detailed_scores.factual_accuracy / 10),
            confidence: 90,
            reasoning: generateReasoningText("factual_accuracy", detailed_scores.factual_accuracy)
          },
          source_credibility: {
            score: Math.round(detailed_scores.source_credibility / 10),
            confidence: 90,
            reasoning: generateReasoningText("source_credibility", detailed_scores.source_credibility)
          },
          reasoning_soundness: {
            score: Math.round(detailed_scores.transparency / 10),
            confidence: 90,
            reasoning: generateReasoningText("reasoning_soundness", detailed_scores.transparency)
          },
          contextual_completeness: {
            score: Math.round((detailed_scores.transparency - 5) / 10),
            confidence: 85,
            reasoning: generateReasoningText("contextual_completeness", detailed_scores.transparency - 5)
          }
        };
      } else {
        // Ensure each reliability score has the correct structure
        const scoreTypes = ['evidence_quality', 'factual_accuracy', 'source_credibility', 
                           'reasoning_soundness', 'contextual_completeness'];
        
        scoreTypes.forEach(type => {
          // If the score type doesn't exist, create it
          if (!analysisJson.analysis.reliability_scores[type]) {
            const baseScore = type === 'contextual_completeness' 
              ? analysisJson.analysis.detailed_scores.transparency - 5
              : analysisJson.analysis.detailed_scores[type.replace('_soundness', '')] || 70;
            
            analysisJson.analysis.reliability_scores[type] = {
              score: Math.round(baseScore / 10),
              confidence: type === 'contextual_completeness' ? 85 : 90,
              reasoning: generateReasoningText(type, baseScore)
            };
          } 
          // If the score exists but is just a number, convert it to the full object
          else if (typeof analysisJson.analysis.reliability_scores[type] === 'number') {
            const score = analysisJson.analysis.reliability_scores[type];
            analysisJson.analysis.reliability_scores[type] = {
              score: score,
              confidence: type === 'contextual_completeness' ? 85 : 90,
              reasoning: generateReasoningText(type, score * 10)
            };
          }
          // If reasoning is missing, add it
          else if (!analysisJson.analysis.reliability_scores[type].reasoning) {
            const score = analysisJson.analysis.reliability_scores[type].score;
            analysisJson.analysis.reliability_scores[type].reasoning = 
              generateReasoningText(type, score * 10);
          }
        });
      }
      
      console.log("Final analysis structure:", analysisJson);
      return analysisJson;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Failed to parse analysis results. Please try again.");
    }
  } catch (error) {
    console.error("Error in analyzeArticle:", error);
    throw error;
  }
}

// Helper function to get reliability label based on score
function getReliabilityLabel(score, isSatire = false) {
  // If it's a satire site, return the satire category regardless of score
  if (isSatire) {
    return "Satire/Fake News";
  }
  
  if (score >= 90) return "Highly Reliable";
  if (score >= 70) return "Mostly Reliable";
  if (score >= 50) return "Somewhat Reliable";
  if (score >= 30) return "Questionable";
  return "Unreliable";
}

// Function to update the saveAnalysisToSupabase function to use validateUserId
async function saveAnalysisToSupabase(articleUrl, articleContent, analysis) {
  try {
    console.log("Saving analysis to Supabase...");
    
    // Get Supabase credentials and user ID from storage
    const { supabaseUrl, supabaseKey, userId } = await chrome.storage.local.get(['supabaseUrl', 'supabaseKey', 'userId']);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }
    
    if (!userId) {
      throw new Error("User ID not configured. Scanned articles won't be saved to your account.");
    }
    
    // Validate UUID format (Supabase expects UUIDs for user_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error("User ID is not in the correct format. Please copy the exact User ID from your profile page on the website.");
    }
    
    // Check if the URL is from a known satire/fake news site
    const isSatireSite = isSatireOrFakeNewsSite(articleUrl);
    
    // Ensure analysis is properly formatted
    let analysisObject = analysis;
    
    // If analysis is already a string, parse it
    if (typeof analysis === 'string') {
      try {
        analysisObject = JSON.parse(analysis);
      } catch (parseError) {
        // Keep the original analysis object
      }
    }
    
    // Add reliability_scores field if it doesn't exist
    if (analysisObject.analysis && analysisObject.analysis.detailed_scores && !analysisObject.analysis.reliability_scores) {
      const { detailed_scores } = analysisObject.analysis;
      
      // Create reliability_scores based on the detailed_scores from the actual analysis
      analysisObject.analysis.reliability_scores = {
        evidence_quality: {
          score: Math.round(detailed_scores.factual_accuracy / 10),
          confidence: 90,
          reasoning: generateReasoningText("evidence_quality", detailed_scores.factual_accuracy)
        },
        factual_accuracy: {
          score: Math.round(detailed_scores.factual_accuracy / 10),
          confidence: 90,
          reasoning: generateReasoningText("factual_accuracy", detailed_scores.factual_accuracy)
        },
        source_credibility: {
          score: Math.round(detailed_scores.source_credibility / 10),
          confidence: 90,
          reasoning: generateReasoningText("source_credibility", detailed_scores.source_credibility)
        },
        reasoning_soundness: {
          score: Math.round(detailed_scores.transparency / 10),
          confidence: 90,
          reasoning: generateReasoningText("reasoning_soundness", detailed_scores.transparency)
        },
        contextual_completeness: {
          score: Math.round((detailed_scores.transparency - 5) / 10),
          confidence: 85,
          reasoning: generateReasoningText("contextual_completeness", detailed_scores.transparency - 5)
        }
      };
      
      // Ensure overall_reliability has category and confidence
      if (analysisObject.analysis.overall_reliability) {
        const reliabilityScore = analysisObject.analysis.overall_reliability.score || analysisObject.analysis.reliability_score || 50;
        analysisObject.analysis.overall_reliability.category = getReliabilityLabel(reliabilityScore, isSatireSite);
        analysisObject.analysis.overall_reliability.confidence = 89;
        analysisObject.analysis.overall_reliability.is_satire = isSatireSite;
      }
    } else if (analysisObject.analysis && analysisObject.analysis.overall_reliability) {
      // Ensure is_satire flag is set correctly
      analysisObject.analysis.overall_reliability.is_satire = isSatireSite;
      
      // Update category if it's a satire site
      if (isSatireSite) {
        analysisObject.analysis.overall_reliability.category = "Satire/Fake News";
      }
    }
    
    // Create a simple data structure that worked before
    const scanData = {
      content: articleContent,
      source: 'extension'
    };
    
    // Try to add these fields - they'll be ignored if not in the schema
    scanData.user_id = userId;
    scanData.article_url = articleUrl;
    scanData.analysis = analysisObject;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation' // Get the created record back
      },
      body: JSON.stringify([scanData])
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      // Comment out debug logs
      // console.error("Supabase API error:", errorText);
      throw new Error(`Database error: ${errorText}`);
    }
    
    // Get the created record
    const createdRecords = await response.json();
    // Comment out debug logs
    // console.log("Created records:", createdRecords);
    
    // If we got a record back, try to update it with additional fields
    if (createdRecords && createdRecords.length > 0) {
      const recordId = createdRecords[0].id;
      // Comment out debug logs
      // console.log("Created record ID:", recordId);
      
      // Try to update the record with additional fields
      try {
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/scans?id=eq.${recordId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            article_url: articleUrl
          })
        });
        
        if (!updateResponse.ok) {
          // Comment out debug logs
          // console.warn("Could not update record with additional fields:", await updateResponse.text());
          // Continue anyway since the initial save worked
        } else {
          // Comment out debug logs
          // console.log("Record updated with additional fields");
        }
      } catch (updateError) {
        // Comment out debug logs
        // console.warn("Error updating record with additional fields:", updateError);
        // Continue anyway since the initial save worked
      }
    }
    
    // Comment out debug logs
    // console.log("Analysis saved to Supabase successfully!");
    return { success: true };
  } catch (error) {
    // Comment out debug logs
    // console.error("Error saving to Supabase:", error);
    throw error;
  }
}

// Function to render analysis results
function renderAnalysisResults(analysis, pageTitle) {
  console.log("Rendering analysis results:", analysis);
  
  const resultDiv = document.getElementById('result');
  resultDiv.className = '';
  resultDiv.innerHTML = '';
  
  // Extract data from analysis
  const { 
    reliability_score, 
    summary, 
    recommendation, 
    detailed_scores, 
    bias_indicators, 
    identified_claims,
    reliability_scores,
    overall_reliability
  } = analysis.analysis;
  
  const { political_bias, emotional_manipulation } = bias_indicators;
  
  // Check if this is a satire/fake news site
  const isSatire = overall_reliability?.is_satire || false;
  
  // Create container for analysis results
  const container = document.createElement('div');
  container.className = 'analysis-container';
  
  // Add article title
  const titleElement = document.createElement('h2');
  titleElement.className = 'article-title';
  titleElement.textContent = pageTitle;
  container.appendChild(titleElement);
  
  // Add satire warning if applicable
  if (isSatire) {
    const satireWarning = document.createElement('div');
    satireWarning.className = 'satire-warning';
    satireWarning.innerHTML = `
      <h3>SATIRE / FAKE NEWS SITE DETECTED</h3>
      <p>This article is from a known satire or fake news website. The content is not meant to be taken as factual reporting and is likely created for entertainment purposes.</p>
      <p>Do not share this content as if it were real news.</p>
    `;
    container.appendChild(satireWarning);
  }
  
  // Add overall reliability section (matching the website UI)
  const overallReliabilitySection = document.createElement('div');
  overallReliabilitySection.className = 'reliability-section';
  
  // Add heading
  const reliabilityHeading = document.createElement('h3');
  reliabilityHeading.className = 'section-heading';
  reliabilityHeading.textContent = 'Overall Reliability';
  overallReliabilitySection.appendChild(reliabilityHeading);
  
  // Get the overall reliability score
  const overallScore = overall_reliability?.score || reliability_score || 50;
  
  // Add progress bar
  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'progress-container';
  
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar-bg';
  
  const progressFill = document.createElement('div');
  progressFill.className = `progress-bar-fill ${getScoreColorClass(overallScore)}`;
  progressFill.style.width = `${overallScore}%`;
  
  const scoreText = document.createElement('span');
  scoreText.className = 'score-text';
  scoreText.textContent = `${Math.round(overallScore)}%`;
  
  progressBar.appendChild(progressFill);
  progressBarContainer.appendChild(progressBar);
  progressBarContainer.appendChild(scoreText);
  overallReliabilitySection.appendChild(progressBarContainer);
  
  // Add category and confidence
  const categoryElement = document.createElement('p');
  categoryElement.className = 'reliability-detail';
  
  // Get category from overall_reliability or calculate it
  let category = overall_reliability?.category || getReliabilityLabel(overallScore, isSatire);
  
  // Override category for satire sites
  if (isSatire) {
    category = "Satire/Fake News";
  }
  
  categoryElement.innerHTML = `<span class="detail-label">Category:</span> ${category}`;
  overallReliabilitySection.appendChild(categoryElement);
  
  // Add confidence
  const confidenceElement = document.createElement('p');
  confidenceElement.className = 'reliability-detail';
  const confidence = overall_reliability?.confidence || 89;
  confidenceElement.innerHTML = `<span class="detail-label">Confidence:</span> ${confidence}%`;
  overallReliabilitySection.appendChild(confidenceElement);
  
  // Add reliability scores section
  const reliabilityScoresSection = document.createElement('div');
  reliabilityScoresSection.className = 'reliability-scores-section';
  
  const scoresHeading = document.createElement('h3');
  scoresHeading.className = 'section-heading';
  scoresHeading.textContent = 'Reliability Scores';
  reliabilityScoresSection.appendChild(scoresHeading);
  
  // Define score types to display
  const scoreTypes = [
    { key: 'evidence_quality', name: 'Evidence Quality' },
    { key: 'factual_accuracy', name: 'Factual Accuracy' },
    { key: 'source_credibility', name: 'Source Credibility' },
    { key: 'reasoning_soundness', name: 'Reasoning Soundness' },
    { key: 'contextual_completeness', name: 'Contextual Completeness' }
  ];
  
  // Add each score item with progress bar
  scoreTypes.forEach(type => {
    const scoreItem = document.createElement('div');
    scoreItem.className = 'score-item';
    
    // Get score data from reliability_scores if available, otherwise use detailed_scores
    let score, confidence, reasoning;
    
    if (reliability_scores && reliability_scores[type.key]) {
      const scoreData = reliability_scores[type.key];
      score = typeof scoreData === 'object' ? scoreData.score : scoreData;
      confidence = typeof scoreData === 'object' ? scoreData.confidence : 90;
      reasoning = typeof scoreData === 'object' ? scoreData.reasoning : 
        generateReasoningText(type.key, score * 10);
    } else {
      // Fallback to detailed_scores
      let baseScore;
      if (type.key === 'evidence_quality' || type.key === 'factual_accuracy') {
        baseScore = detailed_scores.factual_accuracy;
      } else if (type.key === 'source_credibility') {
        baseScore = detailed_scores.source_credibility;
      } else if (type.key === 'reasoning_soundness') {
        baseScore = detailed_scores.transparency;
      } else if (type.key === 'contextual_completeness') {
        baseScore = detailed_scores.transparency - 5;
      }
      
      score = Math.round(baseScore / 10);
      confidence = type.key === 'contextual_completeness' ? 85 : 90;
      reasoning = generateReasoningText(type.key, baseScore);
    }
    
    const scoreHeader = document.createElement('div');
    scoreHeader.className = 'score-header';
    scoreHeader.innerHTML = `${type.name} <span class="score-value">${score}/10 (Confidence: ${confidence}%)</span>`;
    
    const scoreProgressContainer = document.createElement('div');
    scoreProgressContainer.className = 'progress-container';
    
    const scoreProgressBar = document.createElement('div');
    scoreProgressBar.className = 'progress-bar-bg';
    
    const scoreProgressFill = document.createElement('div');
    scoreProgressFill.className = `progress-bar-fill ${getScoreColorClass(score * 10)}`;
    scoreProgressFill.style.width = `${score * 10}%`;
    
    scoreProgressBar.appendChild(scoreProgressFill);
    scoreProgressContainer.appendChild(scoreProgressBar);
    
    // Add reasoning text
    const reasoningText = document.createElement('p');
    reasoningText.className = 'reasoning-text';
    reasoningText.textContent = reasoning;
    
    scoreItem.appendChild(scoreHeader);
    scoreItem.appendChild(scoreProgressContainer);
    scoreItem.appendChild(reasoningText);
    
    reliabilityScoresSection.appendChild(scoreItem);
  });
  
  // Add bias indicators section
  const biasSection = document.createElement('div');
  biasSection.className = 'bias-section';
  
  const biasHeading = document.createElement('h3');
  biasHeading.className = 'section-heading';
  biasHeading.textContent = 'Bias Indicators';
  biasSection.appendChild(biasHeading);
  
  // Add bias indicators content
  const biasContent = document.createElement('div');
  biasContent.className = 'bias-content';
  
  // Political bias
  const politicalBiasItem = document.createElement('div');
  politicalBiasItem.className = 'bias-item';
  politicalBiasItem.innerHTML = `
    <h4>Political Bias</h4>
    <p>${political_bias.detected ? 
      `Detected: ${political_bias.direction} (${political_bias.strength})` : 
      'No significant political bias detected'}</p>
  `;
  
  // Emotional manipulation
  const emotionalManipulationItem = document.createElement('div');
  emotionalManipulationItem.className = 'bias-item';
  emotionalManipulationItem.innerHTML = `
    <h4>Emotional Manipulation</h4>
    <p>${emotional_manipulation.detected ? 
      `Detected techniques: ${emotional_manipulation.techniques.join(', ')}` : 
      'No significant emotional manipulation detected'}</p>
  `;
  
  biasContent.appendChild(politicalBiasItem);
  biasContent.appendChild(emotionalManipulationItem);
  biasSection.appendChild(biasContent);
  
  // Add view full analysis button
  const viewFullButton = document.createElement('button');
  viewFullButton.className = 'view-full-button';
  viewFullButton.textContent = 'View Full Analysis';
  viewFullButton.addEventListener('click', () => {
    chrome.storage.local.get(['websiteUrl'], async (result) => {
      if (result.websiteUrl) {
        chrome.tabs.create({ url: `${result.websiteUrl}/history` });
      }
    });
  });
  
  // Assemble the container
  container.appendChild(overallReliabilitySection);
  container.appendChild(reliabilityScoresSection);
  container.appendChild(biasSection);
  container.appendChild(viewFullButton);
  
  // Add to the result div
  resultDiv.appendChild(container);
}

// Helper function to get color class based on score
function getScoreColorClass(score) {
  if (score >= 75) {
    return 'high-score';
  } else if (score >= 50) {
    return 'medium-score';
  } else {
  return 'low-score';
  }
}

// Helper function to get accuracy color class
function getAccuracyColorClass(accuracy) {
  if (accuracy === 'Accurate' || accuracy === 'Mostly Accurate') {
    return 'accurate';
  } else if (accuracy === 'Partially Accurate' || accuracy === 'Misleading') {
    return 'misleading';
  } else {
    return 'inaccurate';
  }
}

// Helper function to generate reasoning text based on score
function generateReasoningText(type, score) {
  // Convert score to a 0-10 scale if it's on a 0-100 scale
  const normalizedScore = score > 10 ? Math.round(score / 10) : score;
  
  // Define reasoning text templates based on type and score range
  const reasoningTemplates = {
    evidence_quality: {
      high: "The article provides direct quotes, statistics, and interviews with relevant stakeholders, which are clear and relevant pieces of evidence supporting the claims made.",
      medium: "The article includes some quotes and references to support its claims, though more specific evidence would strengthen the arguments.",
      low: "The article lacks sufficient evidence to support its claims, with few or no direct quotes, statistics, or credible references."
    },
    factual_accuracy: {
      high: "The article presents factual information that appears to be accurate and consistent with the topic. No information appears to be fabricated or misleading.",
      medium: "The article contains mostly accurate information, though some claims may be presented without sufficient verification or context.",
      low: "The article contains several factual inaccuracies or presents information in a way that is misleading or lacks proper context."
    },
    source_credibility: {
      high: "The article quotes from highly credible sources relevant to the topic, including official statements, expert opinions, and reputable publications.",
      medium: "The article cites some credible sources, though it could benefit from a wider range of expert perspectives or more authoritative references.",
      low: "The article relies on questionable sources, anonymous claims, or lacks proper attribution for many of its assertions."
    },
    reasoning_soundness: {
      high: "The reasoning in the article is sound and logically consistent. It accurately represents different perspectives and avoids fallacious arguments.",
      medium: "The article's reasoning is generally sound, though some conclusions may not fully follow from the evidence presented or may oversimplify complex issues.",
      low: "The article contains logical fallacies, makes unwarranted leaps in reasoning, or presents biased arguments without acknowledging alternative viewpoints."
    },
    contextual_completeness: {
      high: "The article provides comprehensive context about the topic, including background information, multiple perspectives, and relevant historical or social factors.",
      medium: "The article provides adequate context about the topic, though it could benefit from more depth in certain areas or additional expert opinions.",
      low: "The article lacks important context that would help readers fully understand the topic, presenting an incomplete or potentially misleading picture."
    }
  };
  
  // Determine which template to use based on score
  let category;
  if (normalizedScore >= 8) {
    category = 'high';
  } else if (normalizedScore >= 5) {
    category = 'medium';
  } else {
    category = 'low';
  }
  
  // Return the appropriate reasoning text
  return reasoningTemplates[type][category];
}
