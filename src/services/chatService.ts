import { azureOpenAIService } from "./azureOpenAIService";
import { didService } from "./didService";

interface Message {
  content: string;
  isAi: boolean;
}

class ChatService {
  private sessionId: string;
  private messages: Message[] = [];
  private currentStreamUrl: string | null = null;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async sendMessage(content: string): Promise<Message> {
    const message: Message = { content, isAi: false };
    this.messages.push(message);
    
    try {
      // Get AI response from Azure OpenAI
      const aiResponseText = await azureOpenAIService.sendMessage(content);
      
      // Create D-ID stream with the AI response
      const { streamUrl, sessionId } = await didService.createStream(aiResponseText);
      
      // Stop previous stream if exists
      if (this.currentStreamUrl) {
        await didService.stopStream(this.sessionId);
      }
      
      this.currentStreamUrl = streamUrl;
      
      const aiResponse: Message = {
        content: aiResponseText,
        isAi: true
      };
      
      this.messages.push(aiResponse);
      return aiResponse;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  getCurrentStreamUrl(): string | null {
    return this.currentStreamUrl;
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async cleanup() {
    if (this.currentStreamUrl) {
      await didService.stopStream(this.sessionId);
      this.currentStreamUrl = null;
    }
  }
}

export const chatService = new ChatService();