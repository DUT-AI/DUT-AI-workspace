import { NextResponse } from 'next/server';
import { buildExpiredCookieHeaders } from '@/lib/auth';
import { AuthApiResponse } from '@/types/auth';

export async function POST() {
  const response = NextResponse.json<AuthApiResponse<null>>({
    is_success: true,
    status_code: 200,
    message: 'Đăng xuất thành công',
    data: null,
    pagination: null,
  });

  const expiredCookies = buildExpiredCookieHeaders();
  for (const cookieHeader of expiredCookies) {
    response.headers.append('Set-Cookie', cookieHeader);
  }

  return response;
}
