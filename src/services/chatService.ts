import { azureOpenAIService } from "./azureOpenAIService";

interface Message {
  content: string;
  isAi: boolean;
}

class ChatService {
  private sessionId: string;
  private messages: Message[] = [];
  private currentStreamUrl: string | null = null;
  private ws: WebSocket | null = null;
  private onStreamUpdate: ((url: string) => void) | null = null;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.setupWebSocket();
  }

  private setupWebSocket() {
    const wsUrl = import.meta.env.PROD 
      ? `wss://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/did-stream`
      : 'ws://localhost:54321/functions/v1/did-stream';

    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('WebSocket error:', data.error);
        return;
      }
      if (data.url) {
        this.currentStreamUrl = data.url;
        this.onStreamUpdate?.(data.url);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed, attempting to reconnect...');
      setTimeout(() => this.setupWebSocket(), 5000);
    };
  }

  async sendMessage(content: string): Promise<Message> {
    const message: Message = { content, isAi: false };
    this.messages.push(message);
    
    try {
      // Get AI response from Azure OpenAI
      const aiResponseText = await azureOpenAIService.sendMessage(content);
      
      // Send the AI response to D-ID through WebSocket
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ text: aiResponseText }));
      } else {
        console.error('WebSocket is not connected');
      }
      
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
    this.onStreamUpdate = callback;
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentStreamUrl = null;
  }
}

export const chatService = new ChatService();