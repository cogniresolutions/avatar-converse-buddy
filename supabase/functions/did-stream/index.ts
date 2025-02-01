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
              result_format: "mp4",
              streaming: true
            },
            driver_url: "bank://lively/",
            presenter_config: {
              crop: { type: "rectangle" }
            }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('D-ID API error:', response.status, errorText);
          socket.send(JSON.stringify({ error: `D-ID API error: ${response.status} ${errorText}` }));
          return;
        }

        const data = await response.json();
        console.log('D-ID API Response:', data);

        // Send the stream URL back to the client
        socket.send(JSON.stringify({
          id: data.id,
          url: data.result_url
        }));
      } catch (error) {
        console.error('Error in did-stream function:', error);
        socket.send(JSON.stringify({ error: error.message }));
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return response;
  }

  // Handle regular HTTP requests (fallback)
  try {
    const { text } = await req.json();
    
    if (!apiKey) {
      throw new Error('DID API key is not configured');
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
          result_format: "mp4",
          streaming: true
        },
        driver_url: "bank://lively/",
        presenter_config: {
          crop: { type: "rectangle" }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`D-ID API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    
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