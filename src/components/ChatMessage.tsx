import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  isAi: boolean;
}

export const ChatMessage = ({ message, isAi }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "p-4 rounded-lg max-w-[80%] animate-fade-up",
        isAi ? "bg-chat-ai ml-4" : "bg-chat-bubble mr-4 ml-auto"
      )}
    >
      <p className="text-sm md:text-base">{message}</p>
    </div>
  );
};