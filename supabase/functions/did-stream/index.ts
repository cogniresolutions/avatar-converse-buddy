import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    const DID_API_KEY = Deno.env.get('DID_API_KEY');
    if (!DID_API_KEY) {
      throw new Error('D-ID API key missing');
    }

    // Create a talk stream
    const response = await fetch('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg",
        script: {
          type: "text",
          input: text,
        },
      }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify({
      streamUrl: data.result.stream_url,
      sessionId: data.result.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in did-stream function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});