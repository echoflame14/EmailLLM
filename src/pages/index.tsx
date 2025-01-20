// src/pages/index.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { EmailAssistant } from '@/components/email/EmailAssistant';

export default function Home() {
  const { session, isLoading, error } = useAuth();

  useEffect(() => {
    // Log session state changes
    console.log('Session state:', {
      hasSession: !!session,
      hasToken: !!session?.tokens?.access_token,
      isLoading,
      error: error?.message
    });
  }, [session, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (!session?.tokens?.access_token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <a
          href="/api/auth/google"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  return <EmailAssistant />;
}