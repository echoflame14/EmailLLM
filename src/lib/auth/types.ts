// src/lib/auth/types.ts

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface AuthSession {
  tokens: GoogleTokens;
  user: {
    email: string;
    name?: string;
    picture?: string;
  };
}