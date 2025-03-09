// Supabase Edge Function for Deepfake Detection
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Configure with your preferred deepfake detection API
const DEEPFAKE_API_URL = 'https://api.deepware.ai/detect' // Replace with your chosen API
const DEEPFAKE_API_KEY = Deno.env.get('DEEPFAKE_API_KEY') // Store API key in Supabase secrets

serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    }

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers })
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    // Parse request body
    const { scanId } = await req.json()
    
    if (!scanId) {
      return new Response(
        JSON.stringify({ error: 'Missing scanId parameter' }),
        { status: 400, headers }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the scan data
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      return new Response(
        JSON.stringify({ error: 'Scan not found', details: scanError }),
        { status: 404, headers }
      )
    }

    // Check if we have image data
    if (!scan.image_data || !Array.isArray(scan.image_data) || scan.image_data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No image data found in scan' }),
        { status: 400, headers }
      )
    }

    // Process each image with the deepfake detection API
    const results = []
    for (const image of scan.image_data) {
      if (!image.src) continue

      try {
        // Call the deepfake detection API
        const response = await fetch(DEEPFAKE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPFAKE_API_KEY}`
          },
          body: JSON.stringify({
            image_url: image.src
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API error: ${response.status} ${errorText}`)
          results.push({
            image: image.src,
            alt: image.alt,
            error: `API error: ${response.status}`
          })
          continue
        }

        const result = await response.json()
        
        // Add the result to our array
        results.push({
          image: image.src,
          alt: image.alt,
          deepfake_score: result.score || result.deepfake_score || 0,
          is_deepfake: result.is_deepfake || (result.score > 0.7) || false,
          details: result
        })
      } catch (error) {
        console.error(`Error processing image ${image.src}:`, error)
        results.push({
          image: image.src,
          alt: image.alt,
          error: error.message || 'Unknown error'
        })
      }
    }

    // Update the scan with the results
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        deepfake_results: results
      })
      .eq('id', scanId)

    if (updateError) {
      console.error('Error updating scan:', updateError)
    }

    // Return the results
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        scan_id: scanId
      }),
      { headers }
    )
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 