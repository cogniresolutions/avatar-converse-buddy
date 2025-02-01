import { supabase } from "@/integrations/supabase/client";

interface StreamResponse {
  url: string;
  id: string;
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

  // No need for stopStream method with the talks endpoint
}

export const didService = new DIDService();