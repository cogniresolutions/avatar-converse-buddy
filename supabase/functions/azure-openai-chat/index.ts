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
    const { messages } = await req.json();
    
    const AZURE_OPENAI_ENDPOINT = Deno.env.get('AZURE_OPENAI_ENDPOINT');
    const AZURE_OPENAI_API_KEY = Deno.env.get('AZURE_OPENAI_API_KEY');

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error('Azure OpenAI configuration missing');
    }

    const response = await fetch(`${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify(generatedText), {
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