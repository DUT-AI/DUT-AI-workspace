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
  Globe,
  Bot,
  Cpu,
  FileText,
  BarChart,
  Terminal,
} from 'lucide-react';
import DutAiHeader from '@/components/common/DutAiHeader';
import { getActiveApps } from '@/lib/app-storage';
import { SSOIdentityClaim, AppRegistryItem } from '@/types/sso';

export const dynamic = 'force-dynamic';

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

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  Database,
  Sparkles,
  Globe,
  Bot,
  Cpu,
  FileText,
  BarChart,
  Layers,
  Terminal,
};

const APP_STYLE_MAP: Record<string, {
  gradient: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  hoverBorder: string;
  hoverText: string;
  footerText: string;
}> = {
  manage: {
    gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
    badgeBorder: 'border-blue-100 dark:border-blue-900/60',
    badgeText: 'text-blue-700 dark:text-blue-300',
    hoverBorder: 'hover:border-blue-500/40 dark:hover:border-blue-500/40',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    footerText: 'text-blue-600 dark:text-blue-400',
  },
  lms: {
    gradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-100 dark:border-emerald-900/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/40',
    hoverText: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    footerText: 'text-emerald-600 dark:text-emerald-400',
  },
  meetly: {
    gradient: 'from-violet-600 to-purple-600 shadow-violet-500/20',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/60',
    badgeBorder: 'border-violet-100 dark:border-violet-900/60',
    badgeText: 'text-violet-700 dark:text-violet-300',
    hoverBorder: 'hover:border-violet-500/40 dark:hover:border-violet-500/40',
    hoverText: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
    footerText: 'text-violet-600 dark:text-violet-400',
  },
  data: {
    gradient: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeBorder: 'border-amber-100 dark:border-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-500/40 dark:hover:border-amber-500/40',
    hoverText: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    footerText: 'text-amber-600 dark:text-amber-400',
  },
};

export default async function WorkspaceHubPage() {
  const user = getAuthenticatedUser();
  const userName = user?.name || null;
  const apps = await getActiveApps();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Global Navigation Header */}
      <DutAiHeader currentAppId="portal" currentUser={user} />

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
          {apps.map((app) => {
            const style = APP_STYLE_MAP[app.id] || {
              gradient: 'from-indigo-600 to-blue-600 shadow-indigo-500/20',
              badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
              badgeBorder: 'border-indigo-100 dark:border-indigo-900/60',
              badgeText: 'text-indigo-700 dark:text-indigo-300',
              hoverBorder: 'hover:border-indigo-500/40 dark:hover:border-indigo-500/40',
              hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
              footerText: 'text-indigo-600 dark:text-indigo-400',
            };

            const IconComponent = ICON_MAP[app.icon] || Sparkles;

            return (
              <a
                key={app.id}
                href={app.url}
                className={`group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl ${style.hoverBorder} transition-all duration-300 hover:-translate-y-1.5 overflow-hidden`}
              >
                <div>
                  {/* Top Bar inside Card: Icon & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}
                    >
                      <IconComponent className="w-7 h-7" />
                    </div>

                    {app.badge && (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${style.badgeBg} border ${style.badgeBorder} ${style.badgeText} transition-colors`}
                      >
                        {app.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-6">
                    <h2
                      className={`text-xl font-bold tracking-tight text-slate-900 dark:text-white ${style.hoverText} transition-colors`}
                    >
                      {app.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {app.description}
                    </p>
                  </div>

                  {/* Feature Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {app.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Domain URL & Call-to-Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 truncate max-w-[170px]">
                    {app.url.replace('https://', '')}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${style.footerText} group-hover:translate-x-1 transition-all`}
                  >
                    Truy cập
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} DUT-AI Team • Đại học Bách Khoa - ĐHĐN. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium text-slate-400">
              True Single Sign-On • Domain: <code className="text-indigo-400">.dutai.io.vn</code>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
