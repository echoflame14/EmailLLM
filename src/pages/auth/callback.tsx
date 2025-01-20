// src/pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const { code, error } = router.query;

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        console.error('Auth error from Google:', error);
        router.push('/?error=auth_failed');
        return;
      }

      if (code) {
        try {
          console.log('Got auth code, exchanging for tokens...');
          
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          console.log('Token exchange response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            throw new Error(errorText || 'Token exchange failed');
          }

          const data = await response.json();
          console.log('Token exchange successful:', {
            success: data.success,
            hasSession: !!data.session
          });
          
          if (!data.success) {
            console.error('Session storage failed:', data);
            router.push('/?error=session_storage_failed');
            return;
          }
          
          // Redirect to home with success indicator
          router.push('/?status=success');
          
        } catch (err: unknown) {
          console.error('Token exchange error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          router.push(`/?error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}`);
        }
      }
    };

    if (code || error) {
      handleCallback();
    }
  }, [code, error, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <h1 className="text-xl font-semibold mb-2">Completing sign in...</h1>
        <p className="text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}