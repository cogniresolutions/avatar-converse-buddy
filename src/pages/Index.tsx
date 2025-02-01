import { RealtimeChat } from '@/components/RealtimeChat';

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
          <RealtimeChat />
        </div>
      </div>
    </div>
  );
}