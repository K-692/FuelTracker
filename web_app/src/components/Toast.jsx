import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({ notification, onDismiss }) {
  if (!notification) return null;

  const { message, type = 'success' } = notification;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' && <CheckCircle2 size={18} color="var(--color-primary)" />}
        {type === 'error' && <AlertTriangle size={18} color="var(--color-danger)" />}
        {type === 'info' && <Info size={18} color="var(--color-accent-blue)" />}

        <div style={{ flex: 1 }}>{message}</div>

        <button 
          onClick={onDismiss} 
          style={{ opacity: 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
