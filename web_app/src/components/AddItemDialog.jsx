import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Tag } from 'lucide-react';
import { ItemNameInput } from './ItemNameInput';

/**
 * Pop-up (mount it only while open) shown on top of the service form: asks for the item name (with suggestions
 * from earlier entries) and its price. On "Add", the item is created or reused,
 * marked as serviced with that price, and the user is returned to the service form.
 */
export function AddItemDialog({ onClose, onSubmit, suggestions = [], currency = '₹' }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const priceRef = useRef(null);

  const submit = async (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter the item name.'); return; }
    const p = price === '' ? 0 : parseFloat(price);
    if (isNaN(p) || p < 0) { setError('Please enter a valid price.'); return; }
    setBusy(true);
    try {
      const ok = await onSubmit({ name: trimmed, price: p });
      if (ok !== false) onClose();
    } finally {
      setBusy(false);
    }
  };

  const stop = (e) => e.stopPropagation();

  return createPortal(
    <div
      className="modal-overlay add-item-overlay"
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-title"
        className="modal-content add-item-dialog"
        onClick={stop}
        onSubmit={submit}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="add-item-icon"><Tag size={18} /></div>
            <h2 className="modal-title" id="add-item-title">Add Service Item</h2>
          </div>
          <button type="button" className="btn-icon-only" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="add-item-name">Item name</label>
          <ItemNameInput
            value={name}
            onChange={(v) => { setName(v); setError(''); }}
            onPick={() => setTimeout(() => priceRef.current?.focus(), 0)}
            onEnter={() => priceRef.current?.focus()}
            suggestions={suggestions}
            placeholder="e.g. Spark plugs"
            ariaLabel="Item name"
            autoFocus
            inputId="add-item-name"
          />
          <div className="form-hint">Start typing — names from your earlier services are suggested.</div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="add-item-price">Price ({currency})</label>
          <div style={{ position: 'relative' }}>
            <span className="input-prefix">{currency}</span>
            <input
              id="add-item-price"
              ref={priceRef}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              className="form-input"
              style={{ paddingLeft: '30px' }}
              placeholder="0"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setError(''); }}
            />
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || busy}>
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
