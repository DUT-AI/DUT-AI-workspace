'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { WORKSPACE_APPS } from '@/config/apps';
import {
  ShieldCheck,
  ExternalLink,
  Layers,
  Key,
  Database,
  Users,
  Server,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Không gian Quản trị DUT-AI</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Xin chào, {user?.name || 'Quản trị viên'}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Bạn đang quản trị cổng thông tin tập trung DUT-AI Workspace. Tại đây bạn có thể kiểm tra trạng thái các dịch vụ, phân quyền và điều hướng nhanh trong hệ sinh thái.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Xem Cổng Portal Hub</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics / Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{WORKSPACE_APPS.length}</div>
            <div className="text-xs text-slate-400">Ứng dụng tích hợp</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">True SSO</div>
            <div className="text-xs text-slate-400">Domain .dutai.io.vn</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{user?.role_names?.length || 1}</div>
            <div className="text-xs text-slate-400">Vai trò được cấp ({user?.role_names?.join(', ')})</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{user?.permissions?.length || 0}</div>
            <div className="text-xs text-slate-400">Quyền hạn hệ thống</div>
          </div>
        </div>
      </div>

      {/* Ecosystem Apps Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span>Các dịch vụ trong hệ sinh thái DUT-AI</span>
          </h2>
          <Link
            href="/api/v1/apps"
            target="_blank"
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <span>Registry API JSON</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {WORKSPACE_APPS.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-inner font-bold text-lg ${app.accentColor || 'bg-indigo-600'}`}
                  >
                    {app.title.charAt(0)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                  {app.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                  {app.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
                  {app.url.replace('https://', '')}
                </span>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                  title={`Mở ${app.title}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
