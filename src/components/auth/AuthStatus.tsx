import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import GoogleAuthButton from './GoogleAuthButton';

export const AuthStatus = () => {
  const { session, isLoading, error, logout } = useAuth();

  useEffect(() => {
    console.log('AuthStatus component state:', { session, isLoading, error });
  }, [session, isLoading, error]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    console.error('AuthStatus error:', error);
    return (
      <div className="text-sm text-red-600">
        Error: {error.message}
      </div>
    );
  }

  if (!session) {
    console.log('No session found, showing login button');
    return <GoogleAuthButton />;
  }

  console.log('Session found, showing user info:', session.user);

  return (
    <div className="flex items-center space-x-4">
      {session.user.picture && (
        <img
          src={session.user.picture}
          alt={session.user.name || session.user.email}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex flex-col">
        {session.user.name && (
          <span className="text-sm font-medium text-gray-900">
            {session.user.name}
          </span>
        )}
        <span className="text-xs text-gray-500">
          {session.user.email}
        </span>
      </div>
      <button
        onClick={() => logout()}
        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        Sign out
      </button>
    </div>
  );
};

export default AuthStatus;