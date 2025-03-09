// Article text extraction service
class ArticleExtractor {
  static async getMainContent() {
    try {
      // Wait a moment for dynamic content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the hostname to apply site-specific selectors
      const hostname = window.location.hostname;
      
      // Site-specific selectors for major news sites
      const siteSpecificSelectors = {
        'edition.cnn.com': ['.article__content', '.article__main', '.zn-body__paragraph', '.zn-body-text'],
        'www.cnn.com': ['.article__content', '.article__main', '.zn-body__paragraph', '.zn-body-text'],
        'www.nytimes.com': ['.article-content', '.meteredContent', '.StoryBodyCompanionColumn'],
        'www.washingtonpost.com': ['.article-body', '.teaser-content', '.story-body'],
        'www.bbc.com': ['.article__body-content', '.ssrcss-11r1m41-RichTextComponentWrapper'],
        'www.reuters.com': ['.article-body__content', '.article-body'],
        'www.theguardian.com': ['.article-body-commercial-selector', '.content__article-body'],
        'www.foxnews.com': ['.article-body', '.article-content'],
        'www.nbcnews.com': ['.article-body__content', '.article-body'],
        'www.cbsnews.com': ['.content__body', '.content-article-body']
      };
      
      // Get site-specific selectors if available
      let prioritySelectors = [];
      for (const site in siteSpecificSelectors) {
        if (hostname.includes(site)) {
          prioritySelectors = siteSpecificSelectors[site];
          console.log(`Using site-specific selectors for ${site}`);
          break;
        }
      }
      
      // Combine with general article selectors
      const selectors = [
        // Site-specific selectors first
        ...prioritySelectors,
        // Specific article content selectors
        '[itemprop="articleBody"]',
        '[data-testid="article-body"]',
        '.article-body',
        '.article__body',
        '.story-body',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.content-article',
        '.main-content article',
        // More general selectors as fallbacks
        'article',
        '[role="article"]',
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
        '.news-content'
      ];

      // Elements to remove from content (common non-article elements)
      const elementsToRemove = [
        // Navigation, headers, footers
        'header:not(article header)', 'footer:not(article footer)', 'nav', 'aside',
        '.header:not(.article-header)', '.footer', '.nav', '.sidebar', '.menu', '.comments', '.comment-section',
        '#header', '#footer', '#nav', '#sidebar', '#menu', '#comments',
        // Social sharing, ads, related content
        '.social-share', '.share-buttons', '.sharing', '.social-media', 
        '.advertisement', '.ad-container', '.ad', '.ads', '.advert', '[class*="ad-"]', '[id*="ad-"]',
        '.related-articles', '.related-posts', '.related-content', '.recommendations', '.suggested',
        // Author info, dates, tags that aren't part of the main content
        '.author-bio:not(.article-author-bio)', '.author-info:not(.article-author-info)', 
        '.tags:not(.article-tags)', '.categories:not(.article-categories)',
        // Newsletter signup, subscription forms
        '.newsletter', '.subscribe', '.subscription', '.signup-form',
        // Popups, modals
        '.popup', '.modal', '.overlay',
        // Video players and media elements
        '.video-container:not(.article-video)', '.player:not(.article-player)',
        // Generic utility classes often used for non-content
        '.utility-bar', '.toolbar', '.actions', '.buttons',
        // CNN specific elements
        '.el__embedded', '.el__video--standard', '.el__storyelement--standard', '.zn-body__read-more',
        '.zn-body__read-all', '.el__article--embed', '.el__leafmedia', '.ad-feedback',
        '.video__end-slate', '.related-content', '.related-links', '.outbrain', '.taboola',
        // Common elements with "feedback", "promo", "newsletter" in class or id
        '[class*="feedback"]', '[id*="feedback"]',
        '[class*="promo"]', '[id*="promo"]',
        '[class*="newsletter"]', '[id*="newsletter"]'
      ];

      // Try to handle lazy-loaded content
      const waitForMoreContent = async () => {
        const initialHeight = document.body.scrollHeight;
        
        // Scroll down to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight / 2);
        await new Promise(resolve => setTimeout(resolve, 500));
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Scroll back to top
        window.scrollTo(0, 0);
        
        // Check if scrolling triggered more content loading
        return document.body.scrollHeight > initialHeight;
      };
      
      // Try to load more content
      await waitForMoreContent();

      // Try each selector to find the article content
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Try to find the best content block among matching elements
          let bestElement = null;
          let maxScore = 0;
          
          for (const element of elements) {
            // Clone the element to clean it up
            const clone = element.cloneNode(true);
            
            // Remove non-content elements from the clone
            elementsToRemove.forEach(removeSelector => {
              const removeElements = clone.querySelectorAll(removeSelector);
              removeElements.forEach(el => el.remove());
            });
            
            // Calculate a score based on content quality
            const paragraphs = clone.querySelectorAll('p');
            const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const textLength = clone.textContent.trim().length;
            const paragraphCount = paragraphs.length;
            const headingCount = headings.length;
            
            // Calculate average paragraph length (in words)
            const avgWordsPerParagraph = paragraphCount > 0 ? 
              Array.from(paragraphs).reduce((sum, p) => sum + p.textContent.trim().split(/\s+/).filter(w => w.length > 0).length, 0) / paragraphCount : 0;
            
            // Score formula: prioritize content with many paragraphs, headings, and good paragraph length
            const score = textLength * 0.2 + paragraphCount * 25 + headingCount * 30 + avgWordsPerParagraph * 15;
            
            if (score > maxScore) {
              maxScore = score;
              bestElement = clone;
            }
          }
          
          if (bestElement && maxScore > 100) {
            console.log(`Found content using selector: ${selector}, score: ${maxScore}`);
            
            // Extract only the article text, preserving paragraph structure
            // First, try to get all paragraphs and headings
            const contentElements = bestElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
            
            if (contentElements.length > 0) {
              // Filter out paragraphs that are likely not part of the main content
              const validContentElements = Array.from(contentElements).filter(el => {
                const text = el.textContent.trim();
                // Skip empty or very short paragraphs
                if (text.length < 10) return false;
                
                // Skip paragraphs that are likely navigation, ads, etc.
                const words = text.split(/\s+/).filter(w => w.length > 0);
                if (words.length < 3) return false;
                
                // Skip paragraphs with common ad/navigation text
                const lowerText = text.toLowerCase();
                if (
                  lowerText.includes('advertisement') ||
                  lowerText.includes('sponsored') ||
                  lowerText.includes('subscribe') ||
                  lowerText.includes('sign up') ||
                  lowerText.includes('follow us') ||
                  lowerText.includes('share this')
                ) return false;
                
                return true;
              });
              
              if (validContentElements.length > 0) {
                // Get text from paragraphs and headings, preserving structure
                return validContentElements
                  .map(el => {
                    // Add special formatting for headings
                    if (el.tagName.toLowerCase().startsWith('h')) {
                      return `## ${el.textContent.trim()} ##`;
                    }
                    // Regular paragraph
                    return el.textContent.trim();
                  })
                  .join('\n\n');
              }
            }
            
            // If no paragraphs found, try to extract text directly
            // First, remove any remaining non-content elements
            const nonContentTextPatterns = [
              /related:/i, /read more:/i, /more:/i, /see also:/i, /watch:/i,
              /follow us on/i, /share this/i, /subscribe/i, /sign up/i,
              /advertisement/i, /sponsored/i, /recommended/i, /popular/i,
              /most read/i, /trending/i, /latest/i, /breaking/i,
              /copyright/i, /all rights reserved/i, /terms of use/i, /privacy policy/i
            ];
            
            // Get the text and clean it up
            let text = bestElement.textContent.trim();
            
            // Remove common non-content text patterns
            nonContentTextPatterns.forEach(pattern => {
              text = text.replace(pattern, '');
            });
            
            // Split by periods and newlines to create paragraphs
            const sentences = text.split(/(?:\.|\n)+/).filter(s => s.trim().length > 0);
            return sentences.map(s => s.trim()).join('.\n\n');
          }
        }
      }

