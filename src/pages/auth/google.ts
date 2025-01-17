// src/pages/api/auth/google.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { AUTH_CONFIG } from '@/lib/config/auth';
import { GmailClient } from '@/lib/api/gmail';
import { setSessionCookie } from '@/lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code required' });
  }

  try {
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
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }

    const tokens = await tokenResponse.json();
    
    // Add expiry date
    tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);

    // Get user info using the new token
    const gmailClient = new GmailClient(tokens.access_token);
    const profile = await gmailClient.getProfile();

    // Store session data in cookie
    setSessionCookie(res, {
      auth: {
        tokens,
        user: {
          email: profile.emailAddress,
          name: profile.name,
          picture: profile.picture,
        },
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}