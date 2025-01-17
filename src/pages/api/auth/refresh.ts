import type { NextApiResponse } from 'next';
import { withSessionRoute, NextApiRequestWithSession } from '@/lib/auth/session';
import { refreshAccessToken } from '@/lib/auth/google';

async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = req.session.auth;
    if (!session?.tokens.refresh_token) {
      return res.status(400).json({ message: 'No refresh token' });
    }

    const newTokens = await refreshAccessToken(session.tokens.refresh_token);
    
    // Update session with new tokens, ensuring expiry_date is set
    req.session.auth = {
      ...session,
      tokens: {
        access_token: newTokens.access_token,
        refresh_token: session.tokens.refresh_token, // Preserve refresh token
        expiry_date: newTokens.expiry_date || Date.now() + (newTokens.expires_in * 1000)
      },
    };
    await req.session.save();

    res.status(200).json({ tokens: newTokens });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
}

export default withSessionRoute(handler);