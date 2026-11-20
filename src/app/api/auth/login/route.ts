import { NextRequest, NextResponse } from 'next/server';
import { MANAGE_API_BASE, COOKIE_DOMAIN, hasAdminRole, decodeJwtPayload } from '@/lib/auth';
import { AuthApiResponse, AuthTokenData, AdminUserProfile } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || !body.password) {
      return NextResponse.json<AuthApiResponse<null>>(
        {
          is_success: false,
          status_code: 400,
          message: 'Vui lòng nhập đầy đủ email và mật khẩu',
          data: null,
          pagination: null,
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Call Manage IdP login endpoint
    const manageRes = await fetch(`${MANAGE_API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const manageData: AuthApiResponse<AuthTokenData> = await manageRes.json().catch(() => ({
      is_success: false,
      status_code: manageRes.status,
      message: 'Không thể xử lý phản hồi từ máy chủ xác thực',
      data: null,
      pagination: null,
    }));

    if (!manageRes.ok || !manageData.is_success || !manageData.data) {
      return NextResponse.json<AuthApiResponse<null>>(
        {
          is_success: false,
          status_code: manageRes.status,
          message: manageData.message || 'Email hoặc mật khẩu không chính xác',
          data: null,
          pagination: null,
        },
        { status: manageRes.status }
      );
    }

    const { access_token, refresh_token } = manageData.data;

    // RBAC Check: Verify user has Admin role
    let isAdmin = false;

    // Check 1: fast decode JWT payload
    const payload = decodeJwtPayload(access_token);
    if (payload && payload.roles) {
      isAdmin = hasAdminRole(payload.roles);
    }

    // Check 2: verify against /me for freshest role data
    if (!isAdmin) {
      try {
        const meRes = await fetch(`${MANAGE_API_BASE}/api/v1/auth/me`, {
          headers: {
            Cookie: `access_token=${access_token}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        });
        if (meRes.ok) {
          const meData: AuthApiResponse<AdminUserProfile> = await meRes.json();
          if (meData.is_success && meData.data) {
            isAdmin = hasAdminRole(meData.data.role_names);
          }
        }
      } catch (meErr) {
        console.error('Failed to verify roles against /me:', meErr);
      }
    }

    // Reject non-admin users with 403 Forbidden
    if (!isAdmin) {
      return NextResponse.json<AuthApiResponse<null>>(
        {
          is_success: false,
          status_code: 403,
          message: 'Tài khoản của bạn không có quyền truy cập trang quản trị. Chỉ quản trị viên (Admin) mới có quyền truy cập.',
          data: null,
          pagination: null,
        },
        { status: 403 }
      );
    }

    // Admin verified: create success response and set SSO cookies
    const response = NextResponse.json<AuthApiResponse<AuthTokenData>>({
      is_success: true,
      status_code: 200,
      message: 'Đăng nhập thành công',
      data: manageData.data,
      pagination: null,
    });

    const hostname = request.headers.get('host') || '';
    const isDutAiDomain = hostname.includes('dutai.io.vn');
    const isHttps = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const cookieDomain = isDutAiDomain ? COOKIE_DOMAIN : undefined;

    // Set access_token cookie
    response.cookies.set({
      name: 'access_token',
      value: access_token,
      domain: cookieDomain,
      path: '/',
      httpOnly: true,
      secure: isHttps || isDutAiDomain,
      sameSite: 'lax',
      maxAge: 691200, // 8 days
    });

    // Set refresh_token cookie
    response.cookies.set({
      name: 'refresh_token',
      value: refresh_token,
      domain: cookieDomain,
      path: '/',
      httpOnly: true,
      secure: isHttps || isDutAiDomain,
      sameSite: 'lax',
      maxAge: 604800, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json<AuthApiResponse<null>>(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi hệ thống trong quá trình đăng nhập. Vui lòng thử lại sau.',
        data: null,
        pagination: null,
      },
      { status: 500 }
    );
  }
}
