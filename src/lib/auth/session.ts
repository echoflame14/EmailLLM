// src/lib/auth/session.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie';

export interface SessionData {
  auth?: {
    tokens: {
      access_token: string;
      refresh_token?: string;
      expiry_date: number;
    };
    user: {
      email: string;
      name?: string;
      picture?: string;
    };
  };
}

const COOKIE_NAME = 'email_assistant_session';

export function setSessionCookie(res: NextApiResponse, data: SessionData) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, JSON.stringify(data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  );
}

export function getSessionData(req: NextApiRequest): SessionData | null {
  const cookies = parse(req.headers.cookie || '');
  const sessionCookie = cookies[COOKIE_NAME];
  
  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    serialize(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  );
}