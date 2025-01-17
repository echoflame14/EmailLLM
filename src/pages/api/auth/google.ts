import { NextApiRequest, NextApiResponse } from 'next';
import { AUTH_CONFIG } from '@/lib/config/auth';
import { setSessionCookie } from '@/lib/auth/session';
import { GmailClient } from '@/lib/api/gmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code required' });
  }

  try {
    console.log('Starting Google auth flow...');
    
    // Exchange code for tokens
    const params = new URLSearchParams({
      code,
      client_id: AUTH_CONFIG.clientId || '',
      client_secret: AUTH_CONFIG.clientSecret || '',
      redirect_uri: AUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);

    // Get user profile
    const gmailClient = new GmailClient(tokens.access_token);
    const profile = await gmailClient.getProfile();

    console.log('Got user profile:', { email: profile.emailAddress });

    // Set session cookie
    setSessionCookie(res, {
      auth: {
        tokens,
        user: {
          email: profile.emailAddress,
          name: profile.name,
          picture: profile.picture,
        },
      },
    });

    console.log('Session cookie set successfully');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}