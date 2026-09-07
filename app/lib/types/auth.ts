export type UserRole = 'founder' | 'investor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}
