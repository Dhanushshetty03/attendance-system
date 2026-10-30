import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-slate-200 dark:border-slate-800`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-3 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
