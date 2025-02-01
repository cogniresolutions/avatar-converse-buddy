import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChat } from '@/components/RealtimeChat';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Sign In</h1>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
            />
          </div>
          
          <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">AI Chat Assistant</h2>
            <RealtimeChat />
          </div>
        </div>
      </div>
    </div>
  );
}