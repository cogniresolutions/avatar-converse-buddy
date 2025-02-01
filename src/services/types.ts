export interface Message {
  content: string;
  isAi: boolean;
}

export interface SessionConfig {
  sessionId: string;
  videoEndpoint: string;
  isSecure: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface WebSocketMessage {
  type: 'init' | 'message';
  sessionId: string;
  text?: string;
  url?: string;
  error?: string;
}