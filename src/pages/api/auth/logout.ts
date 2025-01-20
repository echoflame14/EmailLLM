// src/pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from '@/lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    session.destroy();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
}