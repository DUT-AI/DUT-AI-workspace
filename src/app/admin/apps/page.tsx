'use client';

import React from 'react';
import { AppList } from '@/components/admin/AppList';
import { useAuth } from '@/components/auth/AuthProvider';
import { Layers, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminAppsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Quyền truy cập bị giới hạn</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Chỉ có tài khoản Quản trị viên (Admin) mới có quyền truy cập và quản lý ứng dụng hệ thống (/admin/apps).
        </p>
        <Link
          href="/admin"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Quay lại Bảng điều khiển Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Hệ sinh thái DUT-AI</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Quản lý Trang web & Ứng dụng</h1>
        <p className="text-xs text-slate-400">
          Thêm, sửa, xóa hoặc bật/tắt hiển thị các dịch vụ trong Cổng thông tin (Portal Hub) và Menu 9 chấm (Waffle).
        </p>
      </div>

      {/* Main Apps Management List */}
      <AppList />
    </div>
  );
}
