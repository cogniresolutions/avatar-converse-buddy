import { supabase } from "@/integrations/supabase/client";

interface StreamResponse {
  streamUrl: string;
  sessionId: string;
}

class DIDService {
  async createStream(text: string): Promise<StreamResponse> {
    try {
      const response = await supabase.functions.invoke('did-stream', {
        body: { text }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error in createStream:', error);
      throw error;
    }
  }

  async stopStream(sessionId: string): Promise<void> {
    try {
      await supabase.functions.invoke('did-stream-stop', {
        body: { sessionId }
      });
    } catch (error) {
      console.error('Error in stopStream:', error);
    }
  }
}

export const didService = new DIDService();