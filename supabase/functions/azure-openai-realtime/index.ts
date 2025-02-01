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

  try {
    const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');

    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT) {
      console.error('Azure OpenAI configuration is missing');
      return new Response(
        JSON.stringify({ error: 'Azure OpenAI configuration is missing' }), 
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Check if this is a WebSocket upgrade request
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() === "websocket") {
      console.log("Handling WebSocket upgrade request");
      try {
        const { socket, response } = Deno.upgradeWebSocket(req);
        
        socket.onopen = () => {
          console.log("WebSocket connection established");
        };

        socket.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);

            const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_OPENAI_API_KEY,
              },
              body: JSON.stringify({
                messages: [
                  { role: "system", content: "You are a helpful AI assistant." },
                  { role: "user", content: message.text }
                ],
                stream: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`Azure OpenAI API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body reader available');
            }

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                  const jsonData = JSON.parse(line.replace('data: ', ''));
                  socket.send(JSON.stringify(jsonData));
                }
              }
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
          console.log('WebSocket connection closed');
        };

        return response;
      } catch (error) {
        console.error('Error upgrading to WebSocket:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to establish WebSocket connection' }), 
          { 
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }
    }

    // For non-WebSocket requests, always use WSS protocol
    const wsUrl = `wss://${new URL(req.url).host}/functions/v1/azure-openai-realtime`;
    
    console.log('Generated WebSocket URL:', wsUrl);
    
    return new Response(
      JSON.stringify({ 
        url: wsUrl,
        status: 'success' 
      }), 
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in azure-openai-realtime function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }), 
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});