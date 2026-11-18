import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({ notification, onDismiss }) {
  if (!notification) return null;

  const { message, type = 'success' } = notification;

  return (
    <div className="toast-container" role={type === 'error' ? 'alert' : 'status'} aria-live={type === 'error' ? 'assertive' : 'polite'}>
      <div className={`toast toast-${type}`}>
        {type === 'success' && <CheckCircle2 size={18} color="var(--color-primary)" aria-hidden="true" />}
        {type === 'error' && <AlertTriangle size={18} color="var(--color-danger)" aria-hidden="true" />}
        {type === 'info' && <Info size={18} color="var(--color-accent-blue)" aria-hidden="true" />}

        <div className="toast-message">{message}</div>

        <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
