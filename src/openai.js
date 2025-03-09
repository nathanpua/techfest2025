import OpenAI from 'openai';

// Check if the OpenAI API key is set
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

console.log("OpenAI API Key available:", OPENAI_API_KEY ? "Yes (hidden for security)" : "No");

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
  console.error('OpenAI API key is not set. Please set VITE_OPENAI_API_KEY in your .env file.');
}

// Initialize the OpenAI client
let openai;
try {
  openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for demo purposes, in production use server-side API calls
});
  console.log("OpenAI client initialized successfully");
} catch (error) {
  console.error("Error initializing OpenAI client:", error);
}

/**
 * Checks if the OpenAI API key is valid
 * @returns {Promise<boolean>} - Whether the API key is valid
 */
export const checkOpenAIApiKey = async () => {
  console.log("Checking OpenAI API key validity...");
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key') {
    console.error("OpenAI API key is not set or is the default value");
    return false;
  }
  
  try {
    // Make a simple API call to check if the key is valid
    console.log("Making test API call to OpenAI...");
    const response = await openai.models.list();
    console.log("OpenAI API key is valid. Available models:", response.data.length);
    return true;
  } catch (error) {
    console.error('Error checking OpenAI API key:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

/**
 * Creates a fallback response for development/testing
 * @param {string} articleText - The text of the article
 * @returns {Object} - A mock analysis result
 */
const createFallbackResponse = (articleText) => {
  console.log("Creating fallback response for development/testing");
  return {
    "analysis": {
      "reliability_scores": {
        "factual_accuracy": {
          "score": 7.5,
          "confidence": 85,
          "reasoning": "This is a fallback response for development/testing purposes."
        },
        "source_credibility": {
          "score": 6.2,
          "confidence": 75,
          "reasoning": "This is a fallback response for development/testing purposes."
        },
        "evidence_quality": {
          "score": 6.8,
          "confidence": 80,
          "reasoning": "This is a fallback response for development/testing purposes."
        },
        "contextual_completeness": {
          "score": 5.5,
          "confidence": 80,
          "reasoning": "This is a fallback response for development/testing purposes."
        },
        "reasoning_soundness": {
          "score": 6.8,
          "confidence": 85,
          "reasoning": "This is a fallback response for development/testing purposes."
        }
      },
      "overall_reliability": {
        "score": 65,
        "category": "Somewhat Reliable",
        "confidence": 80
      },
      "identified_claims": [
        {
          "claim": "This is a placeholder claim from the article",
          "accuracy": "Unverified",
          "evidence": "This is a fallback response for development/testing purposes.",
          "context_notes": "This is a fallback response for development/testing purposes."
        }
      ],
      "bias_indicators": {
        "political_bias": {
          "detected": false,
          "direction": "neutral",
          "strength": "none",
          "examples": ["This is a fallback response for development/testing purposes."]
        },
        "emotional_manipulation": {
          "detected": false,
          "techniques": ["none detected"],
          "examples": ["This is a fallback response for development/testing purposes."]
        }
      },
      "recommendation": "This is a fallback response for development/testing purposes."
    },
    "metadata": {
      "analyzed_text": articleText.substring(0, 100) + "...",
      "analysis_timestamp": new Date().toISOString(),
      "model_version": "fallback-mode",
      "analysis_version": "1.0.0-fallback"
    }
  };
};

/**
 * Analyzes an article for misinformation using OpenAI
 * @param {string} articleText - The text of the article to analyze
 * @returns {Promise<Object>} - The analysis results
 */
export const analyzeArticle = async (articleText) => {
  console.log("analyzeArticle called with text length:", articleText.length);
  console.log("Text preview:", articleText.substring(0, 100) + "...");
  
  // For development/testing, use the fallback response if the API key is not valid
  // or if we're in development mode
  const useOpenAI = await checkOpenAIApiKey();
  if (!useOpenAI) {
    console.log("Using fallback response due to invalid API key");
    return createFallbackResponse(articleText);
  }
  
  try {
    console.log("Starting article analysis with OpenAI...");
    
    // Create a system prompt that describes the exact JSON structure we want
    const systemPrompt = `
      You are an expert fact-checker and misinformation analyst. 
      Analyze the provided news article for factual accuracy, bias, and reliability.
      Perform a systematic analysis of the provided news article to identify potential biases and misinformation. Follow this structured approach for every article to ensure consistent evaluations.
      First read the full article without judgment to understand the overall content
      Re-read, documenting specific examples for each parameter
      Assign numerical scores based on objective criteria, not subjective reactions
      Provide direct quotes as evidence for each identified issue
      Separate factual inaccuracies from bias indicators
      To ensure consistent results across multiple analyses of the same article:
      Use quantitative metrics where possible (e.g., % of claims verified)
      Reference specific text passages rather than making general statements
      Apply the same thresholds for flagging issues in every analysis
      Document reasoning for each score to create an audit trail
      Focus on patterns rather than isolated instances
      Compare current article to established benchmarks within same publication/topic
      Distinguish between deliberate misinformation and unintentional inaccuracies
      Consider genre (news report vs. opinion/analysis) in your assessment
      Acknowledge limitations of your analysis (e.g., lack of access to verify certain claims)
      Maintain analytical neutrality regardless of the article's subject matter
      Flag uncertain assessments rather than making definitive judgments without sufficient evidence
    
    Your response MUST be a valid JSON object with the following structure:
    {
      "analysis": {
        "reliability_scores": {
          "factual_accuracy": {
            "score": number (0-10),
            "confidence": number (0-100),
            "reasoning": "string explanation"
          },
          "source_credibility": {
            "score": number (0-10),
            "confidence": number (0-100),
            "reasoning": "string explanation"
          },
          "evidence_quality": {
            "score": number (0-10),
            "confidence": number (0-100),
            "reasoning": "string explanation"
          },
          "contextual_completeness": {
            "score": number (0-10),
            "confidence": number (0-100),
            "reasoning": "string explanation"
          },
          "reasoning_soundness": {
            "score": number (0-10),
            "confidence": number (0-100),
            "reasoning": "string explanation"
          }
        },
        "overall_reliability": {
          "score": number (0-100),
          "category": "Unreliable" | "Somewhat Reliable" | "Reliable" | "Highly Reliable",
          "confidence": number (0-100)
        },
        "identified_claims": [
          {
            "claim": "string",
            "accuracy": "string",
            "evidence": "string",
            "context_notes": "string"
          }
        ],
        "bias_indicators": {
          "political_bias": {
            "detected": boolean,
            "direction": "string",
            "strength": "string",
            "examples": ["string"]
          },
          "emotional_manipulation": {
            "detected": boolean,
            "techniques": ["string"],
            "examples": ["string"]
          }
        },
        "recommendation": "string"
      },
      "metadata": {
        "analyzed_text": "first 100 chars of text...",
        "analysis_timestamp": "ISO date string",
        "model_version": "string",
        "analysis_version": "string"
      }
    }
    
    Ensure all fields are present and properly formatted. DO NOT include any text outside of the JSON structure.
    `;

    // Try to determine which model to use
    let modelToUse = "gpt-3.5-turbo";
    try {
      console.log("Fetching available OpenAI models...");
      const models = await openai.models.list();
      console.log("Available models:", models.data.map(m => m.id).join(", "));
      
      if (models.data.some(model => model.id === "gpt-4")) {
        modelToUse = "gpt-4";
      } else if (models.data.some(model => model.id === "gpt-4-turbo")) {
        modelToUse = "gpt-4-turbo";
      } else if (models.data.some(model => model.id === "gpt-3.5-turbo-1106")) {
        modelToUse = "gpt-3.5-turbo-1106"; // This model supports JSON mode
      }
      console.log(`Using model: ${modelToUse}`);
    } catch (error) {
      console.warn("Could not determine available models:", error);
      console.error("Error details:", error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      console.log("Using fallback response due to error fetching models");
      return createFallbackResponse(articleText);
    }

    // Check if the model supports JSON response format
    const supportsJsonFormat = ["gpt-4-turbo", "gpt-4-1106-preview", "gpt-3.5-turbo-1106"].includes(modelToUse);
    console.log("Model supports JSON format:", supportsJsonFormat);
    
    // Make the API call
    const requestOptions = {
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: articleText
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    
    // Only add response_format for models that support it
    if (supportsJsonFormat) {
      requestOptions.response_format = { type: "json_object" };
      console.log("Added JSON response format to request");
    }
    
    console.log("Sending request to OpenAI with options:", JSON.stringify({
      model: requestOptions.model,
      temperature: requestOptions.temperature,
      max_tokens: requestOptions.max_tokens,
      response_format: requestOptions.response_format
    }, null, 2));
    
    try {
      console.log("Calling OpenAI API now...");
    const response = await openai.chat.completions.create(requestOptions);

    // Extract the response content
    const responseContent = response.choices[0].message.content;
      console.log("Received response from OpenAI:", responseContent.substring(0, 100) + "...");
    
    try {
      // Parse the JSON response
      // First, try to extract JSON if it's wrapped in markdown code blocks
      let jsonString = responseContent;
      
      // Check if the response is wrapped in markdown code blocks
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const match = jsonRegex.exec(jsonString);
      if (match && match[1]) {
        jsonString = match[1].trim();
          console.log("Extracted JSON from markdown code blocks");
      }
      
        console.log("Parsing JSON response...");
      const parsedResponse = JSON.parse(jsonString);
        console.log("Successfully parsed JSON response");
      
      // Validate the response has the expected structure
      if (!parsedResponse.analysis || !parsedResponse.metadata) {
        console.error("Invalid response structure:", parsedResponse);
        throw new Error("Invalid response structure from OpenAI");
      }
      
        console.log("Response validation successful");
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", responseContent);
        console.log("Using fallback response due to parsing error");
        return createFallbackResponse(articleText);
      }
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);
      console.error("Error details:", apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      }
      console.log("Using fallback response due to API error");
      return createFallbackResponse(articleText);
    }
  } catch (error) {
    console.error('Error analyzing article:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log("Using fallback response due to general error");
    return createFallbackResponse(articleText);
  }
};

/**
 * Creates a fallback response for image analysis in development/testing
 * @returns {Object} - A mock image analysis result
 */
const createFallbackImageResponse = () => {
  console.log("Creating fallback image analysis response for development/testing");
  return {
    "analysis": {
      "conclusion": {
        "is_likely_ai_generated": true,
        "reliability_score": 25,
        "summary": "This image shows multiple indicators of being AI-generated, particularly in facial features and background inconsistencies."
      },
      "evidence": {
        "facial_anomalies": [
          "Asymmetrical facial features - uneven eye positioning",
          "Unnatural skin texture - overly smooth with inconsistent pore patterns",
          "Blurry or unrealistic hair boundaries"
        ],
        "lighting_issues": [
          "Inconsistent shadows - multiple light sources that don't align",
          "Unnatural reflections in eyes"
        ],
        "background_problems": [
          "Warped or blurry background elements",
          "Inconsistent focus throughout image"
        ],
        "digital_artifacts": [
          "Unusual color transitions around edges",
          "Pixel inconsistencies in detailed areas"
        ]
      },
      "technical_assessment": "The image contains telltale signs of current-generation AI image synthesis, including characteristic artifacts in high-detail areas and texture inconsistencies typical of diffusion models."
    },
    "metadata": {
      "analysis_version": "1.0",
      "timestamp": new Date().toISOString()
    }
  };
};

/**
 * Analyzes an image to detect if it's AI-generated/deepfake
 * @param {File} imageFile - The image file to analyze
 * @returns {Promise<Object>} - The analysis results
 */
export const analyzeImage = async (imageFile) => {
  console.log("analyzeImage called with file:", imageFile.name);
  
  // For development/testing, use the fallback response if the API key is not valid
  const useOpenAI = await checkOpenAIApiKey();
  if (!useOpenAI) {
    console.log("Using fallback response due to invalid API key");
    return createFallbackImageResponse();
  }
  
  try {
    console.log("Starting image analysis with OpenAI...");
    
    // Convert the image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create a system prompt that describes the task and expected response format
    const systemPrompt = `
      You are an expert in digital image forensics and AI-generated image detection.
      Analyze the provided image for signs of AI generation or manipulation.
      
      Focus on these key areas:
      1. Facial anomalies (if faces are present)
      2. Lighting and shadow inconsistencies
      3. Background irregularities
      4. Digital artifacts and unnatural patterns
      5. Texture inconsistencies
      
      Provide a detailed analysis with specific evidence and a reliability score.
      
      IMPORTANT: The reliability score should reflect how authentic/real the image is:
      - Authentic, unmanipulated images should receive a HIGH reliability score (75-100)
      - AI-generated or heavily manipulated images should receive a LOW reliability score (0-30)
      - Slightly edited or ambiguous images should receive a MEDIUM reliability score (31-74)
      
      Your response MUST be a valid JSON object with the following structure:
      {
        "analysis": {
          "conclusion": {
            "is_likely_ai_generated": boolean,
            "reliability_score": number (0-100) where 0 means likely fake/AI-generated and 100 means authentic/real,
            "summary": "string"
          },
          "evidence": {
            "facial_anomalies": ["string"],
            "lighting_issues": ["string"],
            "background_problems": ["string"],
            "digital_artifacts": ["string"]
          },
          "technical_assessment": "string"
        },
        "metadata": {
          "analysis_version": "1.0",
          "timestamp": "ISO date string"
        }
      }
      
      Ensure all fields are present and properly formatted. DO NOT include any text outside of the JSON structure.
    `;
    
    // Try to determine which vision-capable model to use
    let modelToUse;
    try {
      modelToUse = await getBestVisionModel();
    } catch (error) {
      console.error("Error getting best vision model:", error);
      modelToUse = "gpt-4o"; // Default fallback
    }
    
    let response;
    
    try {
      // First attempt with the best available model
      console.log("Attempting image analysis with model:", modelToUse);
      response = await openai.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image for signs of AI generation or manipulation."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });
    } catch (modelError) {
      console.error(`Error with model ${modelToUse}:`, modelError.message);
      
      // If gpt-4o fails, try with gpt-4-vision
      if (modelError.message.includes("deprecated") || modelError.message.includes("not found")) {
        try {
          modelToUse = "gpt-4-vision";
          console.log("Attempting with alternative model:", modelToUse);
          response = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Please analyze this image for signs of AI generation or manipulation."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: base64Image
                    }
                  }
                ]
              }
            ],
            max_tokens: 1500,
            response_format: { type: "json_object" }
          });
        } catch (secondModelError) {
          console.error(`Error with model ${modelToUse}:`, secondModelError.message);
          
          // If that also fails, try with gpt-4
          try {
            modelToUse = "gpt-4";
            console.log("Attempting with basic model:", modelToUse);
            response = await openai.chat.completions.create({
              model: modelToUse,
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Please analyze this image for signs of AI generation or manipulation."
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: base64Image
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1500,
              response_format: { type: "json_object" }
            });
          } catch (thirdModelError) {
            console.error(`Error with all models:`, thirdModelError.message);
            throw new Error(`Failed to analyze image with any available model: ${thirdModelError.message}`);
          }
        }
      } else {
        // If it's not a model availability issue, rethrow the error
        throw modelError;
      }
    }
    
    console.log(`OpenAI image analysis response received using model: ${modelToUse}`);
    
    // Parse the response
    const analysisResult = JSON.parse(response.choices[0].message.content);
    
    // Add timestamp if not present
    if (!analysisResult.metadata.timestamp) {
      analysisResult.metadata.timestamp = new Date().toISOString();
    }
    
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    
    // Return a fallback response with error information
    return {
      "analysis": {
        "conclusion": {
          "is_likely_ai_generated": false,
          "reliability_score": 50,
          "summary": "Analysis failed due to an error."
        },
        "evidence": {
          "facial_anomalies": [],
          "lighting_issues": [],
          "background_problems": [],
          "digital_artifacts": []
        },
        "technical_assessment": `Error analyzing image: ${error.message}`
      },
      "metadata": {
        "analysis_version": "1.0",
        "timestamp": new Date().toISOString(),
        "error": true,
        "error_message": error.message
      }
    };
  }
};

/**
 * Converts a file to a base64 data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - The base64 data URL
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Checks which vision-capable models are available
 * @returns {Promise<string>} - The best available vision model
 */
const getBestVisionModel = async () => {
  try {
    console.log("Checking available OpenAI vision models...");
    const models = await openai.models.list();
    const modelIds = models.data.map(m => m.id);
    
    console.log("Available models:", modelIds.join(", "));
    
    // Check for models in order of preference
    const visionModels = [
      "gpt-4o", 
      "gpt-4-vision", 
      "gpt-4-turbo", 
      "gpt-4"
    ];
    
    for (const model of visionModels) {
      if (modelIds.includes(model)) {
        console.log(`Selected vision model: ${model}`);
        return model;
      }
    }
    
    // If none of the preferred models are available, return the default
    console.log("No preferred vision models found, using gpt-4o as default");
    return "gpt-4o";
  } catch (error) {
    console.error("Error checking available models:", error);
    console.log("Using gpt-4o as fallback");
    return "gpt-4o";
  }
}; 