import { azureOpenAIService } from "./azureOpenAIService";
import { SessionManager } from "./sessionManager";
import { Message, SessionConfig } from "./types";

class ChatService {
  private sessionManager: SessionManager;
  private messages: Message[] = [];
  private videoEndpoint: string = 'tavus.video/943ec60143';
  private isSecure: boolean = true;

  constructor() {
    const sessionConfig: SessionConfig = {
      sessionId: crypto.randomUUID(),
      videoEndpoint: this.videoEndpoint,
      isSecure: this.isSecure
    };
    
    this.sessionManager = new SessionManager(sessionConfig);
    console.log('Initializing chat service with session ID:', sessionConfig.sessionId);
    this.initializeSession();
  }

  private async initializeSession() {
    await this.sessionManager.initialize();
  }

  async sendMessage(content: string): Promise<Message> {
    const message: Message = { content, isAi: false };
    this.messages.push(message);
    
    try {
      // Get AI response from Azure OpenAI
      const aiResponseText = await azureOpenAIService.sendMessage(content);
      
      // Send the AI response to WebSocket for video synchronization
      this.sessionManager.sendMessage(aiResponseText);
      
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

  setStreamUpdateCallback(callback: (url: string) => void) {
    this.sessionManager.setStreamUpdateCallback(callback);
  }

  getCurrentStreamUrl(): string | null {
    return this.sessionManager.getCurrentStreamUrl();
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }

  cleanup() {
    this.sessionManager.cleanup();
  }
}

export const chatService = new ChatService();