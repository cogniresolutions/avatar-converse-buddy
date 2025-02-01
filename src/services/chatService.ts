interface Message {
  content: string;
  isAi: boolean;
}

class ChatService {
  private sessionId: string;
  private messages: Message[] = [];

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async sendMessage(content: string): Promise<Message> {
    // This is a placeholder - we'll implement the actual API call later
    // when we have the Azure OpenAI endpoint
    const message: Message = { content, isAi: false };
    this.messages.push(message);
    
    // Simulate AI response
    const aiResponse: Message = {
      content: "This is a placeholder response. Azure OpenAI integration coming soon!",
      isAi: true,
    };
    this.messages.push(aiResponse);
    
    return aiResponse;
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const chatService = new ChatService();