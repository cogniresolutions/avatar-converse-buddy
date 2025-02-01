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
    const { sessionId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the video URL from the session
    const { data: session, error: sessionError } = await supabaseClient
      .from("training_sessions")
      .select("video_url")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Use Azure Speech Service to get transcript
    const speechEndpoint = Deno.env.get("AZURE_SPEECH_ENDPOINT");
    const speechKey = Deno.env.get("AZURE_SPEECH_KEY");

    // TODO: Implement actual transcript extraction using Azure Speech Service
    const transcript = "Sample transcript - implement actual transcription";

    // Update the session with the transcript
    const { error: updateError } = await supabaseClient
      .from("training_sessions")
      .update({ transcript })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: "Transcript processed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing transcript:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});