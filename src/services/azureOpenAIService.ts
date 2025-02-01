import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class AzureOpenAIService {
  private async getStreamingCompletion(messages: ChatMessage[]) {
    try {
      const response = await supabase.functions.invoke('azure-openai-chat', {
        body: { messages }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Error in getStreamingCompletion:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<string> {
    const systemPrompt = `You are an AI assistant trained to engage in natural conversations while being displayed as a video avatar. 
    Keep your responses concise, engaging, and natural as if speaking in a video call. 
    Maintain a friendly and professional tone, and remember that your responses will be converted to speech and lip-synced with the video.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    return this.getStreamingCompletion(messages);
  }
}

export const azureOpenAIService = new AzureOpenAIService();