      // Fallback: Try to find the largest text block by paragraphs
      console.log("No content found with selectors, trying paragraphs...");
      const paragraphs = Array.from(document.getElementsByTagName('p'));
      if (paragraphs.length > 0) {
        // Filter out very short paragraphs that might be UI elements
        const contentParagraphs = paragraphs.filter(p => {
          // Skip paragraphs that are likely not part of the main content
          const parent = p.parentElement;
          if (parent) {
            const parentClasses = parent.className.toLowerCase();
            if (parentClasses.includes('comment') || 
                parentClasses.includes('footer') || 
                parentClasses.includes('sidebar') ||
                parentClasses.includes('nav') ||
                parentClasses.includes('menu') ||
                parentClasses.includes('header') ||
                parentClasses.includes('ad')) {
              return false;
            }
          }
          
          // Check paragraph content quality
          const text = p.textContent.trim();
          const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
          
          // Skip paragraphs with common ad/navigation text
          const lowerText = text.toLowerCase();
          if (
            lowerText.includes('advertisement') ||
            lowerText.includes('sponsored') ||
            lowerText.includes('subscribe') ||
            lowerText.includes('sign up') ||
            lowerText.includes('follow us') ||
            lowerText.includes('share this')
          ) return false;
          
          return text.length > 20 && wordCount > 5;
        });
        
        if (contentParagraphs.length > 0) {
          console.log(`Found ${contentParagraphs.length} paragraphs with content`);
          
          // Try to find paragraphs that are likely part of the main content
          // by looking for paragraphs with similar parent elements
          const parentCounts = {};
          contentParagraphs.forEach(p => {
            const parent = p.parentElement;
            if (parent) {
              const parentSelector = getElementSelector(parent);
              parentCounts[parentSelector] = (parentCounts[parentSelector] || 0) + 1;
            }
          });
          
          // Find the parent with the most paragraphs
          let bestParentSelector = null;
          let maxCount = 0;
          for (const [selector, count] of Object.entries(parentCounts)) {
            if (count > maxCount) {
              maxCount = count;
              bestParentSelector = selector;
            }
          }
          
          if (bestParentSelector && maxCount >= 3) {
            // Get all paragraphs under the best parent
            const bestParent = document.querySelector(bestParentSelector);
            if (bestParent) {
              const bestParagraphs = Array.from(bestParent.querySelectorAll('p'))
                .filter(p => {
                  const text = p.textContent.trim();
                  return text.length > 20 && !text.toLowerCase().includes('advertisement');
                });
              
              if (bestParagraphs.length > 0) {
                console.log(`Found ${bestParagraphs.length} paragraphs under best parent: ${bestParentSelector}`);
                return bestParagraphs.map(p => p.textContent.trim()).join('\n\n');
              }
            }
          }
          
          // If we couldn't find a good parent, just use all content paragraphs
          return contentParagraphs.map(p => p.textContent.trim()).join('\n\n');
        }
      }

