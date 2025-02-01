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

  async sendMessage(message: string, systemPrompt: string = "You are a helpful AI assistant."): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    return this.getStreamingCompletion(messages);
  }
}

export const azureOpenAIService = new AzureOpenAIService();