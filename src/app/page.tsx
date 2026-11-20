import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  Database,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import DutAiHeader from '@/components/common/DutAiHeader';
import { WORKSPACE_APPS } from '@/config/apps';
import { SSOIdentityClaim } from '@/types/sso';

function getAuthenticatedUser(): SSOIdentityClaim | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedStr = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedStr);

    return {
      sub: String(payload.sub || payload.user_id || ''),
      name: payload.name || 'Thành viên DUT-AI',
      email: payload.email || '',
      role_names: payload.roles || payload.role_names || [],
      avatar: payload.avatar || payload.avatar_url || '',
      iat: payload.iat || 0,
      exp: payload.exp || 0,
    };
  } catch {
    return null;
  }
}

const APP_STYLE_MAP: Record<string, {
  gradient: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  hoverBorder: string;
  hoverText: string;
  footerText: string;
  icon: React.ReactNode;
}> = {
  manage: {
    gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeBorder: 'border-blue-100 dark:border-blue-900/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    hoverBorder: 'hover:border-blue-500/40 dark:hover:border-blue-500/40',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    footerText: 'text-blue-600 dark:text-blue-400',
    icon: <LayoutDashboard className="w-7 h-7" />,
  },
  lms: {
    gradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-100 dark:border-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    footerText: 'text-emerald-600 dark:text-emerald-400',
    icon: <GraduationCap className="w-7 h-7" />,
  },
  meetly: {
    gradient: 'from-violet-600 to-purple-600 shadow-violet-500/20',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/60',
    badgeBorder: 'border-violet-100 dark:border-violet-900/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
    hoverBorder: 'hover:border-violet-500/40 dark:hover:border-violet-500/40',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    footerText: 'text-violet-600 dark:text-violet-400',
    icon: <CheckSquare className="w-7 h-7" />,
  },
  data: {
    gradient: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeBorder: 'border-amber-100 dark:border-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-500/40 dark:hover:border-amber-500/40',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    footerText: 'text-amber-600 dark:text-amber-400',
    icon: <Database className="w-7 h-7" />,
  },
};

export default function WorkspaceHubPage() {
  const user = getAuthenticatedUser();
  const userName = user?.name || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Global Navigation Header */}
      <DutAiHeader currentAppId="manage" currentUser={user} />

      {/* 2. Hero Section with Personalized Greeting */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-center">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Hệ sinh thái DUT-AI Unified Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {userName ? (
              <>
                Xin chào,{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {userName}
                </span>{' '}
                👋
              </>
            ) : (
              <>
                Chào mừng đến với{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  DUT-AI Workspace
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Không gian làm việc số tập trung. Hãy chọn phân hệ ứng dụng để bắt đầu học tập, nghiên cứu và quản trị:
          </p>
        </div>

        {/* 3. Core App Launcher Grid Cards (Dynamic from Central Registry) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKSPACE_APPS.map((app) => {
            const style = APP_STYLE_MAP[app.id] || APP_STYLE_MAP.manage;
            const tags = app.tags || [];

            return (
              <a
                key={app.id}
                href={app.url}
                className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl ${style.hoverBorder} transition-all duration-300 transform hover:-translate-y-1.5`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${style.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300`}>
                      {style.icon}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badgeBg} ${style.badgeText} border ${style.badgeBorder}`}>
                      {app.badge || 'Hệ sinh thái'}
                    </span>
                  </div>

                  <h2 className={`text-xl font-bold text-slate-900 dark:text-white ${style.hoverText} transition-colors`}>
                    {app.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                    {app.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold ${style.footerText}`}>
                  <span>Mở ứng dụng</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>

        {/* 4. Bottom Ecosystem Status Banner */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Trạng thái hệ sinh thái:
            </span>
            <span>Tất cả {WORKSPACE_APPS.length} phân hệ đang hoạt động ổn định</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>Single Sign-On (True SSO): Active</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>Bảo mật: HTTPS / HttpOnly Cookie</span>
          </div>
        </div>
      </main>

      {/* 5. Minimal Footer */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 DUT-AI Workspace. Nền tảng tích hợp số Trường Đại học Bách Khoa - ĐHĐN.</p>
      </footer>
    </div>
  );
}
