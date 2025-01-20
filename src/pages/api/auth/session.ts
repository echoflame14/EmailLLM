// src/pages/api/auth/session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const session = await getServerSession(req, res);
    console.log('Session data:', { hasAuth: !!session.auth });

    if (session?.auth) {
      return res.status(200).json({ session: session.auth });
    }

    return res.status(200).json({ session: null });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ 
      message: 'Failed to get session',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}