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
    console.log("Starting video transcript processing...");
    const { sessionId } = await req.json();
    console.log("Session ID:", sessionId);

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

    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      throw sessionError;
    }

    console.log("Processing video URL:", session.video_url);

    // Get Azure Speech Service token
    console.log("Requesting Azure Speech Service token...");
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
      console.error("Failed to get Azure token:", await tokenResponse.text());
      throw new Error("Failed to get Azure token");
    }

    const accessToken = await tokenResponse.text();
    console.log("Successfully obtained Azure token");

    // Create transcription request
    console.log("Creating transcription request...");
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
      console.error("Failed to start transcription:", await transcriptionResponse.text());
      throw new Error("Failed to start transcription");
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log("Transcription job created:", transcriptionData);

    // Start background task to poll for completion
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          let transcriptionComplete = false;
          let attempts = 0;
          while (!transcriptionComplete && attempts < 60) { // Max 30 minutes
            attempts++;
            console.log(`Checking transcription status (attempt ${attempts})...`);
            
            // Check status every 30 seconds
            await new Promise((resolve) => setTimeout(resolve, 30000));

            const statusResponse = await fetch(transcriptionData.self, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (!statusResponse.ok) {
              console.error("Failed to check status:", await statusResponse.text());
              throw new Error("Failed to check transcription status");
            }

            const status = await statusResponse.json();
            console.log("Transcription status:", status.status);

            if (status.status === "Succeeded") {
              console.log("Transcription completed successfully");
              // Get the transcript
              const filesResponse = await fetch(status.links.files, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!filesResponse.ok) {
                console.error("Failed to get transcript files:", await filesResponse.text());
                throw new Error("Failed to get transcript files");
              }

              const files = await filesResponse.json();
              console.log("Transcript files:", files);
              
              const transcriptUrl = files.values.find(
                (f: any) => f.kind === "Transcription"
              )?.links?.contentUrl;

              if (transcriptUrl) {
                console.log("Fetching transcript from:", transcriptUrl);
                const transcriptResponse = await fetch(transcriptUrl);
                const transcript = await transcriptResponse.text();
                console.log("Transcript retrieved, length:", transcript.length);

                // Update the session with the transcript
                const { error: updateError } = await supabaseClient
                  .from("training_sessions")
                  .update({ transcript })
                  .eq("id", sessionId);

                if (updateError) {
                  console.error("Error updating session:", updateError);
                  throw updateError;
                }
                console.log("Session updated with transcript");
                transcriptionComplete = true;
              }
            } else if (status.status === "Failed") {
              console.error("Transcription failed with status:", status);
              throw new Error("Transcription failed");
            }
          }
          
          if (!transcriptionComplete) {
            console.error("Transcription timed out after 30 minutes");
          }
        } catch (error) {
          console.error("Background task error:", error);
        }
      })()
    );

    console.log("Transcription process initiated successfully");
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