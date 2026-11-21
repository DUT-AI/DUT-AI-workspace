'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import {
  ShieldAlert,
  LogOut,
  LayoutGrid,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Sliders,
  Layers,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, status, logout } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/admin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Đang xác thực quyền Quản trị viên...</p>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Truy cập bị từ chối (403)</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Tài khoản <span className="font-semibold text-white">{user?.email || 'hiện tại'}</span> không có quyền truy cập không gian này.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Quay về Cổng ứng dụng
            </Link>
            <button
              onClick={() => logout()}
              className="py-2.5 px-4 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Đăng nhập tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-50 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                DUT-AI Workspace
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mt-1">
                Admin Control Plane
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400 ml-4">
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                pathname === '/admin'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Tổng quan</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/apps"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith('/admin/apps')
                    ? 'text-white bg-slate-800/80 font-semibold'
                    : 'hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Quản lý Ứng dụng</span>
              </Link>
            )}
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cổng Portal Hub</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile display */}
          <div className="flex items-center gap-3 pl-3 pr-2 py-1 rounded-xl bg-slate-800/50 border border-slate-800">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-semibold text-xs flex items-center justify-center border border-indigo-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{user?.name}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{user?.email}</span>
            </div>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ml-1 ${
              isAdmin
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-700/50 text-slate-300 border-slate-600/40'
            }`}>
              {isAdmin ? 'Admin' : 'Thành viên'}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={() => logout()}
            title="Đăng xuất khỏi Workspace"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20 flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
