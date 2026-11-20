/**
 * Unified Single Sign-On (SSO) TypeScript Definitions
 * Standardized across DUT-AI Manager (IdP) and Resource Servers (Quiz, Meetly).
 */

export interface SSOIdentityClaim {
  sub: string;
  email: string;
  name: string;
  role_names: string[];
  iat: number;
  exp: number;
  avatar?: string;
  permissions?: string[];
}

export interface AppRegistryItem {
  id: string;
  title: string;
  shortName?: string;
  description: string;
  icon: string;
  url: string;
  path?: string;
  badge?: string;
  tags?: string[];
  accentColor?: string;
  order?: number;
  isActive?: boolean;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: SSOIdentityClaim | null;
  isLoading: boolean;
}
