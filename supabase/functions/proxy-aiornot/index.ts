// Supabase Edge Function to proxy requests to AIorNot API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// AIorNot API endpoint
const AIORNOT_API_URL = 'https://api.aiornot.com/v1/image/analyze';

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
    const { imageUrl, apiKey } = await req.json()
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl parameter' }),
        { status: 400, headers }
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing apiKey parameter' }),
        { status: 400, headers }
      )
    }

    console.log(`Proxying request to AIorNot API for image: ${imageUrl.substring(0, 50)}...`)

    try {
      // Forward the request to AIorNot API
      const response = await fetch(AIORNOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          image_url: imageUrl
        })
      })

      // Get the response from AIorNot API
      const responseData = await response.json()
      
      if (!response.ok) {
        console.error('AIorNot API error:', response.status, responseData)
        
        // If we hit rate limits, return a simulated result
        if (response.status === 429) {
          console.log('Rate limit hit, returning simulated result')
          return new Response(
            JSON.stringify({
              ai_generated: Math.random() > 0.5,
              confidence: Math.random(),
              simulated: true,
              error: 'Rate limit exceeded, showing simulated result'
            }),
            { headers }
          )
        }
        
        return new Response(
          JSON.stringify({ 
            error: `AIorNot API error: ${response.status}`,
            details: responseData
          }),
          { status: response.status, headers }
        )
      }

      // Return the response from AIorNot API
      return new Response(
        JSON.stringify(responseData),
        { headers }
      )
    } catch (error) {
      console.error('Error forwarding request to AIorNot API:', error)
      
      // Return a simulated result on error
      return new Response(
        JSON.stringify({
          ai_generated: Math.random() > 0.5,
          confidence: Math.random(),
          simulated: true,
          error: 'Failed to connect to AIorNot API, showing simulated result'
        }),
        { headers }
      )
    }
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        ai_generated: Math.random() > 0.5,
        confidence: Math.random(),
        simulated: true
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}) 