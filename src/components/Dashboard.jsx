import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { analyzeArticle, analyzeImage } from '../openai'
import { supabase } from '../supabase'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import AnimatedBackground from '../utils/animatedBackground'
import '../styles/Dashboard.css'

const safeGet = (obj, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    return result === undefined ? defaultValue : result;
  } catch (error) {
    console.error(`Error accessing path ${path}:`, error);
    return defaultValue;
  }
};

const Dashboard = ({ user, scans, fetchScans }) => {
  const [articleText, setArticleText] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [pendingScanId, setPendingScanId] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [activeTab, setActiveTab] = useState('article')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageAnalysisResults, setImageAnalysisResults] = useState(null)
  
  const location = useLocation()
  const navigate = useNavigate()
  const backgroundRef = useRef(null)
  const animatedBgRef = useRef(null)
  const fileInputRef = useRef(null)
  
  // Initialize animated background
  useEffect(() => {
    if (backgroundRef.current) {
      const animatedBg = new AnimatedBackground(backgroundRef.current);
      animatedBgRef.current = animatedBg;
      
      // Clean up on unmount
      return () => {
        if (animatedBgRef.current) {
          animatedBgRef.current.destroy();
        }
      };
    }
  }, []);
  
  // Check for URL parameters when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const urlParam = queryParams.get('url')
    const scanIdParam = queryParams.get('scan_id')
    
    if (urlParam) {
      setArticleUrl(urlParam)
      
      if (scanIdParam) {
        setPendingScanId(scanIdParam)
        // Auto-analyze if we have both URL and scan ID
        fetchArticleContent(urlParam, scanIdParam)
      }
    }
  }, [location])
  
  // Function to fetch article content from URL
  const fetchArticleContent = async (url, scanId) => {
    if (!url) return null;

    setLoading(true);
    setStatusMessage('Fetching article content...');
    try {
      // Use a proxy or CORS-enabled service to fetch the article content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch article content: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.contents) {
        throw new Error('No content returned from proxy');
      }
      
      setStatusMessage('Parsing article content...');
      // Create a temporary DOM element to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Get the page title
      const pageTitle = doc.title || url;
      
      // Remove script tags, style tags, and other non-content elements before extraction
      const elementsToRemove = [
        'script', 'style', 'iframe', 'noscript', 'svg', 'form', 'button',
        '[class*="ad"]', '[class*="Ad"]', '[class*="AD"]', 
        '[id*="ad"]', '[id*="Ad"]', '[id*="AD"]',
        '[class*="promo"]', '[class*="Promo"]', 
        '[class*="banner"]', '[class*="Banner"]',
        '[class*="popup"]', '[class*="Popup"]',
        '[class*="cookie"]', '[class*="Cookie"]',
        '[class*="newsletter"]', '[class*="Newsletter"]',
        '[class*="social"]', '[class*="Social"]',
        '[class*="share"]', '[class*="Share"]',
        '[class*="comment"]', '[class*="Comment"]',
        '[class*="related"]', '[class*="Related"]',
        '[class*="widget"]', '[class*="Widget"]',
        '[class*="sidebar"]', '[class*="Sidebar"]',
        '[aria-hidden="true"]'
      ];
      
      elementsToRemove.forEach(selector => {
        try {
          const elements = doc.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          console.warn(`Error removing elements with selector ${selector}:`, e);
        }
      });
      
      // Extract the article content using similar logic to the extension
      const selectors = [
        'article',
        '[role="article"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content-article',
        '.article-body',
        '.story-body',
        '.post',
        '.news-article',
        '.article',
        '.story',
        '.content',
        '.main-content',
        'main',
        '#content',
        '#main',
        '#article',
        '#story',
        '.news-content',
        '[itemprop="articleBody"]',
        '[data-testid="article-body"]'
      ];
      
      let content = null;
      
      // Try each selector
      for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          // Try to find the largest content block among matching elements
          let bestElement = null;
          let maxLength = 0;
          
          for (const element of elements) {
            const textLength = element.textContent.trim().length;
            if (textLength > maxLength) {
              maxLength = textLength;
              bestElement = element;
            }
          }
          
          if (bestElement && maxLength > 100) {
            content = bestElement.textContent.trim();
            break;
          }
        }
      }
      
      // Fallback: Try to find paragraphs
      if (!content) {
        const paragraphs = Array.from(doc.getElementsByTagName('p'));
        if (paragraphs.length > 0) {
          // Filter out very short paragraphs that might be UI elements
          const contentParagraphs = paragraphs.filter(p => p.textContent.trim().length > 20);
          
          if (contentParagraphs.length > 0) {
            // Try to find paragraphs that are likely part of the main content
            // by looking for paragraphs with similar parent elements
            const parentCounts = {};
            contentParagraphs.forEach(p => {
              const parent = p.parentElement;
              if (parent) {
                const parentTagName = parent.tagName.toLowerCase();
                parentCounts[parentTagName] = (parentCounts[parentTagName] || 0) + 1;
              }
            });
            
            // Find the parent with the most paragraphs
            let bestParentTag = null;
            let maxCount = 0;
            for (const [tag, count] of Object.entries(parentCounts)) {
              if (count > maxCount) {
                maxCount = count;
                bestParentTag = tag;
              }
            }
            
            if (bestParentTag && maxCount >= 3) {
              // Get all paragraphs under the best parent type
              const bestParagraphs = contentParagraphs.filter(p => 
                p.parentElement && p.parentElement.tagName.toLowerCase() === bestParentTag
              );
              
              if (bestParagraphs.length > 0) {
                content = bestParagraphs.map(p => p.textContent.trim()).join('\n\n');
              }
            } else {
              // If we couldn't find a good parent, just use all content paragraphs
              content = contentParagraphs.map(p => p.textContent.trim()).join('\n\n');
            }
          }
        }
      }
      
      // Fallback: Try to get meta description
      if (!content || content.length < 100) {
        const metaDescription = doc.querySelector('meta[name="description"]');
        if (metaDescription && metaDescription.getAttribute('content')) {
          const description = metaDescription.getAttribute('content').trim();
          if (description.length > 0) {
            content = content ? `${description}\n\n${content}` : description;
          }
        }
      }
      
      // Last resort: Try to get text from the body
      if (!content || content.length < 100) {
        // Create a clone of the body to manipulate
        const bodyClone = doc.body.cloneNode(true);
        
        // Remove elements that are unlikely to be part of the main content
        const nonContentSelectors = [
          'header', 'footer', 'nav', 'aside', 
          '.header', '.footer', '.nav', '.sidebar', '.menu',
          '#header', '#footer', '#nav', '#sidebar', '#menu',
          '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
        ];
        
        nonContentSelectors.forEach(selector => {
          const elements = bodyClone.querySelectorAll(selector);
          elements.forEach(el => {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        });
        
        const bodyText = bodyClone.textContent.trim();
        if (bodyText.length > 200) {
          content = bodyText;
        }
      }
      
      if (!content || content.length < 100) {
        throw new Error('Could not extract meaningful content from the article');
      }
      
      // Clean the extracted content to remove unwanted patterns
      content = cleanArticleContent(content);
      
      // Set the article text and URL in the state
      setArticleText(content);
      setArticleUrl(url);
      
      // If we have a scan ID, analyze the article immediately
      if (scanId) {
        analyzeArticleContent(content, url, scanId);
      }
      
      return content;
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error(`Failed to fetch article: ${error.message}`);
      setLoading(false);
      setStatusMessage('');
      return null;
    }
  }
  
  // Function to clean article content by removing unwanted patterns
  const cleanArticleContent = (content) => {
    if (!content) return '';
    
    // Remove JavaScript code patterns
    content = content.replace(/window\.adEntity[\s\S]*?queue\.push\([^)]*\);/g, '');
    content = content.replace(/window\.[\w]+ *?= *?window\.[\w]+ *?\|\| *?{[^}]*};/g, '');
    
    // Remove advertisement markers
    content = content.replace(/Advertisement/g, '');
    
    // Remove common ad-related text
    content = content.replace(/\b(advert(isement)?s?|sponsored|promotion)\b/gi, '');
    
    // Remove lines with very little content (likely UI elements)
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      // Keep lines with substantial content
      return trimmed.length > 20 || 
             // Or lines that look like part of paragraphs
             (trimmed.length > 0 && 
              !trimmed.match(/^[^a-zA-Z]*$/) && // Not just symbols
              !trimmed.match(/^\d+$/) && // Not just numbers
              !trimmed.match(/^[A-Z\s]+$/) && // Not just uppercase (likely headers)
              !trimmed.match(/^(©|copyright|\|)/i)); // Not copyright or separators
    });
    
    // Join the filtered lines back together
    content = filteredLines.join('\n');
    
    // Remove excessive whitespace
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.trim();
    
    return content;
  }
  
  // Function to analyze article content
  const analyzeArticleContent = async (content, url, scanId) => {
    if (content.trim().length < 50) {
      toast.error("The article content is too short or empty to analyze");
      setLoading(false);
      setAnalyzing(false);
      setStatusMessage('');
      return;
    }
    
    setAnalyzing(true)
    setStatusMessage('Analyzing article for misinformation...')
    
    try {
      // Analyze the article with OpenAI
      const analysisResult = await analyzeArticle(content)
      setCurrentAnalysis(analysisResult)
      
      // Update the scan in Supabase with the content and analysis
      setStatusMessage('Saving analysis results...')
      
      const updateData = {
        content: content,
        analysis: analysisResult
      }
      
      // If we're creating a new scan (no scanId provided)
      if (!scanId) {
        updateData.source = 'website'
        updateData.article_url = url
        updateData.user_id = user.id
        
      const { data, error } = await supabase
        .from('scans')
          .insert([updateData])
        .select()

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
      } else {
        // Update existing scan
          const { data, error } = await supabase
            .from('scans')
          .update(updateData)
          .eq('id', scanId)
          .eq('user_id', user.id)
            
          if (error) {
          throw new Error(`Supabase error: ${error.message}`)
        }
      }
      
      toast.success('Article analyzed successfully!')
      
      // Update URL to remove query parameters
      navigate('/dashboard', { replace: true })
      
      // Refresh the scans list
      fetchScans()
      
    } catch (error) {
      console.error("Error analyzing article:", error)
      toast.error(`Analysis failed: ${error.message}`)
    } finally {
      setLoading(false)
      setAnalyzing(false)
      setStatusMessage('')
    }
  }

  const handleScan = async () => {
    if (!articleText.trim() && !articleUrl.trim()) {
      toast.error('Please enter article text or URL');
      return;
    }

    setLoading(true);
    
    try {
      let contentToAnalyze = articleText.trim();
      let urlToUse = articleUrl.trim();
      
      // If URL is provided but no text, fetch the content first
      if (urlToUse && !contentToAnalyze) {
        setStatusMessage('Fetching article content from URL...');
        const fetchedContent = await fetchArticleContent(urlToUse);
        if (!fetchedContent) {
          return; // Error already handled in fetchArticleContent
        }
        contentToAnalyze = fetchedContent;
      }
      
      // If we have content to analyze, proceed with analysis
      if (contentToAnalyze) {
        // If no URL was provided but we have text, use a placeholder URL
        if (!urlToUse) {
          urlToUse = 'manual-entry-' + new Date().toISOString();
        }
        
        // Analyze the content
        await analyzeArticleContent(contentToAnalyze, urlToUse);
      } else {
        toast.error('No content available to analyze');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in handleScan:', error);
      toast.error(`Scan failed: ${error.message}`);
      setLoading(false);
      setStatusMessage('');
    }
  }

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  // New function to handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select a valid image file');
      }
    }
  };

  // New function to handle image analysis
  const handleImageAnalysis = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to analyze');
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    setStatusMessage('Analyzing image for AI generation or manipulation...');
    setImageAnalysisResults(null);

    try {
      // Call the analyzeImage function from openai.js
      const results = await analyzeImage(selectedImage);
      
      // Save the results to state
      setImageAnalysisResults(results);
      
      // Save the analysis to Supabase
      await saveImageAnalysisToSupabase(selectedImage, results);
      
      toast.success('Image analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Provide more specific error messages based on the error
      if (error.message.includes('deprecated')) {
        toast.error('The AI model is deprecated. Please try again as the system attempts to use an alternative model.');
      } else if (error.message.includes('not found')) {
        toast.error('The AI model is not available. Please try again as the system attempts to use an alternative model.');
      } else if (error.message.includes('timeout')) {
        toast.error('The analysis timed out. Please try with a smaller image or try again later.');
      } else if (error.message.includes('content policy')) {
        toast.error('The image could not be analyzed due to content policy restrictions.');
      } else {
        toast.error(`Analysis failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setAnalyzing(false);
      setStatusMessage('');
    }
  };

  // Function to save image analysis to Supabase
  const saveImageAnalysisToSupabase = async (imageFile, analysis) => {
    try {
      // Convert image to base64 for storage
      const base64Image = await fileToBase64(imageFile);
      
      const analysisData = {
        user_id: user.id,
        source: 'image_analysis',
        content: imageFile.name,
        analysis: analysis,
        created_at: new Date().toISOString(),
        image_data: base64Image
      };
      
      const { data, error } = await supabase
        .from('scans')
        .insert([analysisData])
        .select();
        
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      console.log('Image analysis saved to Supabase:', data);
      
      // Refresh the scans list
      fetchScans();
      
    } catch (error) {
      console.error('Error saving image analysis to Supabase:', error);
      toast.error('Failed to save analysis results');
    }
  };
  
  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="dashboard-container">
      {/* Animated Background */}
      <div className="animated-background" ref={backgroundRef}></div>
      
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <h1>Exposé</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/history" className="nav-link">History</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
      </div>
      </nav>
      
      <div className="dashboard-content">
        {/* Tabs */}
        <div className="analysis-tabs">
          <button 
            className={`tab-button ${activeTab === 'article' ? 'active' : ''}`}
            onClick={() => setActiveTab('article')}
          >
            Article Analysis
          </button>
          <button 
            className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            Image Analysis
          </button>
        </div>

        {/* Article Analysis Section */}
        {activeTab === 'article' && (
          <div className="analysis-card">
            <h2 className="card-title">Analyze Article</h2>
            
            <div className="form-group">
              <label htmlFor="articleUrl">Article URL</label>
              <input
                type="text"
                name="articleUrl"
                id="articleUrl"
                className="form-input"
                placeholder="https://example.com/article"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                disabled={loading}
              />
              <p className="form-help">Enter the URL of the article you want to analyze</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="articleText">Or paste article text</label>
              <textarea
                id="articleText"
                name="articleText"
                rows={6}
                className="form-textarea"
                placeholder="Paste the article text here..."
                value={articleText}
                onChange={(e) => setArticleText(e.target.value)}
                disabled={loading}
              />
              <p className="form-help">You can either enter a URL above or paste the article text directly</p>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="analyze-button"
                onClick={handleScan}
                disabled={loading || analyzing || (!articleText.trim() && !articleUrl.trim())}
              >
                {loading || analyzing ? (
                  <>
                    <span className="spinner"></span>
                    {analyzing ? 'Analyzing...' : 'Loading...'}
                  </>
                ) : (
                  'Analyze Article'
                )}
              </button>
            </div>
            
            {(loading || analyzing) && statusMessage && (
              <div className="status-message">
                <p>{statusMessage}</p>
                <div className="progress-bar">
                  <div className="progress-bar-inner"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Analysis Section */}
        {activeTab === 'image' && (
          <div className="analysis-card">
            <h2 className="card-title">Analyze Image</h2>
            
            <div className="form-group">
              <label htmlFor="imageUpload">Upload Image</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                  className="file-input"
                  disabled={loading}
                />
                <button 
                  className="upload-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                >
                  Choose Image
                </button>
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>
              <p className="form-help">Select an image to analyze for potential manipulation or misinformation</p>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="analyze-button"
                onClick={handleImageAnalysis}
                disabled={loading || analyzing || !selectedImage}
              >
                {loading || analyzing ? (
                  <>
                    <span className="spinner"></span>
                    {analyzing ? 'Analyzing...' : 'Loading...'}
                  </>
                ) : (
                  'Analyze Image'
                )}
              </button>
            </div>
            
            {/* Image Analysis Results */}
            {imageAnalysisResults && (
              <div className="image-analysis-results">
                <h3>AI Detection Results</h3>
                
                <div className="result-section">
                  <div className="conclusion-section">
                    <div className="conclusion-header">
                      <h4>Conclusion</h4>
                      <div className="confidence-meter">
                        <div className="meter-bar">
                          <div 
                            className={`meter-fill ${
                              imageAnalysisResults.analysis.conclusion.is_likely_ai_generated ? 'low' : 'high'
                            }`}
                            style={{ width: `${imageAnalysisResults.analysis.conclusion.reliability_score}%` }}
                          ></div>
                        </div>
                        <span className="meter-value">
                          {Math.round(imageAnalysisResults.analysis.conclusion.reliability_score)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="conclusion-result">
                      <div className={`result-badge ${imageAnalysisResults.analysis.conclusion.is_likely_ai_generated ? 'ai-generated' : 'authentic'}`}>
                        {imageAnalysisResults.analysis.conclusion.is_likely_ai_generated ? 'Likely AI-Generated' : 'Likely Authentic'}
                      </div>
                    </div>
                    
                    <p className="conclusion-summary">
                      {imageAnalysisResults.analysis.conclusion.summary}
                    </p>
                  </div>
                </div>
                
                <div className="result-section">
                  <h4>Evidence</h4>
                  
                  <div className="evidence-grid">
                    {Object.entries(imageAnalysisResults.analysis.evidence).map(([category, items]) => (
                      items.length > 0 && (
                        <div key={category} className="evidence-card">
                          <h5>{category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h5>
                          <ul className="evidence-list">
                            {items.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ))}
                  </div>
                </div>
                
                <div className="result-section">
                  <h4>Technical Assessment</h4>
                  <p className="technical-assessment">
                    {imageAnalysisResults.analysis.technical_assessment}
                  </p>
                </div>
                
                <div className="result-footer">
                  <p className="analysis-timestamp">
                    Analysis performed: {new Date(imageAnalysisResults.metadata.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentAnalysis && currentAnalysis.analysis ? (
          <div className="results-card">
            <h2 className="card-title">Analysis Results</h2>
            
            <div className="result-section">
              <h3>Overall Reliability</h3>
              <div className="reliability-meter">
                <div className="meter-bar">
                  <div 
                    className={`meter-fill ${
                      currentAnalysis.analysis.overall_reliability.score >= 75 ? 'high' :
                      currentAnalysis.analysis.overall_reliability.score >= 50 ? 'medium' :
                      'low'
                        }`}
                        style={{ width: `${currentAnalysis.analysis.overall_reliability.score}%` }}
                      ></div>
                    </div>
                <span className="meter-value">
                {currentAnalysis.analysis.overall_reliability.score}%
              </span>
            </div>
              <p className="category-label">
              Category: {currentAnalysis.analysis.overall_reliability.category}
            </p>
          </div>
          
            <div className="result-section">
              <h3>Reliability Scores</h3>
              <div className="scores-grid">
                {Object.entries(safeGet(currentAnalysis, 'analysis.reliability_scores', {})).map(([key, value]) => (
                  <div key={key} className="score-card">
                    <div className="score-header">
                      <span className="score-name">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                      <span className="score-value">
                        {safeGet(value, 'score', 0)}/10
                    </span>
                  </div>
                    <div className="score-bar">
                      <div 
                        className={`score-fill ${
                          safeGet(value, 'score', 0) >= 7.5 ? 'high' :
                          safeGet(value, 'score', 0) >= 5 ? 'medium' :
                          'low'
                        }`}
                        style={{ width: `${safeGet(value, 'score', 0) * 10}%` }}
                    ></div>
                    </div>
                    <div className="score-details">
                      <p className="score-confidence">Confidence: {safeGet(value, 'confidence', 0)}%</p>
                      <p className="score-explanation">{safeGet(value, 'reasoning', 'No explanation provided.')}</p>
                    </div>
                </div>
              ))}
            </div>
                </div>

            <div className="result-section">
              <h3>Bias Indicators</h3>
              <div className="bias-list">
                {/* Political Bias */}
                <div className="bias-item">
                  <div className="bias-header">
                    <div className={`severity-indicator ${
                      safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.detected', false) ? 
                      (safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.strength') === 'strong' ? 'high' :
                       safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.strength') === 'moderate' ? 'medium' : 'low') : 
                      'low'
                    }`}></div>
                    <div className="bias-content">
                      <p className="bias-description">
                        <strong>Political Bias: </strong>
                        {safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.detected', false) ? 
                          `${safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.direction', 'Unknown')} (${safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.strength', 'Unknown')})` : 
                          'No significant political bias detected'}
                      </p>
                      {safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.examples', []).length > 0 && (
                        <p className="bias-evidence">
                          <span className="evidence-label">Examples:</span> {safeGet(currentAnalysis, 'analysis.bias_indicators.political_bias.examples', []).join(', ')}
                        </p>
                      )}
                      </div>
                  </div>
                </div>

                {/* Emotional Manipulation */}
                <div className="bias-item">
                  <div className="bias-header">
                    <div className={`severity-indicator ${
                      safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.detected', false) ? 'medium' : 'low'
                    }`}></div>
                    <div className="bias-content">
                      <p className="bias-description">
                        <strong>Emotional Manipulation: </strong>
                        {safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.detected', false) ? 
                          'Detected' : 'No significant emotional manipulation detected'}
                      </p>
                      {safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.detected', false) && 
                       safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.techniques', []).length > 0 && (
                        <p className="bias-evidence">
                          <span className="evidence-label">Techniques:</span> {safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.techniques', []).join(', ')}
                        </p>
                      )}
                      {safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.examples', []).length > 0 && (
                        <p className="bias-context">
                          <span className="context-label">Examples:</span> {safeGet(currentAnalysis, 'analysis.bias_indicators.emotional_manipulation.examples', []).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
            <div className="result-section">
              <h3>Identified Claims</h3>
              <div className="claims-list">
                {safeGet(currentAnalysis, 'analysis.identified_claims', []).length > 0 ? (
                  safeGet(currentAnalysis, 'analysis.identified_claims', []).map((claim, index) => (
                    <div key={index} className="claim-item">
                      <div className="claim-header">
                        <div className={`severity-indicator ${
                          safeGet(claim, 'accuracy', '').toLowerCase().includes('true') || 
                          safeGet(claim, 'accuracy', '').toLowerCase().includes('accurate') ? 'high' :
                          safeGet(claim, 'accuracy', '').toLowerCase().includes('misleading') || 
                          safeGet(claim, 'accuracy', '').toLowerCase().includes('partial') ? 'medium' : 'low'
                        }`}></div>
                        <div className="claim-content">
                          <p className="claim-text">"{safeGet(claim, 'claim', 'No claim text')}"</p>
                          <p className="claim-accuracy">
                            <span className="accuracy-label">Accuracy:</span> 
                            <span className={`accuracy-value ${
                              safeGet(claim, 'accuracy', '').toLowerCase().includes('true') || 
                              safeGet(claim, 'accuracy', '').toLowerCase().includes('accurate') ? 'accurate' :
                              safeGet(claim, 'accuracy', '').toLowerCase().includes('misleading') || 
                              safeGet(claim, 'accuracy', '').toLowerCase().includes('partial') ? 'misleading' : 'inaccurate'
                            }`}>
                              {safeGet(claim, 'accuracy', 'Unknown')}
                  </span>
                          </p>
                          {safeGet(claim, 'evidence', '') && (
                            <p className="claim-evidence">
                              <span className="evidence-label">Evidence:</span> {safeGet(claim, 'evidence', '')}
                            </p>
                          )}
                          {safeGet(claim, 'context_notes', '') && (
                            <p className="claim-context">
                              <span className="context-label">Context:</span> {safeGet(claim, 'context_notes', '')}
                            </p>
                          )}
                </div>
                    </div>
                    </div>
                  ))
                ) : (
                  <p className="no-claims">No specific claims were identified in this article.</p>
                )}
            </div>
          </div>
          
            <div className="result-section">
              <h3>Recommendation</h3>
              <p className="recommendation-text">
              {currentAnalysis.analysis.recommendation}
            </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Dashboard 