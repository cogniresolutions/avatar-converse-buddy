import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, question, timestamp } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the transcript from the session
    const { data: session, error: sessionError } = await supabaseClient
      .from("training_sessions")
      .select("transcript")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Prepare prompt with transcript context
    const prompt = `Context: ${session.transcript}\n\nQuestion: ${question}${
      timestamp ? ` (at ${new Date(timestamp * 1000).toISOString().substr(11, 8)})` : ""
    }`;

    // Call Azure OpenAI
    const response = await fetch(`${Deno.env.get("AZURE_OPENAI_ENDPOINT")}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-08-01-preview`, {
      method: "POST",
      headers: {
        "api-key": Deno.env.get("AZURE_OPENAI_API_KEY") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that answers questions about the training video content using the provided transcript.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ answer }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error answering question:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});