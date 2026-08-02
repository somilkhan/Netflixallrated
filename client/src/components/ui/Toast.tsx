/**
 * Toast — lightweight global notification system.
 * Supports success / error / info with auto-dismiss and Framer Motion transitions.
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast:   (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────
const MAX_TOASTS     = 3;
const AUTO_DISMISS   = 4000;

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const COLOR_MAP: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg:     'rgba(20,83,45,0.95)',
    border: 'rgba(74,222,128,0.20)',
    icon:   '#4ade80',
    text:   '#dcfce7',
  },
  error: {
    bg:     'rgba(127,29,29,0.95)',
    border: 'rgba(248,113,113,0.20)',
    icon:   '#f87171',
    text:   '#fee2e2',
  },
  info: {
    bg:     'rgba(24,24,27,0.95)',
    border: 'rgba(255,255,255,0.10)',
    icon:   '#a1a1aa',
    text:   '#e4e4e7',
  },
};

// ── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Single toast item ──────────────────────────────────────────────────────
function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const colors = COLOR_MAP[item.type];
  const Icon   = ICON_MAP[item.type];

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: 10, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      role="alert"
      aria-live="polite"
      className="flex items-start gap-3 w-full px-4 py-3 rounded-[12px] shadow-2xl"
      style={{
        background:          colors.bg,
        border:              `1px solid ${colors.border}`,
        backdropFilter:      'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
      }}
    >
      <Icon size={17} className="shrink-0 mt-0.5" style={{ color: colors.icon }} />
      <p className="text-[13px] font-medium leading-snug flex-1" style={{ color: colors.text }}>
        {item.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 mt-0.5 opacity-40 hover:opacity-90 transition-opacity"
        style={{ color: colors.text }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `t-${++counter.current}`;
    setToasts(prev => {
      const next = [...prev, { id, type, message }];
      // Trim to max, keeping most recent
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
  }, []);

  const ctx: ToastContextValue = {
    toast:   addToast,
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error', msg),
    info:    (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/*
        * Positioned above the mobile bottom nav (~64px) + bottom player (~68px) = ~132px.
        * Using 140px gives a comfortable buffer.
        */}
      <div
        className="fixed bottom-[140px] md:bottom-6 left-1/2 -translate-x-1/2 z-[500]
                   flex flex-col gap-2 items-center w-full max-w-[360px] px-4"
        style={{ pointerEvents: 'none' }}
        aria-label="Notifications"
      >
        <AnimatePresence mode="sync">
          {toasts.map(t => (
            <div key={t.id} style={{ pointerEvents: 'auto', width: '100%' }}>
              <ToastEntry item={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
