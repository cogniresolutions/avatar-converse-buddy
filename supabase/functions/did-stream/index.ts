import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const apiKey = Deno.env.get('DID_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!apiKey) {
      console.error('DID_API_KEY is not set');
      throw new Error('DID API key is not configured');
    }

    console.log('Creating D-ID stream with text:', text);
    
    // Create a new talk session
    const response = await fetch('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg",
        script: {
          type: "text",
          input: text,
        },
        config: {
          stitch: true,
        },
        driver_url: "bank://lively/",
        presenter_config: {
          crop: { type: "rectangle" }
        }
      }),
    });

    const responseText = await response.text();
    console.log('D-ID API Response:', response.status, responseText);

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse D-ID API response:', e);
      throw new Error('Invalid response from D-ID API');
    }

    return new Response(JSON.stringify({
      streamUrl: data.id,
      sessionId: data.session_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in did-stream function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Please check the D-ID API key configuration and request format'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});