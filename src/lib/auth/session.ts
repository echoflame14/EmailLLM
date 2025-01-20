// src/lib/auth/session.ts
import type { SessionOptions } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import type { AuthSession } from './types';

export interface SessionData {
  auth?: AuthSession;
}

declare module 'iron-session' {
  interface IronSessionData {
    auth?: AuthSession;
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: "email_assistant_session", 
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: 'lax' as const,
    httpOnly: true,
  },
};

export async function getServerSession(req: NextApiRequest, res: NextApiResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export function setSessionCookie(res: NextApiResponse, data: SessionData) {
  res.setHeader(
    'Set-Cookie',
    `${sessionOptions.cookieName}=${JSON.stringify(data)}; Path=/; HttpOnly; ${
      process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
    }SameSite=Lax`
  );
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader(
    'Set-Cookie',
    `${sessionOptions.cookieName}=; Path=/; HttpOnly; Max-Age=0; ${
      process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
    }SameSite=Lax`
  );
}