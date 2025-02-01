import { useState } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { VideoAvatar } from "@/components/VideoAvatar";
import { chatService } from "@/services/chatService";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  content: string;
  isAi: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setMessages((prev) => [...prev, { content, isAi: false }]);
      
      const response = await chatService.sendMessage(content);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <main className="flex-1 container mx-auto p-4 flex flex-col gap-6">
        <VideoAvatar />
        
        <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px] p-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message.content}
              isAi={message.isAi}
            />
          ))}
        </div>
        
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;