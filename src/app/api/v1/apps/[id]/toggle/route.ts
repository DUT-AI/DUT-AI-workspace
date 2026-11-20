import { NextRequest, NextResponse } from 'next/server';
import { toggleAppActive } from '@/lib/app-storage';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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
 * PATCH /api/v1/apps/[id]/toggle
 * Toggles the active status of an application (Admin only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) {
    return auth.errorResponse;
  }

  try {
    const updated = await toggleAppActive(params.id);
    if (!updated) {
      return NextResponse.json(
        {
          is_success: false,
          status_code: 404,
          message: `Không tìm thấy ứng dụng "${params.id}" để bật/tắt trạng thái.`,
          data: null,
        },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const statusText = updated.isActive ? 'kích hoạt hiển thị' : 'ẩn khỏi menu người dùng';
    return NextResponse.json(
      {
        is_success: true,
        status_code: 200,
        message: `Đã ${statusText} cho ứng dụng "${updated.title}".`,
        data: updated,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error(`Error toggling app ${params.id}:`, error);
    return NextResponse.json(
      {
        is_success: false,
        status_code: 500,
        message: 'Lỗi hệ thống khi thay đổi trạng thái ứng dụng.',
        data: null,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
