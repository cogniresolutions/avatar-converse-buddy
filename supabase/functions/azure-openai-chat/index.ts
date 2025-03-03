import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
const endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT');

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
    const { messages } = await req.json();

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI configuration is missing');
    }

    console.log('Sending request to Azure OpenAI with endpoint:', endpoint);

    const response = await fetch(`${endpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_tokens: 800,
        temperature: 0.7,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      console.error('Azure OpenAI API error status:', response.status);
      console.error('Azure OpenAI API error statusText:', response.statusText);
      const errorText = await response.text();
      console.error('Azure OpenAI API error response:', errorText);
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data.choices[0].message.content), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in azure-openai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});