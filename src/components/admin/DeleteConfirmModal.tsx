'use client';

import React, { useState } from 'react';
import { AppRegistryItem } from '@/types/sso';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  app: AppRegistryItem | null;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  app,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !app) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/apps/${app.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.is_success) {
        throw new Error(data.message || 'Lỗi khi xóa ứng dụng');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">Xác nhận xóa ứng dụng?</h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          Bạn có chắc chắn muốn xóa ứng dụng <span className="font-bold text-white">"{app.title}"</span> (mã: <span className="font-mono text-indigo-300">{app.id}</span>) khỏi hệ thống? Thao tác này không thể hoàn tác.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs text-left">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-1/2 py-2.5 px-4 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-1/2 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa vĩnh viễn</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
