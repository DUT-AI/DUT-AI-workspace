export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AdminUserProfile {
  id: number;
  name: string;
  email: string;
  status: string;
  is_deleted: boolean;
  avatar_url: string | null;
  zalo_bot_id: string | null;
  role_names: string[];
  permissions: string[];
}

export interface AuthApiResponse<T = unknown> {
  is_success: boolean;
  status_code: number;
  message: string;
  data: T | null;
  pagination: unknown | null;
}

export interface AuthTokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface JwtPayload {
  sub?: string;
  name?: string;
  email?: string;
  roles?: string[];
  avatar?: string;
  permissions?: string[];
  exp?: number;
  type?: string;
  [key: string]: unknown;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden';

export interface AdminSessionState {
  user: AdminUserProfile | null;
  status: AuthStatus;
  error: string | null;
  isAdmin: boolean;
}
