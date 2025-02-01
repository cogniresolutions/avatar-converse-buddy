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
      
      // Create D-ID talk with the AI response
      const { url } = await didService.createStream(aiResponseText);
      
      this.currentStreamUrl = url;
      
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
    // No need to stop the stream with the talks endpoint
    this.currentStreamUrl = null;
  }
}

export const chatService = new ChatService();