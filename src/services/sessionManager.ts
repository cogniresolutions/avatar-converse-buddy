import { ConnectionState, SessionConfig, WebSocketMessage } from './types';

export class SessionManager {
  private sessionId: string;
  private currentStreamUrl: string | null = null;
  private ws: WebSocket | null = null;
  private onStreamUpdate: ((url: string) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private connectionState: ConnectionState = 'disconnected';
  private config: SessionConfig;

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId;
    this.config = config;
    console.log('Initializing session manager with ID:', this.sessionId);
  }

  async initialize(): Promise<void> {
    try {
      const protocol = this.config.isSecure ? 'https' : 'http';
      const videoUrl = `${protocol}://${this.config.videoEndpoint}/video?session=${this.sessionId}`;
      console.log('Setting up video URL:', videoUrl);
      
      this.currentStreamUrl = videoUrl;
      this.onStreamUpdate?.(videoUrl);

      await this.setupWebSocket();
    } catch (error) {
      console.error('Error initializing session:', error);
      this.connectionState = 'failed';
    }
  }

  private async setupWebSocket(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.connectionState = 'failed';
      return;
    }

    try {
      const wsProtocol = this.config.isSecure ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${this.config.videoEndpoint}/video?session=${this.sessionId}`;
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      this.connectionState = 'connecting';
      this.ws = new WebSocket(wsUrl);

      const connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          console.warn('WebSocket connection timeout, attempting reconnection...');
          this.ws?.close();
        }
      }, 5000);

      this.setupWebSocketHandlers(connectionTimeout);
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.handleReconnection();
    }
  }

  private setupWebSocketHandlers(connectionTimeout: NodeJS.Timeout): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket connected successfully');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      
      // Send initial session setup message
      this.ws?.send(JSON.stringify({
        type: 'init',
        sessionId: this.sessionId
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('Received WebSocket message:', data);
        
        if (data.error) {
          console.error('WebSocket message error:', data.error);
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
      this.handleReconnection();
    };

    this.ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      console.log('WebSocket closed with code:', event.code, 'reason:', event.reason);
      this.handleReconnection();
    };
  }

  private handleReconnection(): void {
    if (this.connectionState === 'failed') {
      console.log('Connection already failed, skipping reconnection');
      return;
    }
    
    this.connectionState = 'disconnected';
    this.reconnectAttempts++;
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.connectionState !== 'failed') {
        console.log('Initiating reconnection attempt...');
        this.setupWebSocket();
      }
    }, delay);
  }

  public sendMessage(text: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending message to WebSocket:', text);
      this.ws.send(JSON.stringify({
        type: 'message',
        sessionId: this.sessionId,
        text
      }));
    } else {
      console.warn(`Cannot send message - WebSocket state: ${this.ws?.readyState}, Connection state: ${this.connectionState}`);
    }
  }

  public setStreamUpdateCallback(callback: (url: string) => void): void {
    this.onStreamUpdate = callback;
    if (this.currentStreamUrl) {
      callback(this.currentStreamUrl);
    }
  }

  public getCurrentStreamUrl(): string | null {
    return this.currentStreamUrl;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public cleanup(): void {
    console.log('Cleaning up session:', this.sessionId);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentStreamUrl = null;
    this.reconnectAttempts = 0;
    this.connectionState = 'disconnected';
  }
}