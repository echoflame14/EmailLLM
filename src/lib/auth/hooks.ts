// src/lib/auth/hooks.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import type { AuthSession } from './types';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAuth extends AuthState {
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export function useAuth(): UseAuth {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
    error: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      console.log('Fetching session from /api/auth/session...');
      const response = await fetch('/api/auth/session', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      console.log('Session response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }
      
      const data = await response.json();
      console.log('Session response data:', {
        hasSession: !!data.session,
        hasToken: !!data.session?.tokens?.access_token,
        email: data.session?.user?.email
      });
      
      setState(prev => {
        // Only update if the session has actually changed
        if (JSON.stringify(prev.session) !== JSON.stringify(data.session)) {
          console.log('Session state updated:', data.session);
          return { ...prev, session: data.session, isLoading: false };
        }
        return { ...prev, isLoading: false };
      });
    } catch (error) {
      console.error('Session fetch error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        isLoading: false 
      }));
    }
  }, []);

  // Initial session fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // URL-based session updates
  useEffect(() => {
    // Check for auth-related URL parameters
    const status = router.query.status;
    const error = router.query.error;

    if (status === 'success' || error) {
      console.log('Auth status change detected:', { status, error });
      fetchSession();
      
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router, router.query, fetchSession]);

  // Periodic session check
  useEffect(() => {
    const interval = setInterval(fetchSession, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSession]);

  const logout = async () => {
    try {
      console.log('Logging out...');
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setState({ session: null, isLoading: false, error: null });
      console.log('Logged out successfully');
      
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const refreshToken = async () => {
    if (!state.session?.tokens.refresh_token) {
      console.log('No refresh token available');
      return;
    }

    try {
      console.log('Refreshing token...');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token refresh failed');
      }
      
      const data = await response.json();
      console.log('Token refresh response:', {
        success: data.success,
        hasNewToken: !!data.tokens?.access_token
      });
      
      if (!data.success) {
        throw new Error('Token refresh response indicated failure');
      }

      await fetchSession();
    } catch (error) {
      console.error('Token refresh error:', error);
      setState(prev => ({ ...prev, error: error as Error }));
      await logout();
    }
  };

  // Log state changes
  useEffect(() => {
    console.log('Auth state updated:', {
      hasSession: !!state.session,
      hasToken: !!state.session?.tokens?.access_token,
      isLoading: state.isLoading,
      error: state.error?.message
    });
  }, [state]);

  return {
    ...state,
    logout,
    refreshToken,
  };
}