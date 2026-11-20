import { NextRequest, NextResponse } from 'next/server';
import { getAllApps, getActiveApps, createApp } from '@/lib/app-storage';
import { requireAdmin } from '@/lib/auth';
import { CreateAppDto } from '@/types/sso';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * GET /api/v1/apps
 * Returns active apps by default, or all apps if ?all=true and requested by an Admin.
 */
export async function GET(request: NextRequest) {
  try {
    const showAll = request.nextUrl.searchParams.get('all') === 'true';

    let apps;
    if (showAll) {
      const auth = await requireAdmin(request);
      if (auth.authorized) {
        apps = await getAllApps();
      } else {
        apps = await getActiveApps();
      }
    } else {
      apps = await getActiveApps();
    }

    return NextResponse.json(
      {
        is_success: true,
        status_code: 200,
        message: 'Lấy danh sách ứng dụng thành công',
        data: apps,
        total: apps.length,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error('Error fetching apps:', error);
    return NextResponse.json(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi máy chủ khi lấy danh sách ứng dụng',
        data: [],
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/v1/apps
 * Registers a new application in the ecosystem (Admin only).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const body: CreateAppDto = await request.json().catch(() => null);

    if (!body || !body.id || !body.title || !body.url) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 400,
          message: 'Vui lòng cung cấp đầy đủ: Mã ứng dụng (id), Tên ứng dụng (title) và Đường dẫn (url).',
          data: null,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate ID format (slug)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(body.id.trim().toLowerCase())) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 400,
          message: 'Mã ứng dụng (id) chỉ được chứa chữ thường (a-z), số (0-9) và dấu gạch ngang (-).',
          data: null,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(body.url.trim());
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 400,
          message: 'Đường dẫn URL không hợp lệ. Phải bắt đầu bằng http:// hoặc https://',
          data: null,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const created = await createApp(body);

    return NextResponse.json(
      {
        is_success: true,
        status_code: 201,
        message: `Đã thêm ứng dụng "${created.title}" thành công.`,
        data: created,
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Lỗi hệ thống khi tạo ứng dụng';
    return NextResponse.json(
      {
        is_success: false,
        status_code: 400,
        message: errMsg,
        data: null,
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
