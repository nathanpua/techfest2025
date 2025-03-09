import React, { useState } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

// AIorNot API configuration
const AIORNOT_API_URL = 'https://api.aiornot.com/v1/image/analyze';
const AIORNOT_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMzOTFlNjRhLTJkZjgtNGMxMC1iMGU5LWIyYmUyYWI5MWE5YiIsInVzZXJfaWQiOiJjMzkxZTY0YS0yZGY4LTRjMTAtYjBlOS1iMmJlMmFiOTFhOWIiLCJhdWQiOiJhY2Nlc3MiLCJleHAiOjAuMH0.tCdqztkLKI_gl-tv8nLE3quvS8fTGBKvTQqwcJRIQp8';

// Available toast methods: toast, toast.success, toast.error, toast.loading, toast.dismiss
// There is no toast.info in react-hot-toast

const DeepfakeDetector = ({ scanId, imageData }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Parse image alt text into structured data if needed
  const parseImageData = () => {
    if (!imageData) return [];
    
    // If we already have structured image_data, use it
    if (imageData.image_data && Array.isArray(imageData.image_data)) {
      return imageData.image_data;
    }
    
    // Otherwise, try to parse from image_alt_text
    if (imageData.image_alt_text) {
      try {
        // First, try to parse as JSON (in case it's already in JSON format)
        const parsed = JSON.parse(imageData.image_alt_text);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // If not JSON, split by newlines and create objects
        return imageData.image_alt_text.split('\n')
          .filter(text => text.trim().length > 0)
          .map(alt => ({ alt, src: null }));
      }
    }
    
    return [];
  };

  const images = parseImageData();
  const hasImages = images.length > 0;
  const imagesWithUrls = images.filter(img => img.src);
  const hasImageUrls = imagesWithUrls.length > 0;

  // Function to analyze a single image with AIorNot API using a proxy approach
  const analyzeImage = async (imageUrl) => {
    try {
      // First try using Supabase Functions as a proxy to avoid CORS issues
      try {
        const { data, error } = await supabase.functions.invoke('proxy-aiornot', {
          body: { 
            imageUrl,
            apiKey: AIORNOT_API_KEY
          }
        });

        if (!error) {
          return {
            ai_generated: data.ai_generated,
            confidence: data.confidence,
            imageUrl
          };
        }
        
        console.error('Error with Supabase function:', error);
        console.log('Trying direct API call as fallback...');
      } catch (proxyError) {
        console.error('Supabase function not available:', proxyError);
        console.log('Trying direct API call as fallback...');
      }
      
      // If Supabase Functions aren't available, try a direct call with a CORS proxy
      try {
        // Use a public CORS proxy (not ideal for production, but works for demo)
        const corsProxy = 'https://corsproxy.io/?';
        
        // Add a small random delay to avoid all requests hitting the API at exactly the same time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const response = await fetch(`${corsProxy}${encodeURIComponent(AIORNOT_API_URL)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AIORNOT_API_KEY}`
          },
          body: JSON.stringify({
            image_url: imageUrl
          })
        });

        if (!response.ok) {
          // If we hit rate limits, wait a bit and try again once
          if (response.status === 429) {
            console.log('Rate limit hit, waiting and retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
            
            const retryResponse = await fetch(`${corsProxy}${encodeURIComponent(AIORNOT_API_URL)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AIORNOT_API_KEY}`
              },
              body: JSON.stringify({
                image_url: imageUrl
              })
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              return {
                ai_generated: retryResult.ai_generated,
                confidence: retryResult.confidence,
                imageUrl
              };
            }
          }
          
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('AIorNot API result:', result);
        
        return {
          ai_generated: result.ai_generated,
          confidence: result.confidence,
          imageUrl
        };
      } catch (directError) {
        console.error('Direct API call failed:', directError);
        console.log('Falling back to simulated results');
        
        // Fall back to simulated results
        return {
          ai_generated: Math.random() > 0.5,
          confidence: Math.random(),
          error: "API unavailable - showing simulated result",
          imageUrl,
          simulated: true
        };
      }
    } catch (error) {
      console.error(`Error analyzing image ${imageUrl}:`, error);
      
      // Simulate a result on error
      return {
        ai_generated: Math.random() > 0.5,
        confidence: Math.random(),
        error: "API unavailable - showing simulated result",
        imageUrl,
        simulated: true
      };
    }
  };

  const detectDeepfakes = async () => {
    if (!scanId) {
      toast.error('No scan ID provided');
      return;
    }

    if (!hasImageUrls) {
      toast.error('No image URLs found to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      toast(`Analyzing ${imagesWithUrls.length} images...`);
      const loadingToast = toast.loading('Processing all images at once...');
      
      // Process all images at once
      const analysisPromises = imagesWithUrls.map(img => analyzeImage(img.src));
      const analysisResults = await Promise.all(analysisPromises);
      
      // Map the results to our format
      const formattedResults = imagesWithUrls.map((img, index) => {
        const analysis = analysisResults[index];
        
        return {
          image: img.src,
          alt: img.alt,
          deepfake_score: analysis.confidence || 0,
          is_deepfake: analysis.ai_generated || false,
          error: analysis.error,
          details: analysis,
          simulated: analysis.simulated
        };
      });
      
      // Clear the loading toast
      toast.dismiss(loadingToast);
      
      setResults(formattedResults);
      
      // Count results
      const aiGenerated = formattedResults.filter(r => r.is_deepfake).length;
      const authentic = formattedResults.filter(r => !r.is_deepfake && !r.error).length;
      const errors = formattedResults.filter(r => r.error).length;
      const simulated = formattedResults.filter(r => r.simulated).length;
      
      if (errors === imagesWithUrls.length) {
        toast.error('Failed to analyze any images. Showing simulated results.');
      } else if (simulated > 0) {
        toast.success(`Analysis completed: ${aiGenerated} AI-generated, ${authentic} authentic images (some results simulated)`);
      } else {
        toast.success(`Analysis completed: ${aiGenerated} AI-generated, ${authentic} authentic images`);
      }
      
      // Optionally save results to database if you have the right schema
      try {
        const { error } = await supabase
          .from('scans')
          .update({
            deepfake_results: formattedResults
          })
          .eq('id', scanId);
          
        if (error) {
          console.error('Error saving results to database:', error);
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Continue even if database update fails
      }
    } catch (error) {
      console.error('Error detecting deepfakes:', error);
      setError('Failed to detect deepfakes: ' + error.message);
      toast.error('Failed to detect deepfakes');
    } finally {
      setLoading(false);
    }
  };

  // If we already have results, display them
  const hasResults = results || (imageData && imageData.deepfake_results);
  const displayResults = results || (imageData && imageData.deepfake_results);

  return (
    <div className="mt-4">
      {hasImageUrls && !hasResults && (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Found {imagesWithUrls.length} images to analyze for deepfakes
          </p>
          <button
            onClick={detectDeepfakes}
            disabled={loading}
            className={`bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Analyzing All Images...' : 'Detect All Deepfakes'}
          </button>
          
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
          
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p>
              <strong>Note:</strong> This feature uses the AIorNot API to detect AI-generated images.
            </p>
            <p>
              All images will be analyzed at once for faster results.
            </p>
            <p>
              Due to API limitations, some results may be simulated if the API is unavailable or rate-limited.
            </p>
          </div>
        </div>
      )}

      {!hasImageUrls && hasImages && (
        <p className="text-sm text-yellow-600">
          Found images with alt text, but no URLs to analyze
        </p>
      )}

      {hasResults && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Deepfake Analysis Results</h3>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Analysis Summary:</p>
            <p className="text-xs text-gray-600 mt-1">
              {(() => {
                if (!displayResults || displayResults.length === 0) return "No results available";
                
                const total = displayResults.length;
                const aiGenerated = displayResults.filter(r => r.is_deepfake).length;
                const authentic = displayResults.filter(r => !r.is_deepfake && !r.error).length;
                const errors = displayResults.filter(r => r.error).length;
                const simulated = displayResults.filter(r => r.simulated).length;
                
                return `${total} images analyzed: ${aiGenerated} AI-generated, ${authentic} authentic${errors > 0 ? `, ${errors} errors` : ''}${simulated > 0 ? ` (${simulated} simulated results)` : ''}`;
              })()}
            </p>
          </div>
          
          <div className="space-y-4">
            {displayResults.map((result, index) => (
              <div key={index} className={`border rounded-lg p-4 ${result.is_deepfake ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {result.image && (
                      <img 
                        src={result.image} 
                        alt={result.alt || 'Image'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100?text=Error';
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-500 mb-1">{result.alt || 'No alt text'}</p>
                      {result.simulated && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Simulated</span>
                      )}
                    </div>
                    
                    {result.error ? (
                      <p className="text-red-500">Error: {result.error}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-bold ${result.is_deepfake ? 'text-red-600' : 'text-green-600'}`}>
                            {result.is_deepfake ? 'AI Generated' : 'Likely Authentic'}
                          </span>
                          <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                            Confidence: {(result.deepfake_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className={`h-2.5 rounded-full ${result.is_deepfake ? 'bg-red-600' : 'bg-green-600'}`}
                            style={{ width: `${(result.deepfake_score * 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setResults(null)}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Analyze Again
          </button>
        </div>
      )}
    </div>
  );
};

export default DeepfakeDetector; 