      // Try to find divs with substantial text content
      console.log("No paragraphs found, trying divs with text content...");
      const divs = Array.from(document.getElementsByTagName('div'));
      const contentDivs = divs.filter(div => {
        // Skip divs that are likely navigation, headers, footers, etc.
        const classNames = div.className.toLowerCase();
        if (classNames.includes('nav') || 
            classNames.includes('header') || 
            classNames.includes('footer') || 
            classNames.includes('menu') || 
            classNames.includes('sidebar') ||
            classNames.includes('comment') ||
            classNames.includes('ad') ||
            classNames.includes('related') ||
            classNames.includes('recommend') ||
            classNames.includes('share') ||
            classNames.includes('social')) {
          return false;
        }
        
        // Check if div has substantial text content
        const text = div.textContent.trim();
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        
        // Skip divs with common ad/navigation text
        const lowerText = text.toLowerCase();
        if (
          lowerText.includes('advertisement') ||
          lowerText.includes('sponsored') ||
          lowerText.includes('subscribe') ||
          lowerText.includes('sign up') ||
          lowerText.includes('follow us') ||
          lowerText.includes('share this')
        ) return false;
        
        return text.length > 200 && wordCount > 50;
      });
      
      if (contentDivs.length > 0) {
        // Sort by content quality (combination of length and paragraph density)
        contentDivs.sort((a, b) => {
          const aText = a.textContent.trim();
          const bText = b.textContent.trim();
          const aParagraphs = a.querySelectorAll('p').length;
          const bParagraphs = b.querySelectorAll('p').length;
          
          // Score based on text length and paragraph count
          const aScore = aText.length * 0.3 + aParagraphs * 20;
          const bScore = bText.length * 0.3 + bParagraphs * 20;
          
          return bScore - aScore;
        });
        
        console.log(`Found ${contentDivs.length} divs with substantial content`);
        
        // Extract paragraphs from the best div if available
        const bestDiv = contentDivs[0];
        const paragraphs = bestDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        
        if (paragraphs.length > 0) {
          return Array.from(paragraphs)
            .filter(el => {
              const text = el.textContent.trim();
              return text.length > 10 && !text.toLowerCase().includes('advertisement');
            })
            .map(el => {
              // Add special formatting for headings
              if (el.tagName.toLowerCase().startsWith('h')) {
                return `## ${el.textContent.trim()} ##`;
              }
              // Regular paragraph
              else {
                return el.textContent.trim();
              }
            })
            .join('\n\n');
        }
        
        return bestDiv.textContent.trim();
      }

