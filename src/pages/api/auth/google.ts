// src/pages/api/auth/google.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AUTH_CONFIG, getGoogleAuthUrl } from '@/lib/config/auth';
import { getServerSession } from '@/lib/auth/session';
import { GmailClient } from '@/lib/api/gmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request for initial auth URL
  if (req.method === 'GET') {
    try {
      const authUrl = getGoogleAuthUrl();
      console.log('Redirecting to:', authUrl);
      return res.redirect(authUrl);
    } catch (error) {
      console.error('Failed to generate auth URL:', error);
      return res.status(500).json({ 
        message: 'Failed to initialize authentication',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      });
    }
  }

  // Handle POST request for token exchange
  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code required' });
    }

    try {
      console.log('Starting Google auth flow...');
      
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

      // Get and update session
      const session = await getServerSession(req, res);
      session.auth = {
        tokens,
        user: {
          email: profile.emailAddress,
          name: profile.name,
          picture: profile.picture,
        },
      };
      await session.save();

      console.log('Session saved successfully:', {
        hasAuth: !!session.auth,
        email: session.auth?.user.email
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  }

  // Handle any other HTTP method
  return res.status(405).json({ message: 'Method not allowed' });
}