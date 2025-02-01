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

    console.log("Processing video:", session.video_url);

    // Get Azure Speech Service token
    const tokenResponse = await fetch(
      `${Deno.env.get("AZURE_SPEECH_ENDPOINT")}/sts/v1.0/issuetoken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": Deno.env.get("AZURE_SPEECH_KEY") ?? "",
        },
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to get Azure token");
    }

    const accessToken = await tokenResponse.text();

    // Create transcription request
    const transcriptionResponse = await fetch(
      `${Deno.env.get("AZURE_SPEECH_ENDPOINT")}/speechtotext/v3.0/transcriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contentUrls: [session.video_url],
          properties: {
            diarizationEnabled: true,
            wordLevelTimestampsEnabled: true,
            punctuationMode: "DictatedAndAutomatic",
            profanityFilterMode: "Masked",
          },
          locale: "en-US",
        }),
      }
    );

    if (!transcriptionResponse.ok) {
      throw new Error("Failed to start transcription");
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log("Transcription job created:", transcriptionData);

    // Start background task to poll for completion
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          let transcriptionComplete = false;
          while (!transcriptionComplete) {
            // Check status every 30 seconds
            await new Promise((resolve) => setTimeout(resolve, 30000));

            const statusResponse = await fetch(transcriptionData.self, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!statusResponse.ok) {
              throw new Error("Failed to check transcription status");
            }

            const status = await statusResponse.json();
            console.log("Transcription status:", status.status);

            if (status.status === "Succeeded") {
              // Get the transcript
              const filesResponse = await fetch(status.links.files, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!filesResponse.ok) {
                throw new Error("Failed to get transcript files");
              }

              const files = await filesResponse.json();
              const transcriptUrl = files.values.find(
                (f: any) => f.kind === "Transcription"
              )?.links?.contentUrl;

              if (transcriptUrl) {
                const transcriptResponse = await fetch(transcriptUrl);
                const transcript = await transcriptResponse.text();

                // Update the session with the transcript
                const { error: updateError } = await supabaseClient
                  .from("training_sessions")
                  .update({ transcript })
                  .eq("id", sessionId);

                if (updateError) throw updateError;
                transcriptionComplete = true;
              }
            } else if (status.status === "Failed") {
              throw new Error("Transcription failed");
            }
          }
        } catch (error) {
          console.error("Background task error:", error);
        }
      })()
    );

    return new Response(
      JSON.stringify({ message: "Transcript processing started" }),
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