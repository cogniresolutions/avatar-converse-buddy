import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !OPENAI_API_KEY) {
      console.error('API configuration is missing');
      return new Response(
        JSON.stringify({ error: 'API configuration is missing' }), 
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

            // Handle audio data if present
            if (message.audio) {
              try {
                const binaryAudio = processBase64Chunks(message.audio);
                const formData = new FormData();
                const blob = new Blob([binaryAudio], { type: 'audio/webm' });
                formData.append('file', blob, 'audio.webm');
                formData.append('model', 'whisper-1');

                const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  },
                  body: formData,
                });

                if (!transcriptionResponse.ok) {
                  throw new Error(`Whisper API error: ${transcriptionResponse.status}`);
                }

                const transcriptionResult = await transcriptionResponse.json();
                message.text = transcriptionResult.text;
              } catch (error) {
                console.error('Error processing audio:', error);
                socket.send(JSON.stringify({ error: 'Failed to process audio' }));
                return;
              }
            }

            // Process the text message with Azure OpenAI
            if (message.text) {
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

    // For non-WebSocket requests, return the WebSocket URL
    const host = req.headers.get('host') || 'kzubwatryfgonzuzldej.supabase.co';
    const wsUrl = `wss://${host}/functions/v1/azure-openai-realtime`;
    
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