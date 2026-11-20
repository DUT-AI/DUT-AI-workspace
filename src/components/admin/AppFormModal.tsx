'use client';

import React, { useState, useEffect } from 'react';
import { AppRegistryItem, CreateAppDto, UpdateAppDto } from '@/types/sso';
import {
  X,
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
  Settings,
  Terminal,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialApp?: AppRegistryItem | null;
}

const AVAILABLE_ICONS = [
  { name: 'LayoutDashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { name: 'GraduationCap', label: 'Học tập / LMS', icon: GraduationCap },
  { name: 'CheckSquare', label: 'Công việc / Tasks', icon: CheckSquare },
  { name: 'Database', label: 'Dữ liệu', icon: Database },
  { name: 'Sparkles', label: 'Trí tuệ AI', icon: Sparkles },
  { name: 'Globe', label: 'Website', icon: Globe },
  { name: 'Bot', label: 'Chatbot', icon: Bot },
  { name: 'Cpu', label: 'Hạ tầng / GPU', icon: Cpu },
  { name: 'FileText', label: 'Tài liệu / Docs', icon: FileText },
  { name: 'BarChart', label: 'Thống kê / Báo cáo', icon: BarChart },
  { name: 'Layers', label: 'Nền tảng', icon: Layers },
  { name: 'Terminal', label: 'Công cụ CLI', icon: Terminal },
];

const ACCENT_COLORS = [
  { class: 'bg-indigo-600', label: 'Indigo' },
  { class: 'bg-blue-600', label: 'Xanh dương' },
  { class: 'bg-emerald-600', label: 'Xanh lục' },
  { class: 'bg-violet-600', label: 'Tím violet' },
  { class: 'bg-amber-600', label: 'Vàng hổ phách' },
  { class: 'bg-rose-600', label: 'Đỏ hoa hồng' },
  { class: 'bg-cyan-600', label: 'Xanh lơ cyan' },
  { class: 'bg-purple-600', label: 'Tím đậm' },
];

export function AppFormModal({ isOpen, onClose, onSuccess, initialApp }: AppFormModalProps) {
  const isEditing = Boolean(initialApp);

  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [badge, setBadge] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [accentColor, setAccentColor] = useState('bg-indigo-600');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialApp) {
      setId(initialApp.id);
      setTitle(initialApp.title);
      setShortName(initialApp.shortName || '');
      setUrl(initialApp.url);
      setDescription(initialApp.description || '');
      setIcon(initialApp.icon || 'Sparkles');
      setBadge(initialApp.badge || '');
      setTagsInput(initialApp.tags ? initialApp.tags.join(', ') : '');
      setAccentColor(initialApp.accentColor || 'bg-indigo-600');
      setOrder(initialApp.order ?? 1);
      setIsActive(initialApp.isActive ?? true);
    } else {
      setId('');
      setTitle('');
      setShortName('');
      setUrl('https://');
      setDescription('');
      setIcon('Sparkles');
      setBadge('');
      setTagsInput('');
      setAccentColor('bg-indigo-600');
      setOrder(1);
      setIsActive(true);
    }
    setError(null);
  }, [initialApp, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEditing && !id.trim()) {
      setError('Vui lòng nhập mã định danh (id).');
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập tên ứng dụng.');
      return;
    }
    if (!url.trim() || !url.startsWith('http')) {
      setError('Vui lòng nhập URL hợp lệ (bắt đầu bằng http:// hoặc https://).');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      if (isEditing && initialApp) {
        const updatePayload: UpdateAppDto = {
          title: title.trim(),
          shortName: shortName.trim() || undefined,
          url: url.trim(),
          description: description.trim(),
          icon,
          badge: badge.trim() || undefined,
          tags,
          accentColor,
          order: Number(order),
          isActive,
        };

        const res = await fetch(`/api/v1/apps/${initialApp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        const data = await res.json();
        if (!res.ok || !data.is_success) {
          throw new Error(data.message || 'Lỗi khi cập nhật ứng dụng');
        }
      } else {
        const createPayload: CreateAppDto = {
          id: id.trim().toLowerCase(),
          title: title.trim(),
          shortName: shortName.trim() || undefined,
          url: url.trim(),
          description: description.trim(),
          icon,
          badge: badge.trim() || undefined,
          tags,
          accentColor,
          order: Number(order),
          isActive,
        };

        const res = await fetch('/api/v1/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });

        const data = await res.json();
        if (!res.ok || !data.is_success) {
          throw new Error(data.message || 'Lỗi khi tạo ứng dụng mới');
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${accentColor} flex items-center justify-center text-white shadow-inner font-bold text-sm`}>
              {title.charAt(0) || '+'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {isEditing ? `Chỉnh sửa ứng dụng: ${initialApp?.title}` : 'Đăng ký Ứng dụng mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Cập nhật thông tin và cài đặt hiển thị' : 'Thêm dịch vụ/website mới vào hệ sinh thái DUT-AI'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-sm flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã định danh (ID Slug) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                disabled={isEditing || isSubmitting}
                placeholder="vd: docs, ai-studio"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono disabled:opacity-50"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Chữ thường, số và dấu gạch ngang (không thể sửa sau khi tạo).</span>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Thứ tự sắp xếp (Order)
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                disabled={isSubmitting}
                min={0}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Số nhỏ hơn sẽ đứng trước trên menu.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên ứng dụng (Title) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="vd: DUT-AI LMS"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Short Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên rút gọn (Short Name)
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                disabled={isSubmitting}
                placeholder="vd: LMS Học tập"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Đường dẫn website (URL) <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isSubmitting}
              placeholder="https://lms.dutai.io.vn"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Mô tả chức năng <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              placeholder="Mô tả ngắn gọn về ứng dụng này..."
              required
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Badge */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nhãn phân loại (Badge)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                disabled={isSubmitting}
                placeholder="vd: Đào tạo, Quản trị, Dữ liệu"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Từ khóa tìm kiếm (Tags)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isSubmitting}
                placeholder="vd: Thi online, Khảo sát (cách nhau bởi dấu phẩy)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Biểu tượng đại diện (Icon)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Màu sắc chủ đạo (Accent Color)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {ACCENT_COLORS.map((col) => {
                const isSelected = accentColor === col.class;
                return (
                  <button
                    key={col.class}
                    type="button"
                    onClick={() => setAccentColor(col.class)}
                    title={col.label}
                    className={`w-7 h-7 rounded-full ${col.class} transition-all ring-offset-2 ring-offset-slate-900 ${
                      isSelected ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Active Status Switch */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-white block">Hiển thị ứng dụng</span>
              <span className="text-[11px] text-slate-400 block">
                Cho phép hiển thị trên Cổng Portal Hub và Waffle Menu 9 chấm
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? 'Lưu thay đổi' : 'Tạo ứng dụng'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
