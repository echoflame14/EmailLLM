// src/components/auth/GoogleAuthButton.tsx
import React from 'react';

export const GoogleAuthButton = () => {
  const handleLogin = async () => {
    try {
      // Redirect to our API route, which will then redirect to Google
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error initiating login:', error);
      alert('Failed to initialize Google login. Please try again.');
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.545,12.151L12.545,12.151c0,1.054,0.855,1.909,1.909,1.909h3.536c-0.459,1.192-1.159,2.243-2.05,3.134c-0.895,0.895-1.948,1.597-3.14,2.056c-1.225,0.474-2.525,0.714-3.864,0.714c-2.968,0-5.797-1.171-7.91-3.284c-2.113-2.113-3.284-4.942-3.284-7.91c0-2.968,1.171-5.797,3.284-7.91c2.113-2.113,4.942-3.284,7.91-3.284c2.968,0,5.797,1.171,7.91,3.284c2.113,2.113,3.284,4.942,3.284,7.91c0,0.547-0.044,1.093-0.131,1.631h-6.846C13.4,10.251,12.545,11.096,12.545,12.151z" />
      </svg>
      Sign in with Google
    </button>
  );
};

export default GoogleAuthButton;