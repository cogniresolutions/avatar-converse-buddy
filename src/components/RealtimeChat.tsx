import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PhoneCall, Mic, PhoneOff } from 'lucide-react';

interface Message {
  text: string;
  isAi: boolean;
}

export const RealtimeChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopRecording();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('azure-openai-realtime');
      
      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error('WebSocket URL not received from server');
      }
      
      wsRef.current = new WebSocket(data.url);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Real-time chat is now active",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            toast({
              title: "Error",
              description: data.error,
              variant: "destructive",
            });
            return;
          }
          
          if (data.choices?.[0]?.delta?.content) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.isAi) {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  text: lastMessage.text + data.choices[0].delta.content,
                };
                return newMessages;
              } else {
                return [...prev, { text: data.choices[0].delta.content, isAi: true }];
              }
            });
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          toast({
            title: "Error",
            description: "Failed to process message",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        toast({
          title: "Disconnected",
          description: "Chat connection closed",
        });
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat service",
          variant: "destructive",
        });
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect to chat service",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            try {
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });

              if (error) throw error;
              if (data.text) {
                sendMessage(data.text);
              }
            } catch (error) {
              console.error('Error processing voice:', error);
              toast({
                title: "Error",
                description: "Failed to process voice message",
                variant: "destructive",
              });
            }
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording",
        description: "Voice recording started",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Processing your message...",
      });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      setIsLoading(true);
      setMessages(prev => [...prev, { text, isAi: false }]);
      wsRef.current.send(JSON.stringify({ text }));
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b bg-secondary/10">
        <Button 
          onClick={isConnected ? () => wsRef.current?.close() : connectWebSocket}
          className="w-full gap-2"
          variant={isConnected ? "destructive" : "default"}
          disabled={isLoading}
        >
          {isConnected ? (
            <>
              <PhoneOff className="w-4 h-4" />
              End Call
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              {isLoading ? 'Connecting...' : 'Start Call'}
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isAi ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isAi
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {isConnected && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputMessage);
              }}
              className="flex gap-2 flex-1"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                Send
              </Button>
            </form>
            <Button
              type="button"
              variant={isRecording ? "destructive" : "secondary"}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <Mic className={isRecording ? "animate-pulse" : ""} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
