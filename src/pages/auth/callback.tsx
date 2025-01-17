// src/pages/auth/callback.tsx

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AuthCallback() {
  const router = useRouter();
  const { code, error } = router.query;

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        console.error('Auth error:', error);
        router.push('/?error=auth_failed');
        return;
      }

      if (code) {
        try {
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (!response.ok) {
            throw new Error('Token exchange failed');
          }

          const data = await response.json();
          
          if (!data.success) {
            console.error('Session storage failed:', data);
            router.push('/?error=session_storage_failed');
            return;
          }
          
          // Redirect to home with success indicator
          router.push('/?status=success');
        } catch (err) {
          console.error('Token exchange error:', err);
          router.push('/?error=token_exchange_failed');
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
        <h1 className="text-xl font-semibold mb-2">Completing sign in...</h1>
        <p className="text-gray-600">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}