      // Last resort: Try to get text from the body, excluding common non-content elements
      console.log("No content divs found, trying filtered body text...");
      const body = document.body;
      
      // Create a clone of the body to manipulate
      const bodyClone = body.cloneNode(true);
      
      // Remove elements that are unlikely to be part of the main content
      const nonContentSelectors = [
        'header', 'footer', 'nav', 'aside', 
        '.header', '.footer', '.nav', '.sidebar', '.menu',
        '#header', '#footer', '#nav', '#sidebar', '#menu',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '.comments', '.comment-section', '#comments',
        '.social-share', '.share-buttons', '.sharing', '.social-media',
        '.advertisement', '.ad-container', '.ad', '.ads', '.advert',
        '.related-articles', '.related-posts', '.related-content',
        '.newsletter', '.subscribe', '.subscription',
        '.popup', '.modal', '.overlay',
        // Common elements with "feedback", "promo", "newsletter" in class or id
        '[class*="feedback"]', '[id*="feedback"]',
        '[class*="promo"]', '[id*="promo"]',
        '[class*="newsletter"]', '[id*="newsletter"]',
        // CNN specific elements
        '.el__embedded', '.el__video--standard', '.el__storyelement--standard', '.zn-body__read-more',
        '.zn-body__read-all', '.el__article--embed', '.el__leafmedia', '.ad-feedback',
        '.video__end-slate', '.related-content', '.related-links', '.outbrain', '.taboola'
      ];
      
      nonContentSelectors.forEach(selector => {
        const elements = bodyClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
      
      // Try to extract paragraphs from the cleaned body
      const bodyParagraphs = bodyClone.querySelectorAll('p');
      if (bodyParagraphs.length > 0) {
        const contentParagraphs = Array.from(bodyParagraphs)
          .filter(p => {
            const text = p.textContent.trim();
            return text.length > 20 && !text.toLowerCase().includes('advertisement');
          });
          
        if (contentParagraphs.length > 0) {
          return contentParagraphs.map(p => p.textContent.trim()).join('\n\n');
        }
      }
      
      // If no paragraphs, use the cleaned body text
      const bodyText = bodyClone.textContent.trim();
      if (bodyText.length > 200) {
        // Clean up the text
        let cleanedText = bodyText;
        
        // Remove common non-content text patterns
        const nonContentTextPatterns = [
          /related:/i, /read more:/i, /more:/i, /see also:/i, /watch:/i,
          /follow us on/i, /share this/i, /subscribe/i, /sign up/i,
          /advertisement/i, /sponsored/i, /recommended/i, /popular/i,
          /most read/i, /trending/i, /latest/i, /breaking/i,
          /copyright/i, /all rights reserved/i, /terms of use/i, /privacy policy/i
        ];
        
        nonContentTextPatterns.forEach(pattern => {
          cleanedText = cleanedText.replace(pattern, '');
        });
        
        // Split by periods and newlines to create paragraphs
        const sentences = cleanedText.split(/(?:\.|\n)+/).filter(s => s.trim().length > 0);
        return sentences.map(s => s.trim()).join('.\n\n');
      }

      console.log("No content found");
      return null;
    } catch (error) {
      console.error("Error extracting content:", error);
      return null;
    }
  }

  static getImageAltText() {
    try {
      const images = Array.from(document.getElementsByTagName('img'));
      const altTexts = images
        .filter(img => img.alt && img.alt.trim().length > 0)
        .map(img => img.alt.trim());
      
      console.log(`Found ${altTexts.length} images with alt text`);
      return altTexts.join('\n');
    } catch (error) {
      console.error("Error extracting image alt text:", error);
      return "";
    }
  }
  
