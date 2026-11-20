'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppRegistryItem } from '@/types/sso';
import { AppFormModal } from './AppFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
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
  RefreshCw,
} from 'lucide-react';

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

export function AppList() {
  const [apps, setApps] = useState<AppRegistryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppRegistryItem | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<AppRegistryItem | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/apps?all=true', { cache: 'no-store' });
      if (res.ok) {
        const body = await res.json();
        if (body.is_success && Array.isArray(body.data)) {
          setApps(body.data);
        }
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleToggle = async (app: AppRegistryItem) => {
    try {
      setTogglingId(app.id);
      const res = await fetch(`/api/v1/apps/${app.id}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await fetchApps();
      }
    } catch (err) {
      console.error('Failed to toggle app:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingApp(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (app: AppRegistryItem) => {
    setEditingApp(app);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (app: AppRegistryItem) => {
    setDeletingApp(app);
    setIsDeleteModalOpen(true);
  };

  // Filter and search
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.tags && app.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return app.isActive !== false;
    if (statusFilter === 'inactive') return app.isActive === false;
    return true;
  });

  const renderIcon = (iconName: string, accentColor?: string) => {
    const IconComponent = ICON_MAP[iconName] || Sparkles;
    return (
      <div
        className={`w-10 h-10 rounded-xl ${accentColor || 'bg-indigo-600'} flex items-center justify-center text-white shadow-inner font-bold text-sm shrink-0`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, ID, URL hoặc từ khóa..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({apps.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoạt động ({apps.filter((a) => a.isActive !== false).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'inactive' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang ẩn ({apps.filter((a) => a.isActive === false).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchApps()}
            title="Làm mới"
            className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ứng dụng mới</span>
          </button>
        </div>
      </div>

      {/* Applications List / Table */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs">Đang tải danh sách ứng dụng...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Không tìm thấy ứng dụng nào</h4>
          <p className="text-xs text-slate-400 mb-4">
            {searchQuery ? 'Không có ứng dụng nào khớp với từ khóa tìm kiếm.' : 'Chưa có ứng dụng nào được cấu hình trong hệ sinh thái.'}
          </p>
          <button
            onClick={openCreateModal}
            className="py-2 px-4 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ứng dụng đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredApps.map((app) => {
            const isToggling = togglingId === app.id;
            const isCurrentlyActive = app.isActive !== false;

            return (
              <div
                key={app.id}
                className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCurrentlyActive
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/50 opacity-75 hover:opacity-100 bg-slate-900/40'
                }`}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {renderIcon(app.icon, app.accentColor)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{app.title}</h4>
                      {app.shortName && (
                        <span className="text-[11px] text-slate-400 font-medium">({app.shortName})</span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                        {app.id}
                      </span>
                      {app.badge && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {app.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">Thứ tự: #{app.order ?? 0}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 mb-2 leading-relaxed">
                      {app.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px]">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-mono transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[280px]">{app.url}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Status toggle & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 shrink-0">
                  {/* Status Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(app)}
                      disabled={isToggling}
                      title={isCurrentlyActive ? 'Click để ẩn ứng dụng' : 'Click để kích hoạt hiển thị'}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isCurrentlyActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isCurrentlyActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{isCurrentlyActive ? 'Đang mở' : 'Đang ẩn'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(app)}
                      title="Chỉnh sửa thông tin"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => openDeleteModal(app)}
                      title="Xóa ứng dụng"
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-transparent hover:border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AppFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchApps}
        initialApp={editingApp}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={fetchApps}
        app={deletingApp}
      />
    </div>
  );
}
