import { NextRequest, NextResponse } from 'next/server';
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

/**
 * Guard utility for API Route Handlers ensuring request originates from an Admin.
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { authorized: true; token: string; payload: JwtPayload }
  | { authorized: false; errorResponse: NextResponse }
> {
  const cookieToken = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          is_success: false,
          status_code: 401,
          message: 'Vui lòng đăng nhập với tài khoản Quản trị viên để thực hiện thao tác này.',
          data: null,
          pagination: null,
        },
        { status: 401 }
      ),
    };
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.roles || !hasAdminRole(payload.roles)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          is_success: false,
          status_code: 403,
          message: 'Tài khoản của bạn không có quyền Quản trị viên (Admin) để thực hiện thao tác này.',
          data: null,
          pagination: null,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, token, payload };
}
