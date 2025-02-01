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
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private baseUrl: string = 'persona--zw6su7w.graygrass-5ab083e6.eastus.azurecontainerapps.io';
  private isSecure: boolean = true; // Force secure connections

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.setupWebSocket();
  }

  private setupWebSocket() {
    // Always set up the initial video URL first
    const protocol = this.isSecure ? 'https' : 'http';
    const videoUrl = `${protocol}://${this.baseUrl}/video`;
    this.currentStreamUrl = videoUrl;
    this.onStreamUpdate?.(videoUrl);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, falling back to HTTP-only mode');
      return;
    }

    try {
      // Create WebSocket URL with secure protocol
      const wsProtocol = this.isSecure ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${this.baseUrl}/video`;
      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error('WebSocket error:', data.error);
            return;
          }
          if (data.url) {
            console.log('Received new stream URL:', data.url);
            this.currentStreamUrl = data.url;
            this.onStreamUpdate?.(data.url);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...');
        this.reconnectAttempts++;
        
        // Use exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        setTimeout(() => this.setupWebSocket(), delay);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.reconnectAttempts++;
      setTimeout(() => this.setupWebSocket(), this.reconnectDelay);
    }
  }

  async sendMessage(content: string): Promise<Message> {
    const message: Message = { content, isAi: false };
    this.messages.push(message);
    
    try {
      // Get AI response from Azure OpenAI
      const aiResponseText = await azureOpenAIService.sendMessage(content);
      
      // Send the AI response to WebSocket for video synchronization
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('Sending message to WebSocket:', aiResponseText);
        this.ws.send(JSON.stringify({ text: aiResponseText }));
      } else {
        console.warn('WebSocket is not connected, message will not be synchronized with video');
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
    // If we already have a stream URL, call the callback immediately
    if (this.currentStreamUrl) {
      callback(this.currentStreamUrl);
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentStreamUrl = null;
    this.reconnectAttempts = 0;
  }
}

export const chatService = new ChatService();