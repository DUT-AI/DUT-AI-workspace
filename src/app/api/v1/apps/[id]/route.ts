import { NextRequest, NextResponse } from 'next/server';
import { getAppById, updateApp, deleteApp } from '@/lib/app-storage';
import { requireAdmin } from '@/lib/auth';
import { UpdateAppDto } from '@/types/sso';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
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
 * GET /api/v1/apps/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const app = await getAppById(params.id);
    if (!app) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 404,
          message: `Không tìm thấy ứng dụng với mã "${params.id}".`,
          data: null,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        is_success: true,
        status_code: 200,
        message: 'Lấy thông tin ứng dụng thành công',
        data: app,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(`Error fetching app ${params.id}:`, error);
    return NextResponse.json(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi máy chủ',
        data: null,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * PUT /api/v1/apps/[id]
 * Updates an existing application (Admin only).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const body: UpdateAppDto = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 400,
          message: 'Dữ liệu cập nhật không hợp lệ.',
          data: null,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate URL if provided
    if (body.url) {
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
    }

    const updated = await updateApp(params.id, body);
    if (!updated) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 404,
          message: `Không tìm thấy ứng dụng "${params.id}" để cập nhật.`,
          data: null,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        is_success: true,
        status_code: 200,
        message: `Đã cập nhật ứng dụng "${updated.title}" thành công.`,
        data: updated,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(`Error updating app ${params.id}:`, error);
    return NextResponse.json(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi hệ thống khi cập nhật ứng dụng.',
        data: null,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * DELETE /api/v1/apps/[id]
 * Deletes an application (Admin only).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const success = await deleteApp(params.id);
    if (!success) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 404,
          message: `Không tìm thấy ứng dụng "${params.id}" để xóa.`,
          data: null,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        is_success: true,
        status_code: 200,
        message: `Đã xóa ứng dụng "${params.id}" khỏi hệ sinh thái thành công.`,
        data: null,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(`Error deleting app ${params.id}:`, error);
    return NextResponse.json(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi hệ thống khi xóa ứng dụng.',
        data: null,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
