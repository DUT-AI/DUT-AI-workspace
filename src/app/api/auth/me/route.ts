import { NextRequest, NextResponse } from 'next/server';
import { MANAGE_API_BASE, hasAdminRole } from '@/lib/auth';
import { AdminUserProfile, AuthApiResponse } from '@/types/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    const authHeader = request.headers.get('authorization');

    if (!accessToken && !authHeader) {
      return NextResponse.json<AuthApiResponse<null>>(
        {
          is_success: false,
          status_code: 401,
          message: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn',
          data: null,
          pagination: null,
        },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (accessToken) {
      headers['Cookie'] = `access_token=${accessToken}`;
    }
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const res = await fetch(`${MANAGE_API_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const body: AuthApiResponse<AdminUserProfile> = await res.json();

    if (!res.ok || !body.is_success || !body.data) {
      return NextResponse.json<AuthApiResponse<null>>(
        {
          is_success: false,
          status_code: res.status,
          message: body.message || 'Không thể xác thực thông tin người dùng',
          data: null,
          pagination: null,
        },
        { status: res.status }
      );
    }

    const user = body.data;
    const isAdmin = hasAdminRole(user.role_names);

    return NextResponse.json<AuthApiResponse<AdminUserProfile & { is_admin: boolean }>>({
      is_success: true,
      status_code: 200,
      message: body.message || 'Success fetching user profile',
      data: {
        ...user,
        is_admin: isAdmin,
      },
      pagination: null,
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json<AuthApiResponse<null>>(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi hệ thống khi kiểm tra phiên đăng nhập',
        data: null,
        pagination: null,
      },
      { status: 500 }
    );
  }
}
