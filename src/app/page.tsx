import React from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
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

export default function WorkspaceHubPage() {
  const user = getAuthenticatedUser();
  const userName = user?.name || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Global Navigation Header */}
      <DutAiHeader currentAppId="manage" currentUser={user} />

      {/* 2. Hero Section with Personalized Greeting */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col justify-center">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Hệ sinh thái DUT-AI Unified Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {userName ? (
              <>
                Xin chào, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">{userName}</span> 👋
              </>
            ) : (
              <>
                Chào mừng đến với <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">DUT-AI Workspace</span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Không gian làm việc số tập trung. Hãy chọn phân hệ ứng dụng để bắt đầu học tập, nghiên cứu và quản trị:
          </p>
        </div>

        {/* 3. Three Core App Launcher Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: DUT-AI Management */}
          <a
            href="/manage/dashboard"
            className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
                  Quản trị
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                DUT-AI Management
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Bảng điều khiển quản trị trung tâm, quản lý người dùng, lớp học, phân quyền giảng viên và theo dõi tài nguyên hệ thống.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Tài khoản
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Phân quyền
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Thống kê
                </span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400">
              <span>Vào Bảng Quản trị</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </a>

          {/* Card 2: DUT-AI LMS */}
          <a
            href="/lms/dashboard"
            className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                  Học tập & Khảo sát
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                DUT-AI LMS
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Nền tảng thi trắc nghiệm thông minh, làm bài tập về nhà, ngân hàng câu hỏi khảo sát và bảng xếp hạng thành tích sinh viên.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Thi trắc nghiệm
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Bài tập
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Khảo sát
                </span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Vào Cổng Học tập</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </a>

          {/* Card 3: Meetly Tasks */}
          <a
            href="/meetly/tasks"
            className="group relative flex flex-col justify-between p-7 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all duration-300 transform hover:-translate-y-1.5"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">
                  <CheckSquare className="w-7 h-7" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60">
                  Công việc & Lịch trình
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                Meetly Tasks
              </h2>

              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Quản lý công việc trực quan với bảng Kanban, ghi chú cuộc họp nhóm, quản trị dự án và theo dõi tiến độ công tác khoa.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Bảng Kanban
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Cuộc họp
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Dự án
                </span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-semibold text-violet-600 dark:text-violet-400">
              <span>Vào Bảng Công việc</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </div>
          </a>
        </div>

        {/* 4. Bottom Ecosystem Status Banner */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Trạng thái hệ sinh thái:
            </span>
            <span>Tất cả dịch vụ Quản lý, LMS và Meetly đang hoạt động ổn định</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>Single Sign-On: Hoạt động</span>
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
