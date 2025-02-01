import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { VideoAvatar } from "@/components/VideoAvatar";
import { chatService } from "@/services/chatService";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  content: string;
  isAi: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string>();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up stream URL update callback
    chatService.setStreamUpdateCallback((url) => {
      setStreamUrl(url);
    });

    return () => {
      chatService.cleanup();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      // Add user message immediately
      setMessages((prev) => [...prev, { content, isAi: false }]);
      
      // Get AI response
      const response = await chatService.sendMessage(content);
      
      // Add AI response to messages
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
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
      <header className="p-4 flex justify-end">
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>
      <main className="flex-1 container mx-auto p-4 flex flex-col gap-6">
        <VideoAvatar streamUrl={streamUrl} />
        
        <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px] p-4 rounded-lg border bg-white">
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