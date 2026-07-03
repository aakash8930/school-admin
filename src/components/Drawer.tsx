import { useEffect } from 'react';

interface DrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Right-side slide-in drawer used by the Add school / Add user forms.
 * The backdrop fades in, the panel slides in with an ease-out curve, and the
 * content settles a beat later. Closes on ✕, backdrop click, or Escape.
 */
export function Drawer({ title, subtitle, onClose, children }: DrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] animate-[overlay-in_0.25s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl shadow-slate-900/20 animate-[drawer-in_0.35s_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="m10 8.6 4.3-4.3 1.4 1.4L11.4 10l4.3 4.3-1.4 1.4L10 11.4l-4.3 4.3-1.4-1.4L8.6 10 4.3 5.7l1.4-1.4L10 8.6Z" />
            </svg>
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden animate-[drawer-content-in_0.4s_0.1s_cubic-bezier(0.16,1,0.3,1)_backwards]">
          {children}
        </div>
      </div>
    </div>
  );
}
