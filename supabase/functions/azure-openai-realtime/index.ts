import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      throw new Error('Azure OpenAI configuration is missing');
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    console.log("WebSocket connection established");

    socket.onopen = () => {
      console.log("Client connected");
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        const azureResponse = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`, {
          method: 'POST',
          headers: {
            'api-key': AZURE_OPENAI_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are a helpful AI assistant.' },
              { role: 'user', content: message.text }
            ],
            max_tokens: 800,
            temperature: 0.7,
            stream: true,
          }),
        });

        if (!azureResponse.ok) {
          throw new Error(`Azure OpenAI API error: ${azureResponse.statusText}`);
        }

        const reader = azureResponse.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          socket.send(chunk);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({ error: error.message }));
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('Client disconnected');
    };

    // Add CORS headers to the WebSocket response
    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error in azure-openai-realtime function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});