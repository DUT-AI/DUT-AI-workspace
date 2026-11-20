import { JwtPayload } from '@/types/auth';

export const MANAGE_API_BASE = process.env.MANAGE_API_BASE || 'https://manage.dutai.io.vn';
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.dutai.io.vn';

/**
 * Checks whether the roles array includes the 'admin' role (case-insensitive).
 */
export function hasAdminRole(roles?: string[] | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some((role) => typeof role === 'string' && role.trim().toLowerCase() === 'admin');
}

/**
 * Safely decodes the payload portion of a JWT without cryptographic verification.
 * Safe for Edge runtime and Browser runtime.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    if (typeof atob === 'function') {
      const decodedStr = atob(padded);
      return JSON.parse(decodedStr);
    } else if (typeof Buffer !== 'undefined') {
      const decodedStr = Buffer.from(padded, 'base64').toString('utf-8');
      return JSON.parse(decodedStr);
    }
    return null;
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Helper to build Set-Cookie header string for deleting auth cookies.
 */
export function buildExpiredCookieHeaders(): string[] {
  return [
    `access_token=; Path=/; Domain=${COOKIE_DOMAIN}; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
    `refresh_token=; Path=/; Domain=${COOKIE_DOMAIN}; Max-Age=0; HttpOnly; SameSite=Lax; Secure`,
    // Also clear without domain in case set locally on localhost
    'access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
  ];
}
