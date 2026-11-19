import { NextResponse } from 'next/server';
import { WORKSPACE_APPS } from '@/config/apps';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DUT-AI Unified Workspace',
    version: '2.0.0',
    appsCount: WORKSPACE_APPS.length,
    apps: WORKSPACE_APPS.map((app) => ({
      id: app.id,
      title: app.title,
      path: app.path,
    })),
  });
}
