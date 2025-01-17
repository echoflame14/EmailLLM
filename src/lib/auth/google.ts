// src/lib/auth/google.ts

import { AUTH_CONFIG } from '../config/auth';
import type { GoogleTokens } from './types';

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      client_secret: AUTH_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokens = await response.json();
  
  // Add expiry date
  tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);
  
  return tokens;
}

// Check if token is expired or will expire soon (within 5 minutes)
export function isTokenExpired(expiryDate: number): boolean {
  return Date.now() >= (expiryDate - 5 * 60 * 1000);
}