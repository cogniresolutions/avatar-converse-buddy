import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface Message {
  content: string;
  isAi: boolean;
  timestamp?: number;
}

interface TrainingSession {
  id: string;
  videoUrl: string;
  transcript?: string;
}

export function useTrainingSession() {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast: shadowToast } = useToast();

  const uploadVideo = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Upload to Supabase Storage
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const filePath = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from("training_videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("training_videos")
        .getPublicUrl(filePath);

      // Create session in database
      const { error: dbError, data: sessionData } = await supabase
        .from("training_sessions")
        .insert({
          user_id: userId,
          title: file.name,
          video_url: publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Set up realtime subscription for transcript updates
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'training_sessions',
            filter: `id=eq.${sessionData.id}`,
          },
          (payload) => {
            if (payload.new.transcript) {
              toast.success('Video transcript processing complete!', {
                description: 'You can now ask questions about the video content.',
              });
              // Update local session state with transcript
              setSession(prev => prev ? { ...prev, transcript: payload.new.transcript } : null);
            } else if (payload.new.status === 'failed') {
              toast.error('Failed to process video transcript', {
                description: 'Please try uploading the video again.',
              });
            }
          }
        )
        .subscribe();

      // Process transcript (this will be handled by a background job)
      await supabase.functions.invoke("process-video-transcript", {
        body: { sessionId: sessionData.id },
      });

      setSession({
        id: sessionData.id,
        videoUrl: publicUrl,
      });

      toast.info('Processing video transcript...', {
        description: 'This may take a few minutes. You will be notified when it\'s ready.',
      });

    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuestion = async (question: string, timestamp?: number) => {
    if (!session) return;

    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { content: question, isAi: false, timestamp }]);

      const { data, error } = await supabase.functions.invoke("answer-question", {
        body: {
          sessionId: session.id,
          question,
          timestamp,
        },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { content: data.answer, isAi: true }]);
    } catch (error) {
      console.error("Error sending question:", error);
      shadowToast({
        title: "Error",
        description: "Failed to get answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    session,
    messages,
    isLoading,
    uploadVideo,
    sendQuestion,
  };
}