  static getMetaDescription() {
    try {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && metaDescription.getAttribute('content')) {
        return metaDescription.getAttribute('content').trim();
      }
      return "";
    } catch (error) {
      console.error("Error extracting meta description:", error);
      return "";
    }
  }
}

// Helper function to get a unique selector for an element
function getElementSelector(element) {
  if (!element) return '';
  
  // Try to use ID if available
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Use tag name and classes
  let selector = element.tagName.toLowerCase();
  if (element.className) {
    const classes = element.className.split(' ')
      .filter(c => c.trim().length > 0)
      .map(c => `.${c.trim()}`)
      .join('');
    selector += classes;
  }
  
  return selector;
}

// Flag to track if the content script is already initialized
let isInitialized = false;

// Initialize the content script
function initializeContentScript() {
  if (isInitialized) return;
  
  console.log("Exposé content script loaded");
  console.log("Article Scanner content script loaded");
  
  // Set up message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);
    
    // Simple ping to check if content script is loaded
    if (request.action === 'ping') {
      console.log("Ping received, responding with pong");
      sendResponse({ status: 'pong' });
      return true;
    }
    
    if (request.action === 'scanArticle') {
      const handleScan = async () => {
        try {
          console.log("Starting article scan...");
          
          // Get the current URL
          const articleUrl = window.location.href;
          console.log("Article URL:", articleUrl);
          
          if (!articleUrl) {
            console.error("Could not get article URL");
            sendResponse({
              success: false,
              error: 'Could not get article URL'
            });
            return;
          }
  
          // Get the page title
          const pageTitle = document.title || "Unknown Article";
          
          // Extract the article content
          console.log("Extracting article content...");
          let articleContent = await ArticleExtractor.getMainContent();
          
          // If main content extraction failed or is too short, try to supplement with meta description
          if (!articleContent || articleContent.length < 100) {
            console.log("Main content extraction failed or content too short, trying to supplement...");
            
            const metaDescription = ArticleExtractor.getMetaDescription();
            if (metaDescription && metaDescription.length > 0) {
              console.log("Found meta description:", metaDescription);
              
              if (!articleContent) {
                articleContent = metaDescription;
              } else {
                articleContent = metaDescription + "\n\n" + articleContent;
              }
            }
          }
          
          // Clean up the extracted content
          if (articleContent) {
            // Remove any special formatting we added during extraction
            articleContent = articleContent.replace(/## (.*?) ##/g, '$1');
            
            // Remove common non-article phrases and patterns
            const phrasesToRemove = [
              // Navigation elements
              'Click here', 'Tap here', 'Read more', 'More:', 'Related:', 'See also:',
              // Social media
              'Follow us', 'Share this', 'Like us on', 'Tweet', 'Pin it',
              // Subscription/newsletter
              'Subscribe to', 'Sign up for', 'Join our newsletter', 'Get updates',
              // Copyright/legal
              'All rights reserved', '© 20', 'Copyright 20', 'Terms of use', 'Privacy policy',
              // Comments
              'Leave a comment', 'Comments', 'What do you think?',
              // Author/publication info that's not part of the article
              'Published by', 'Written by', 'Reported by', 'Edited by',
              // CNN specific
              'CNN\'s', 'CNN —', 'CNN', 'Editor\'s Note', 'Editor\'s note',
              // Common news site phrases
              'contributed to this report', 'contributed to this article',
              'reporting contributed', 'reporting from', 'reporting by',
              // Image captions often included by mistake
              'Photo:', 'Image:', 'Credit:', 'Photo by', 'Image by', 'Picture:'
            ];
            
            // Create a regex pattern to match these phrases (case insensitive)
            const phrasePattern = new RegExp(phrasesToRemove.map(phrase => 
              `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
            ).join('|'), 'gi');
            
            // Remove the phrases
            articleContent = articleContent.replace(phrasePattern, '');
            
            // Remove URLs
            articleContent = articleContent.replace(/https?:\/\/\S+/g, '');
            
            // Remove email addresses
            articleContent = articleContent.replace(/\S+@\S+\.\S+/g, '');
            
            // Remove lines that are likely not part of the article
            articleContent = articleContent.split('\n')
              .filter(line => {
                const trimmed = line.trim();
                // Skip empty lines
                if (trimmed.length === 0) return false;
                
                // Skip very short lines (likely navigation or UI elements)
                if (trimmed.length < 20 && !trimmed.endsWith('.') && !trimmed.endsWith('?') && !trimmed.endsWith('!')) {
                  return false;
                }
                
                // Skip lines with common non-article text
                const lower = trimmed.toLowerCase();
                if (
                  lower.includes('advertisement') ||
                  lower.includes('sponsored') ||
                  lower.includes('copyright') ||
                  lower.includes('all rights reserved') ||
                  lower.includes('terms of use') ||
                  lower.includes('privacy policy')
                ) {
                  return false;
                }
                
                return true;
              })
              .join('\n');
            
            // Fix spacing issues
            articleContent = articleContent
              // Remove excessive whitespace
              .replace(/\s+/g, ' ')
              // Fix spacing after periods, question marks, and exclamation points
              .replace(/([.?!])\s*/g, '$1 ')
              // Trim each line
              .split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n\n')
              // Final trim
              .trim();
          }
          
          // If still too short, try to extract all visible text as a last resort
          if (!articleContent || articleContent.length < 100) {
            console.log("Content still too short, extracting all visible text as last resort...");
            
            // Function to get all visible text
            const getVisibleText = (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim();
              }
              
              if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
              }
              
              // Skip hidden elements
              const style = window.getComputedStyle(node);
              if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                return '';
              }
              
              // Skip common non-content elements
              const tagName = node.tagName.toLowerCase();
              if (['script', 'style', 'noscript', 'iframe', 'svg', 'path', 'header', 'footer', 'nav'].includes(tagName)) {
                return '';
              }
              
              // Skip elements with classes that suggest they're not content
              const className = node.className.toLowerCase();
              if (className && (
                  className.includes('nav') || 
                  className.includes('menu') || 
                  className.includes('header') || 
                  className.includes('footer') || 
                  className.includes('sidebar') ||
                  className.includes('ad') ||
                  className.includes('comment') ||
                  className.includes('social') ||
                  className.includes('share')
              )) {
                return '';
              }
              
              // Recursively get text from child nodes
              let text = '';
              for (const child of node.childNodes) {
                text += getVisibleText(child);
              }
              
              return text.trim();
            };
            
            const visibleText = getVisibleText(document.body);
            if (visibleText && visibleText.length > 100) {
              articleContent = visibleText;
              
              // Clean up the visible text
              articleContent = articleContent.replace(/\s+/g, ' ').trim();
              
              // Restore paragraph breaks for readability
              articleContent = articleContent.replace(/([.!?])\s+/g, '$1\n\n');
            }
          }
          
          if (!articleContent || articleContent.length < 100) {
            console.error("Could not extract article content or content too short");
            sendResponse({
              success: false,
              error: 'Could not extract article content or content too short'
            });
            return;
          }
          
          // Final cleanup for CNN and other news sites
          // Remove "Correction:" or "Editor's note:" sections at the end
          const correctionPattern = /\b(Correction|Editor\'s note|Update):.+$/is;
          articleContent = articleContent.replace(correctionPattern, '');
          
          // Remove "CNN's [name]" or "CNN —" at the beginning
          articleContent = articleContent.replace(/^(CNN\'S .+?|CNN —|CNN)\s+/i, '');
          
          // Remove contributor lines at the end
          articleContent = articleContent.replace(/\n.+contributed to (this|the) (report|article)\.?\s*$/i, '');
          
          console.log("Article content extracted successfully, length:", articleContent.length);
          console.log("Content preview:", articleContent.substring(0, 100) + "...");
          
          // Return the content to the popup
          sendResponse({
            success: true,
            articleUrl: articleUrl,
            articleContent: articleContent,
            pageTitle: pageTitle
          });
        } catch (error) {
          console.error("Error scanning article:", error);
          sendResponse({
            success: false,
            error: error.message || 'Unknown error occurred'
          });
        }
      };
      
      // Execute the async function and keep the message channel open
      handleScan();
      return true; // Keep the message channel open for the async response
    }
  });
  
  // Mark as initialized
  isInitialized = true;
}

// Initialize the content script when the page is fully loaded
if (document.readyState === 'complete') {
  initializeContentScript();
} else {
  window.addEventListener('load', initializeContentScript);
}

// Also initialize immediately to handle cases where the script is injected after page load
initializeContentScript();
