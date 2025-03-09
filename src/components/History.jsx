import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'
import AnimatedBackground from '../utils/animatedBackground'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/History.css'

const History = ({ user, scans: parentScans, fetchScans: parentFetchScans }) => {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, reliable, unreliable
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, reliability
  const [scanType, setScanType] = useState('all') // all, articles, images
  const [selectedScan, setSelectedScan] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hiddenScanIds, setHiddenScanIds] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem(`hidden_scans_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const itemsPerPage = 10
  
  // Refs for animated background
  const backgroundRef = useRef(null)
  const animatedBgRef = useRef(null)
  const navigate = useNavigate()
  
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

  // Save hidden scan IDs to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`hidden_scans_${user.id}`, JSON.stringify(hiddenScanIds));
    }
  }, [hiddenScanIds, user]);

  // Reset page when filter, sortBy, or scanType changes
  useEffect(() => {
    setPage(1);
  }, [filter, sortBy, scanType]);

  // Listen for changes to the scans prop from the parent component
  useEffect(() => {
    if (parentScans && parentScans.length > 0) {
      // Instead of calling fetchScans (which would create a loop),
      // directly update our local filtered scans based on the parent scans
      updateLocalScansFromParent();
    }
  }, [parentScans]);

  // Function to update local scans based on parent scans
  const updateLocalScansFromParent = () => {
    if (!parentScans) return;
    
    // Apply the same filtering logic as in fetchScans, but without making API calls
    let filteredScans = [...parentScans];
    
    // Apply scan type filter
    if (scanType === 'images') {
      filteredScans = filteredScans.filter(scan => scan.source === 'image_analysis');
    } else if (scanType === 'articles') {
      filteredScans = filteredScans.filter(scan => scan.source !== 'image_analysis');
    }
    
    // Apply reliability filters
    if (filter === 'reliable' || filter === 'unreliable') {
      filteredScans = filteredScans.filter(scan => {
        // For image analysis scans
        if (isImageAnalysis(scan)) {
          const score = getReliabilityScore(scan);
          return filter === 'reliable' ? score >= 70 : score < 70;
        }
        
        // For text analysis scans
        const analysis = getAnalysisData(scan);
        if (!analysis) return filter === 'unreliable';
        
        if (analysis.overall_reliability && analysis.overall_reliability.score !== undefined) {
          return filter === 'reliable' 
            ? analysis.overall_reliability.score >= 70 
            : analysis.overall_reliability.score < 70;
        }
        
        return filter === 'unreliable';
      });
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filteredScans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filteredScans.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'reliability') {
      filteredScans.sort((a, b) => {
        const scoreA = getReliabilityScore(a);
        const scoreB = getReliabilityScore(b);
        return scoreB - scoreA; // Descending order
      });
    }
    
    // Filter out hidden scans
    filteredScans = filteredScans.filter(scan => !hiddenScanIds.includes(scan.id));
    
    // Apply pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    const paginatedScans = filteredScans.slice(from, to);
    
    // Update state
    setScans(paginatedScans);
    setTotalPages(Math.max(1, Math.ceil(filteredScans.length / itemsPerPage)));
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      // If we have parent scans, use them directly
      if (parentScans && parentScans.length > 0) {
        updateLocalScansFromParent();
      } else {
        // Otherwise, fetch from the database
        fetchScans();
      }
    }
  }, [user, filter, sortBy, scanType, page, hiddenScanIds])

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

  const fetchScans = async () => {
    setLoading(true)
    try {
      // Build the query
      let query = supabase
        .from('scans')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
      
      // Apply scan type filter
      if (scanType === 'images') {
        query = query.eq('source', 'image_analysis')
      } else if (scanType === 'articles') {
        query = query.not('source', 'eq', 'image_analysis')
      }
      
      // Apply reliability filters
      if (filter === 'reliable') {
        // For text analysis, use overall_reliability.score
        // For image analysis, we'll filter client-side since the structure is different
        query = query.or(`analysis->analysis->overall_reliability->score.gte.70`)
      } else if (filter === 'unreliable') {
        // For text analysis, use overall_reliability.score
        // For image analysis, we'll filter client-side since the structure is different
        query = query.or(`analysis->analysis->overall_reliability->score.lt.70`)
      }
      
      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true })
      } else if (sortBy === 'reliability') {
        // For text analysis, use overall_reliability.score
        // For image analysis, we'll sort client-side since the structure is different
        query = query.order('analysis->analysis->overall_reliability->score', { ascending: false })
      }
      
      // Apply pagination
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      // Filter out locally hidden scans
      let visibleScans = data ? data.filter(scan => !hiddenScanIds.includes(scan.id)) : []
      
      // Apply additional client-side filtering for image analysis scans
      if (filter === 'reliable' || filter === 'unreliable') {
        visibleScans = visibleScans.filter(scan => {
          // For image analysis scans
          if (isImageAnalysis(scan)) {
            const score = getReliabilityScore(scan);
            return filter === 'reliable' ? score >= 70 : score < 70;
          }
          // For text analysis scans, they were already filtered by the database query
          return true;
        });
      }
      
      // Apply client-side sorting for image analysis scans if sorting by reliability
      if (sortBy === 'reliability') {
        visibleScans.sort((a, b) => {
          const scoreA = getReliabilityScore(a);
          const scoreB = getReliabilityScore(b);
          return scoreB - scoreA; // Descending order
        });
      }
      
      setScans(visibleScans)
      
      // Adjust total pages based on visible scans
      // This is an approximation since we don't know the total count after filtering
      const visibleRatio = visibleScans.length / (data?.length || 1)
      const estimatedTotalVisible = Math.ceil(count * visibleRatio)
      setTotalPages(Math.max(1, Math.ceil(estimatedTotalVisible / itemsPerPage)))
    } catch (error) {
      console.error('Error fetching scans:', error)
      toast.error('Failed to fetch scan history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    // Add the scan ID to the hidden scans list
    setHiddenScanIds(prev => [...prev, id])
    
    // Remove the scan from the current list
    setScans(prev => prev.filter(scan => scan.id !== id))
    
    // If the selected scan is being deleted, clear it
    if (selectedScan?.id === id) {
      setSelectedScan(null)
    }
    
    // No need to call parentFetchScans here - the real-time subscription
    // in App.jsx will handle updating the parent state when the database changes
    
    toast.success('Scan deleted successfully')
  }

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getReliabilityColor = (score, scan) => {
    // For image analysis, use a different color scheme based on reliability score
    if (scan && isImageAnalysis(scan)) {
      const analysis = getAnalysisData(scan);
      if (analysis && analysis.conclusion) {
        // Use the reliability score to determine color
        // High reliability (authentic) = green, Low reliability (AI-generated) = red
        if (score >= 75) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        if (score >= 30) return 'bg-orange-500';
        return 'bg-red-500';
      }
    }
    
    // Original color logic for text analysis
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getReliabilityText = (score, scan) => {
    // For image analysis, use a different color scheme based on reliability score
    if (scan && isImageAnalysis(scan)) {
      const analysis = getAnalysisData(scan);
      if (analysis && analysis.conclusion) {
        // Use the reliability score to determine text color
        // High reliability (authentic) = green, Low reliability (AI-generated) = red
        if (score >= 75) return 'text-green-700';
        if (score >= 50) return 'text-yellow-700';
        if (score >= 30) return 'text-orange-700';
        return 'text-red-700';
      }
    }
    
    // Original color logic for text analysis
    if (score >= 75) return 'text-green-700'
    if (score >= 50) return 'text-yellow-700'
    return 'text-red-700'
  }

  // Helper function to safely extract content from a scan
  const extractContent = (scan) => {
    if (!scan) return '';
    
    // If it's an image analysis scan, return the image filename
    if (scan.source === 'image_analysis') {
      return `Image Analysis: ${scan.content}`;
    }
    
    // If content is a string, return it directly
    if (typeof scan.content === 'string') {
      return scan.content;
    }
    
    // If content is an object (from Chrome extension), try to extract article_content or full_text
    try {
      // Try to parse if it's a JSON string
      if (typeof scan.content === 'string') {
        try {
          const parsed = JSON.parse(scan.content);
          return parsed.article_content || parsed.full_text || parsed.content || scan.content;
        } catch (e) {
          // If parsing fails, return the original content
          return scan.content;
        }
      }
      
      // If it's already an object
      if (scan.content && typeof scan.content === 'object') {
        return scan.content.article_content || scan.content.full_text || scan.content.content || JSON.stringify(scan.content);
      }
      
      // Fallback to empty string if content is undefined or null
      return scan.content || '';
    } catch (error) {
      console.error('Error extracting content:', error);
      return scan.content || '';
    }
  };

  // Helper function to check if a scan is an image analysis
  const isImageAnalysis = (scan) => {
    return scan && scan.source === 'image_analysis';
  };

  // Helper function to get image analysis conclusion
  const getImageAnalysisConclusion = (scan) => {
    if (!isImageAnalysis(scan)) return null;
    
    try {
      const analysis = getAnalysisData(scan);
      if (!analysis || !analysis.conclusion) return null;
      
      return analysis.conclusion;
    } catch (error) {
      console.error('Error getting image analysis conclusion:', error);
      return null;
    }
  };

  // Helper function to get image analysis evidence
  const getImageAnalysisEvidence = (scan) => {
    if (!isImageAnalysis(scan)) return null;
    
    try {
      const analysis = getAnalysisData(scan);
      if (!analysis || !analysis.evidence) return null;
      
      return analysis.evidence;
    } catch (error) {
      console.error('Error getting image analysis evidence:', error);
      return null;
    }
  };

  // Helper function to safely access analysis data
  const getAnalysisData = (scan) => {
    if (!scan) return null;
    
    try {
      // If scan doesn't have analysis property
      if (!scan.analysis) return null;
      
      // If analysis is a string, try to parse it
      if (typeof scan.analysis === 'string') {
        try {
          return normalizeAnalysisData(JSON.parse(scan.analysis));
        } catch (e) {
          console.error('Error parsing analysis JSON:', e);
          return null;
        }
      }
      
      // If analysis is already an object
      return normalizeAnalysisData(scan.analysis);
    } catch (error) {
      console.error('Error accessing analysis data:', error);
      return null;
    }
  };
  
  // Helper function to normalize analysis data structure
  const normalizeAnalysisData = (data) => {
    if (!data) return null;
    
    try {
      // If data has an 'analysis' property that contains the actual analysis
      if (data.analysis && typeof data.analysis === 'object') {
        return data.analysis;
      }
      
      // Otherwise, return the data as is
      return data;
    } catch (error) {
      console.error('Error normalizing analysis data:', error);
      return data;
    }
  };
  
  // Helper function to safely get reliability score
  const getReliabilityScore = (scan) => {
    if (!scan) return 0;
    
    try {
      // Check if this is an image analysis scan
      if (isImageAnalysis(scan)) {
        const analysis = getAnalysisData(scan);
        if (!analysis) return 0;
        
        // For image analysis, use the reliability_score from the conclusion
        if (analysis.conclusion && analysis.conclusion.reliability_score !== undefined) {
          return analysis.conclusion.reliability_score;
        }
        
        // Fallback to confidence_score for backward compatibility
        if (analysis.conclusion && analysis.conclusion.confidence_score !== undefined) {
          // Convert the 0-1 confidence score to a percentage (0-100)
          return Math.round(analysis.conclusion.confidence_score * 100);
        }
        
        return 0;
      }
      
      // For text analysis (original logic)
      const analysis = getAnalysisData(scan);
      if (!analysis) return 0;
      
      // Check for overall_reliability.score
      if (analysis.overall_reliability && analysis.overall_reliability.score !== undefined) {
        return analysis.overall_reliability.score;
      }
      
      // Check for direct reliability_score
      if (analysis.reliability_score !== undefined) {
        return analysis.reliability_score;
      }
      
      // Check for overall_score
      if (analysis.overall_score !== undefined) {
        return analysis.overall_score;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting reliability score:', error);
      return 0;
    }
  };

  // Helper function to safely get a property from the analysis
  const getAnalysisProperty = (scan, path, defaultValue = null) => {
    if (!scan) return defaultValue;
    
    try {
      const analysis = getAnalysisData(scan);
      if (!analysis) return defaultValue;
      
      // Handle direct access to analysis object
      if (path === 'analysis') return analysis;
      
      // Split the path into parts
      const parts = path.split('.');
      let current = analysis;
      
      // Navigate through the path
      for (const part of parts) {
        if (current === null || current === undefined) return defaultValue;
        current = current[part];
      }
      
      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.error(`Error getting analysis property ${path}:`, error);
      return defaultValue;
    }
  };

  // Debug function to log the structure of the analysis data
  const debugAnalysis = (scan) => {
    if (!scan) return null;
    
    try {
      const analysis = getAnalysisData(scan);
      console.log("Analysis data structure:", JSON.stringify(analysis, null, 2));
      return analysis;
    } catch (error) {
      console.error("Error debugging analysis:", error);
      return null;
    }
  };

  return (
    <div className="history-container">
      {/* Animated Background */}
      <div className="animated-background" ref={backgroundRef}></div>
      
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <h1>Exposé</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/history" className="nav-link active">History</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
        </div>
      </nav>
      
      {/* Keep the existing content, just wrap it in a container for z-index */}
      <div className="history-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scan History</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {scanType === 'all' 
                ? 'View and manage your previous article and image scans' 
                : scanType === 'articles' 
                ? 'View and manage your previous article scans' 
                : 'View and manage your previous image analysis scans'}
            </p>
            
            {/* Scan type toggle buttons */}
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => setScanType('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  scanType === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                All Scans
              </button>
              <button
                onClick={() => setScanType('articles')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  scanType === 'articles'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                Articles
              </button>
              <button
                onClick={() => setScanType('images')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  scanType === 'images'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                }`}
              >
                Images
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Reliability
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('reliable')}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === 'reliable'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      Reliable (70%+)
                    </button>
                    <button
                      onClick={() => setFilter('unreliable')}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        filter === 'unreliable'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      Unreliable (&lt;70%)
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full pl-4 pr-10 py-2.5 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm appearance-none transition-colors duration-200"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="reliability">Highest reliability</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900 rounded-lg p-6 shadow-sm border border-indigo-100 dark:border-indigo-800">
                <h2 className="text-lg font-medium text-indigo-900 dark:text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Tips
                </h2>
                <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Click on any scan to view full details
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Use filters to find specific types of content
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete scans you no longer need
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-300 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    Compare reliability scores across content
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : scans.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No scans found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {filter !== 'all' && scanType === 'all'
                      ? `No ${filter} content found. Try changing your filters.`
                      : scanType === 'articles' && filter !== 'all'
                      ? `No ${filter} articles found. Try changing your filters.`
                      : scanType === 'images' && filter !== 'all'
                      ? `No ${filter} images found. Try changing your filters.`
                      : scanType === 'articles'
                      ? 'No articles found. Get started by analyzing an article.'
                      : scanType === 'images'
                      ? 'No images found. Get started by analyzing an image.'
                      : 'Get started by scanning your first article or analyzing an image.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {scans.map((scan) => (
                        <li 
                          key={scan.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${selectedScan?.id === scan.id ? 'bg-indigo-50 dark:bg-indigo-900' : ''}`}
                          onClick={() => setSelectedScan(scan)}
                        >
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {extractContent(scan).substring(0, 100)}...
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(scan.created_at)}
                                  {isImageAnalysis(scan) && (
                                    <span className={`ml-2 ${getReliabilityColor(getReliabilityScore(scan), scan) === 'bg-red-500' ? 'text-red-500' : getReliabilityColor(getReliabilityScore(scan), scan) === 'bg-green-500' ? 'text-green-500' : 'text-yellow-500'}`}>
                                      • {getReliabilityScore(scan)}% Reliable
                                      {getImageAnalysisConclusion(scan)?.is_likely_ai_generated && 
                                        <span className="ml-1 text-red-500">(AI)</span>
                                      }
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="ml-4 flex-shrink-0 flex items-center">
                                {scan.analysis && (
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                      <div 
                                        className={`h-2 rounded-full ${getReliabilityColor(getReliabilityScore(scan), scan)}`}
                                        style={{ width: `${getReliabilityScore(scan)}%` }}
                                      ></div>
                                    </div>
                                    <span className={`text-xs font-medium ${getReliabilityText(getReliabilityScore(scan), scan)}`}>
                                      {getReliabilityScore(scan)}%
                                    </span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(scan.id);
                                  }}
                                  className="ml-4 text-gray-400 dark:text-gray-500 hover:text-red-500"
                                  title="Hide scan"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.875 7.375c-.621-.484-1.658-.484-2.279 0L10 8.66l-1.596-1.285c-.621-.484-1.658-.484-2.279 0-.621.485-.621 1.292 0 1.777L8.404 11.34l-2.279 1.777c-.621.485-.621 1.292 0 1.777.311.242.71.363 1.107.363.398 0 .796-.121 1.107-.363L10 13.34l1.596 1.285c.311.242.71.363 1.107.363.398 0 .796-.121 1.107-.363.621-.485.621-1.292 0-1.777L11.596 11.34l2.279-1.777c.621-.485.621-1.292 0-1.777z" />
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          page === 1
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-gray-700 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-gray-600'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Previous
                      </button>
                      
                      <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Page {page} of {totalPages}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          page === totalPages
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-gray-700 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-gray-600'
                        }`}
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {selectedScan && (
                <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6 overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scan Details</h3>
                    <div className="flex space-x-2">
                      <button
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        onClick={() => debugAnalysis(selectedScan)}
                      >
                        Debug
                      </button>
                      <button
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        onClick={() => setSelectedScan(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2">Scanned on {formatDate(selectedScan.created_at)}</p>
                  
                  {/* Display image if it's an image analysis scan */}
                  {isImageAnalysis(selectedScan) && selectedScan.image_data && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Analyzed Image</h4>
                      <img 
                        src={selectedScan.image_data} 
                        alt="Analyzed image" 
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-4"
                        style={{ maxHeight: '300px' }}
                      />
                    </div>
                  )}
                  
                  {/* Display content differently based on scan type */}
                  {!isImageAnalysis(selectedScan) && (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      {extractContent(selectedScan)}
                    </div>
                  )}
                  
                  {getAnalysisData(selectedScan) && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Analysis Results</h4>
                      
                      {/* Display reliability score for text analysis */}
                      {!isImageAnalysis(selectedScan) && (
                        <div className="mb-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                              <div 
                                className={`h-4 rounded-full ${getReliabilityColor(getReliabilityScore(selectedScan), selectedScan)}`}
                                style={{ width: `${getReliabilityScore(selectedScan)}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">{getReliabilityScore(selectedScan)}%</span>
                          </div>
                          {getAnalysisProperty(selectedScan, 'overall_reliability.category') && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-900 dark:text-white">Category:</span> {getAnalysisProperty(selectedScan, 'overall_reliability.category')}
                            </p>
                          )}
                          {getAnalysisProperty(selectedScan, 'overall_reliability.confidence') && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-900 dark:text-white">Confidence:</span> {getAnalysisProperty(selectedScan, 'overall_reliability.confidence')}%
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Display image analysis conclusion */}
                      {isImageAnalysis(selectedScan) && getImageAnalysisConclusion(selectedScan) && (
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Conclusion</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {getImageAnalysisConclusion(selectedScan).summary}
                          </p>
                          
                          {/* AI Generation Flag */}
                          <div className="flex items-center mb-3 mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              getImageAnalysisConclusion(selectedScan).is_likely_ai_generated 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {getImageAnalysisConclusion(selectedScan).is_likely_ai_generated 
                                ? 'AI-Generated' 
                                : 'Not AI-Generated'}
                            </span>
                          </div>
                          
                          {/* Reliability Score */}
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Image Reliability Score:
                            </p>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div 
                                  className={`h-4 rounded-full ${getReliabilityColor(getReliabilityScore(selectedScan), selectedScan)}`}
                                  style={{ width: `${getReliabilityScore(selectedScan)}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {getReliabilityScore(selectedScan)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Higher score = more likely to be authentic | Lower score = more likely to be AI-generated
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Display image analysis evidence */}
                      {isImageAnalysis(selectedScan) && getImageAnalysisEvidence(selectedScan) && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Evidence</h5>
                          
                          {getImageAnalysisEvidence(selectedScan).facial_anomalies && getImageAnalysisEvidence(selectedScan).facial_anomalies.length > 0 && (
                            <div className="mb-2">
                              <h6 className="text-sm font-medium text-gray-800 dark:text-gray-200">Facial Anomalies:</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                {getImageAnalysisEvidence(selectedScan).facial_anomalies.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {getImageAnalysisEvidence(selectedScan).lighting_issues && getImageAnalysisEvidence(selectedScan).lighting_issues.length > 0 && (
                            <div className="mb-2">
                              <h6 className="text-sm font-medium text-gray-800 dark:text-gray-200">Lighting Issues:</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                {getImageAnalysisEvidence(selectedScan).lighting_issues.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {getImageAnalysisEvidence(selectedScan).background_problems && getImageAnalysisEvidence(selectedScan).background_problems.length > 0 && (
                            <div className="mb-2">
                              <h6 className="text-sm font-medium text-gray-800 dark:text-gray-200">Background Problems:</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                {getImageAnalysisEvidence(selectedScan).background_problems.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {getImageAnalysisEvidence(selectedScan).digital_artifacts && getImageAnalysisEvidence(selectedScan).digital_artifacts.length > 0 && (
                            <div className="mb-2">
                              <h6 className="text-sm font-medium text-gray-800 dark:text-gray-200">Digital Artifacts:</h6>
                              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
                                {getImageAnalysisEvidence(selectedScan).digital_artifacts.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Display technical assessment for image analysis */}
                      {isImageAnalysis(selectedScan) && getAnalysisProperty(selectedScan, 'analysis.technical_assessment') && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Technical Assessment</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getAnalysisProperty(selectedScan, 'analysis.technical_assessment')}
                          </p>
                        </div>
                      )}
                      
                      {/* Continue with existing code for text analysis */}
                      {!isImageAnalysis(selectedScan) && getAnalysisProperty(selectedScan, 'reliability_scores') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Reliability Scores</h3>
                          <div className="space-y-3">
                            {Object.entries(getAnalysisProperty(selectedScan, 'reliability_scores') || {}).map(([key, value]) => {
                              // Handle both formats: object with score/confidence/reasoning or direct number
                              const score = typeof value === 'object' ? value.score : value;
                              const confidence = typeof value === 'object' ? value.confidence : null;
                              const reasoning = typeof value === 'object' ? value.reasoning : null;
                              
                              return (
                                <div key={key} className="mb-2">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium capitalize text-gray-900 dark:text-white">
                                      {key.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                      {typeof score === 'number' ? 
                                        confidence ? `${score}/10 (Confidence: ${confidence}%)` : `${score}%` 
                                        : score}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                    <div 
                                      className={`h-2 rounded-full ${getReliabilityColor(typeof score === 'number' ? score * 10 : score, selectedScan)}`}
                                      style={{ width: `${typeof score === 'number' ? (score * 10) : score}%` }}
                                    ></div>
                                  </div>
                                  {reasoning && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{reasoning}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {getAnalysisProperty(selectedScan, 'bias_indicators') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Bias Indicators</h3>
                          <div className="space-y-3">
                            {getAnalysisProperty(selectedScan, 'bias_indicators.political_bias') && (
                              <div className="mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Political Bias</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {getAnalysisProperty(selectedScan, 'bias_indicators.political_bias.detected') ? 
                                    `Detected: ${getAnalysisProperty(selectedScan, 'bias_indicators.political_bias.direction')} (${getAnalysisProperty(selectedScan, 'bias_indicators.political_bias.strength')})` : 
                                    'No significant political bias detected'}
                                </p>
                              </div>
                            )}
                            
                            {getAnalysisProperty(selectedScan, 'bias_indicators.emotional_manipulation') && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Emotional Manipulation</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {getAnalysisProperty(selectedScan, 'bias_indicators.emotional_manipulation.detected') ? 
                                    `Detected techniques: ${getAnalysisProperty(selectedScan, 'bias_indicators.emotional_manipulation.techniques', []).join(', ')}` : 
                                    'No significant emotional manipulation detected'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {getAnalysisProperty(selectedScan, 'identified_claims') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Key Claims</h3>
                          <div className="space-y-3">
                            {(getAnalysisProperty(selectedScan, 'identified_claims') || []).map((claim, index) => (
                              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">"{claim.claim}"</p>
                                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                                    claim.accuracy.toLowerCase().includes('true') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                    claim.accuracy.toLowerCase().includes('false') ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {claim.accuracy}
                                  </span>
                                </div>
                                {claim.explanation && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{claim.explanation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {getAnalysisProperty(selectedScan, 'summary') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Summary</h3>
                          <p className="text-gray-600 dark:text-gray-400">{getAnalysisProperty(selectedScan, 'summary')}</p>
                        </div>
                      )}
                      
                      {getAnalysisProperty(selectedScan, 'recommendation') && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">Recommendation</h3>
                          <p className="text-gray-600 dark:text-gray-400">{getAnalysisProperty(selectedScan, 'recommendation')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History 