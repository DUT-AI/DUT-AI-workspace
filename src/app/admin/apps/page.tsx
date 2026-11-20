import React from 'react';
import { AppList } from '@/components/admin/AppList';
import { Layers } from 'lucide-react';

export const metadata = {
  title: 'Quản lý Ứng dụng | DUT-AI Admin',
  description: 'Quản lý danh sách các trang web và dịch vụ trong hệ sinh thái DUT-AI Workspace',
};

export default function AdminAppsPage() {
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
