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
  private isSecure: boolean = true;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'disconnected';

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
      this.connectionState = 'failed';
      return;
    }

    try {
      // First verify if the endpoint is available
      this.verifyEndpoint().then(available => {
        if (!available) {
          console.error('Endpoint is not available for WebSocket connections');
          this.connectionState = 'failed';
          return;
        }

        // Create WebSocket URL with secure protocol
        const wsProtocol = this.isSecure ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${this.baseUrl}/video`;
        console.log('Attempting to connect to WebSocket:', wsUrl);
        
        this.connectionState = 'connecting';
        this.ws = new WebSocket(wsUrl);

        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            console.error('WebSocket connection timeout');
            this.ws?.close();
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connected successfully');
          this.connectionState = 'connected';
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
          this.connectionState = 'disconnected';
          // Log detailed error information
          if (error instanceof ErrorEvent) {
            console.error('Error details:', error.message);
          }
        };

        this.ws.onclose = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket closed, attempting to reconnect...');
          this.connectionState = 'disconnected';
          this.reconnectAttempts++;
          
          // Use exponential backoff for reconnection
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          setTimeout(() => this.setupWebSocket(), delay);
        };
      });
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.connectionState = 'failed';
      this.reconnectAttempts++;
      setTimeout(() => this.setupWebSocket(), this.reconnectDelay);
    }
  }

  private async verifyEndpoint(): Promise<boolean> {
    try {
      const response = await fetch(`https://${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Error verifying endpoint:', error);
      return false;
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
        console.warn(`WebSocket is not connected (State: ${this.connectionState}), message will not be synchronized with video`);
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
    this.connectionState = 'disconnected';
  }
}

export const chatService = new ChatService();