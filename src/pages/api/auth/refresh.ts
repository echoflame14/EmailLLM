// src/pages/api/auth/refresh.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/auth/session';
import { refreshAccessToken } from '@/lib/auth/google';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);

    if (!session?.auth?.tokens?.refresh_token) {
      console.error('No refresh token found in session');
      return res.status(401).json({ message: 'No refresh token available' });
    }

    console.log('Refreshing token...');
    const newTokens = await refreshAccessToken(session.auth.tokens.refresh_token);
    
    // Update session
    session.auth = {
      ...session.auth,
      tokens: {
        ...newTokens,
        refresh_token: session.auth.tokens.refresh_token,
        expiry_date: Date.now() + (newTokens.expires_in * 1000)
      }
    };

    await session.save();
    console.log('Token refreshed and session updated');

    return res.status(200).json({
      success: true,
      tokens: {
        access_token: newTokens.access_token,
        expiry_date: session.auth.tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      message: 'Failed to refresh token',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}