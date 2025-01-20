// src/lib/config/auth.ts

export const GOOGLE_AUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

// Debug: Log all environment variables (excluding secrets)
console.log('Environment Variables Check:', {
  hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  envKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
});

if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
  console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in environment variables');
}

export const AUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/auth/callback',
  scopes: GOOGLE_AUTH_SCOPES,
  responseType: 'code',
  accessType: 'offline',
  prompt: 'consent',
  includedGrantScopes: true
} as const;

export const getGoogleAuthUrl = () => {
  console.log('AUTH_CONFIG state:', {
      hasClientId: !!AUTH_CONFIG.clientId,
      clientIdValue: AUTH_CONFIG.clientId,
      redirectUri: AUTH_CONFIG.redirectUri
  });

  if (!AUTH_CONFIG.clientId) {
      throw new Error('Google Client ID is not configured. Check NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  url.searchParams.append('client_id', AUTH_CONFIG.clientId);
  url.searchParams.append('redirect_uri', AUTH_CONFIG.redirectUri);
  url.searchParams.append('response_type', AUTH_CONFIG.responseType);
  url.searchParams.append('scope', AUTH_CONFIG.scopes);
  url.searchParams.append('access_type', AUTH_CONFIG.accessType);
  url.searchParams.append('prompt', AUTH_CONFIG.prompt);
  url.searchParams.append('include_granted_scopes', 'true');
  
  const state = Math.random().toString(36).substring(7);
  url.searchParams.append('state', state);
  
  return url.toString();
};