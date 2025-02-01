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
  private baseUrl: string = 'https://persona--zw6su7w.graygrass-5ab083e6.eastus.azurecontainerapps.io';

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.setupWebSocket();
  }

  private setupWebSocket() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      // Set the initial video URL even if WebSocket fails
      const videoUrl = `${this.baseUrl}/video`;
      this.currentStreamUrl = videoUrl;
      this.onStreamUpdate?.(videoUrl);
      return;
    }

    try {
      // Use Azure Container app endpoint for video stream
      const wsUrl = `${this.baseUrl}/video`;
      const videoUrl = wsUrl;

      console.log('Attempting to connect to WebSocket:', wsUrl);
      
      // Set initial video URL immediately
      this.currentStreamUrl = videoUrl;
      this.onStreamUpdate?.(videoUrl);

      // Try WebSocket connection for real-time updates
      this.ws = new WebSocket(wsUrl.replace('http', 'ws'));

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
        setTimeout(() => this.setupWebSocket(), this.reconnectDelay);
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
        console.error('WebSocket is not connected');
        this.setupWebSocket();
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