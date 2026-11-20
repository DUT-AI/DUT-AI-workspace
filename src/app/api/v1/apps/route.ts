import { NextResponse } from 'next/server';
import { WORKSPACE_APPS } from '@/config/apps';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=60, s-maxage=60',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      is_success: true,
      data: WORKSPACE_APPS,
      total: WORKSPACE_APPS.length,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: CORS_HEADERS,
    }
  );
}
