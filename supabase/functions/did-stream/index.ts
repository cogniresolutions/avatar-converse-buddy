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

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() === "websocket") {
    // Handle WebSocket connection
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onmessage = async (event) => {
      try {
        const { text } = JSON.parse(event.data);
        console.log('Creating D-ID talk with text:', text);
        
        if (!apiKey) {
          console.error('DID_API_KEY is not set');
          socket.send(JSON.stringify({ error: 'DID API key is not configured' }));
          return;
        }

        const response = await fetch('https://api.d-id.com/talks', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(apiKey + ':')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_url: "bank://lively/",
            script: {
              type: "text",
              input: text,
              provider: {
                type: "microsoft",
                voice_id: "en-US-JennyNeural"
              }
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

        socket.send(JSON.stringify({
          id: data.id,
          url: data.result_url
        }));
      } catch (error) {
        console.error('Error in did-stream function:', error);
        socket.send(JSON.stringify({ error: error.message }));
      }
    };

    return response;
  }

  // Handle regular HTTP requests (fallback)
  try {
    const { text } = await req.json();
    
    if (!apiKey) {
      console.error('DID_API_KEY is not set');
      throw new Error('DID API key is not configured');
    }

    console.log('Creating D-ID talk with text:', text);
    
    const response = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: "bank://lively/",
        script: {
          type: "text",
          input: text,
          provider: {
            type: "microsoft",
            voice_id: "en-US-JennyNeural"
          }
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
      id: data.id,
      url: data.result_url
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