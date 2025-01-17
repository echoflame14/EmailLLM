import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { AuthStatus } from '../auth/AuthStatus';
import { Inbox, Settings, Mail, AlertCircle } from 'lucide-react';
import ConversationController from '../conversation/ConversationController';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin">
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin" 
             style={{ animationDirection: 'reverse', borderRightColor: 'transparent', borderLeftColor: 'transparent' }} />
      </div>
    </div>
    <p className="mt-4 text-gray-600">Loading your email assistant...</p>
  </div>
);

const WelcomeScreen: React.FC = () => (
  <div className="text-center max-w-2xl mx-auto">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">
      Welcome to Email Assistant
    </h2>
    <p className="text-lg text-gray-600 mb-8">
      Your intelligent email management companion. Sign in with Google to:
    </p>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {[
        { icon: Mail, text: "Organize your inbox intelligently" },
        { icon: Inbox, text: "Manage email patterns effortlessly" },
        { icon: Settings, text: "Customize your email experience" }
      ].map(({ icon: Icon, text }, index) => (
        <li key={index} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
          <Icon className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
          <span className="text-gray-700">{text}</span>
        </li>
      ))}
    </ul>
  </div>
);

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Mail className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">Email Assistant</h1>
          </div>
          <AuthStatus />
        </div>
      </div>
    </header>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </main>
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-sm text-gray-500 text-center">
          Email Assistant © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  </div>
);

export const EmailAssistant: React.FC = () => {
  const { session, isLoading, error } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isPageLoading || isLoading) {
    return (
      <AppShell>
        <LoadingSpinner />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <WelcomeScreen />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome back, {session.user.name || session.user.email}!
          </h2>
          <p className="text-gray-600 mt-2">
            Your inbox is being analyzed. We'll have insights ready for you soon.
          </p>
        </div>
        
        {/* Feature Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Inbox className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inbox Analysis</h3>
            <p className="text-gray-600">
              Analyzing your email patterns and organizing your inbox intelligently.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <Settings className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preferences</h3>
            <p className="text-gray-600">
              Configure your email assistant preferences and settings.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <Mail className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Labels</h3>
            <p className="text-gray-600">
              Creating and managing intelligent email labels.
            </p>
          </div>
        </div>

        {/* Chat Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Chat with Your Email Assistant
          </h3>
          <ConversationController />
        </div>
        
        {/* Status Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Current Status</h3>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
            <p className="text-blue-800">
              Setting up your personalized email assistant...
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
};