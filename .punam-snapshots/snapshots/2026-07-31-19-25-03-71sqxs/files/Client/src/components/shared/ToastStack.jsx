import { X, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { ToastStackStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

const ICONS = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

export function ToastStack() {
  const { toasts = [], dismissToast } = useApp();
  if (!toasts.length) return null;

  return (
    <div className={styles.Stack} aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={styles.Toast} data-type={t.type || 'info'}>
            <Icon size={16} className={styles.Icon} aria-hidden="true" />
            <span className={styles.Message}>{t.message}</span>
            <button
              type="button"
              className={styles.Close}
              onClick={() => dismissToast?.(t.id)}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
