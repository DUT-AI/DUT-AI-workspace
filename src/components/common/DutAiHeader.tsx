'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Bell,
  LogOut,
  User,
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  Database,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { WORKSPACE_APPS } from '@/config/apps';
import { SSOIdentityClaim } from '@/types/sso';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';

interface DutAiHeaderProps {
  currentAppId?: 'manage' | 'lms' | 'meetly' | 'data' | string;
  currentUser?: SSOIdentityClaim | null;
  onLogout?: () => void;
}

export function DutAiHeader({ currentAppId = 'portal', currentUser, onLogout }: DutAiHeaderProps) {
  const [isWaffleOpen, setIsWaffleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const waffleRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const auth = useAuth();
  const effectiveUser = currentUser || (auth.user ? {
    id: String(auth.user.id),
    name: auth.user.name,
    email: auth.user.email,
    avatar: auth.user.avatar_url || undefined,
  } : null);

  const isAdmin = auth.isAdmin;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (waffleRef.current && !waffleRef.current.contains(event.target as Node)) {
        setIsWaffleOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await auth.logout();
    } catch {
      window.location.href = '/login';
    }
  };

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-5 h-5 text-blue-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-emerald-500" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-violet-500" />;
      case 'Database':
        return <Database className="w-5 h-5 text-amber-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
    }
  };

  const currentApp = WORKSPACE_APPS.find((app) => app.id === currentAppId);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Ecosystem Brand & Active App */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-slate-900 dark:text-white hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm shadow-sm">
            AI
          </div>
          <span className="hidden sm:inline-block tracking-tight text-base font-semibold">
            DUT-AI <span className="font-normal text-slate-500 dark:text-slate-400">Workspace</span>
          </span>
        </Link>

        {currentApp && (
          <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentApp.title}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions, 9-Dots Waffle Menu, User Profile */}
      <div className="flex items-center gap-2">
        {/* Admin Link if logged in */}
        {effectiveUser && (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản trị</span>
          </Link>
        )}

        {/* 9-Dots Waffle App Launcher */}
        <div className="relative" ref={waffleRef}>
          <button
            type="button"
            aria-label="Ứng dụng DUT-AI"
            onClick={() => setIsWaffleOpen(!isWaffleOpen)}
            className={`p-2 rounded-full transition-colors ${isWaffleOpen
                ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* Waffle Popover Menu */}
          {isWaffleOpen && (
            <div className="absolute right-0 mt-2 w-80 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Hệ sinh thái DUT-AI
                </p>
                <Link
                  href="/"
                  onClick={() => setIsWaffleOpen(false)}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Portal Hub
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {WORKSPACE_APPS.map((app) => {
                  const isActive = app.id === currentAppId;
                  return (
                    <a
                      key={app.id}
                      href={app.url}
                      className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${isActive
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                        {getAppIcon(app.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {app.title}
                          </p>
                          {isActive && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                              Đang mở
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {app.description}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown or Login Button */}
        {effectiveUser ? (
          <div className="relative ml-1" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {effectiveUser?.avatar ? (
                <img
                  src={effectiveUser.avatar}
                  alt={effectiveUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-semibold text-xs border border-indigo-500/30">
                  {effectiveUser?.name?.charAt(0) || <User className="w-4 h-4" />}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {effectiveUser?.name}
                    </p>
                    {isAdmin && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {effectiveUser?.email}
                  </p>
                </div>

                <div className="pt-1 space-y-0.5">
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Trang Quản trị Workspace</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất khỏi Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export default DutAiHeader;
