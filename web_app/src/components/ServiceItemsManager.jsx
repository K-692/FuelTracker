import React, { useMemo, useState } from 'react';
import { Plus, Edit3, Trash2, Check, X, ListChecks } from 'lucide-react';
import { sortServiceItems, isEngineOilItem, getItemNameSuggestions } from '../domain/serviceItems';
import { ItemNameInput } from './ItemNameInput';

/**
 * Lets the user build their own list of servicing items (no pre-defined catalogue).
 * Items are shared across vehicles and synced to Firestore (users/{uid}/service_items).
 */
export function ServiceItemsManager({
  serviceItems = [],
  services = [],
  onAdd,
  onUpdate,
  onDelete,
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null); // { id, name, category }
  const [busy, setBusy] = useState(false);

  const items = useMemo(() => sortServiceItems(serviceItems), [serviceItems]);
  // Suggest names from past service records that are not already in the list
  const nameSuggestions = useMemo(
    () => getItemNameSuggestions(services, serviceItems).filter(sg => !sg.inList),
    [services, serviceItems]
  );

  const usage = useMemo(() => {
    const counts = {};
    services.forEach(s => {
      Object.entries(s.components || {}).forEach(([id, d]) => {
        if (d && d.done) counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [services]);

  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const saved = await onAdd({ name, category });
      if (saved) {
        setName('');
        setCategory('');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !editing.name.trim()) return;
    const original = serviceItems.find(i => i.id === editing.id) || {};
    await onUpdate({ ...original, ...editing });
    setEditing(null);
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <ListChecks size={20} color="var(--color-primary)" aria-hidden="true" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>My Service Items</h2>
        <span className="badge badge-primary">{items.length}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Build your own list of parts and jobs. They appear in every service log, for all your vehicles, on web and Android.
        An item named <strong>Engine oil</strong> automatically powers the oil-change reminder.
      </p>

      <form className="add-item-row" onSubmit={handleAdd}>
        <ItemNameInput
          value={name}
          onChange={setName}
          onEnter={handleAdd}
          suggestions={nameSuggestions}
          placeholder="Item name, e.g. Brake pads"
          ariaLabel="Service item name"
        />
        <input
          type="text"
          className="form-input"
          style={{ flex: '1 1 140px' }}
          placeholder="Group (optional)"
          value={category}
          maxLength={40}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Service item group"
        />
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || busy}>
          <Plus size={15} />
          <span>Add</span>
        </button>
      </form>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 12px', color: 'var(--text-muted)', fontSize: '0.88rem', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
          No items yet. Add the first thing you get serviced, such as <em>Engine oil</em>.
        </div>
      ) : (
        <div className="service-items-list">
          {items.map(item => {
            const isEditing = editing?.id === item.id;
            const used = usage[item.id] || 0;
            return (
              <div key={item.id} className="service-item-row">
                {isEditing ? (
                  <div className="service-item-edit">
                    <input
                      type="text"
                      className="form-input"
                      value={editing.name}
                      maxLength={60}
                      autoFocus
                      onChange={(e) => setEditing(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(null); }}
                      aria-label="Item name"
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: '1 1 120px' }}
                      value={editing.category || ''}
                      placeholder="Group (optional)"
                      maxLength={40}
                      onChange={(e) => setEditing(prev => ({ ...prev, category: e.target.value }))}
                      aria-label="Item group"
                    />
                    <div className="item-actions">
                      <button type="button" className="btn-icon-only" onClick={handleSaveEdit} aria-label="Save item" title="Save">
                        <Check size={16} color="var(--color-primary)" />
                      </button>
                      <button type="button" className="btn-icon-only" onClick={() => setEditing(null)} aria-label="Cancel editing" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="item-main">
                      <div className="item-name">{item.name}</div>
                      <div className="item-meta">
                        {[
                          isEngineOilItem(item) ? '🛢️ Engine oil reminder' : null,
                          item.category || null,
                          used > 0 ? `Used in ${used} service${used === 1 ? '' : 's'}` : 'Not used yet',
                        ].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-icon-only"
                        onClick={() => setEditing({ id: item.id, name: item.name, category: item.category || '' })}
                        aria-label={`Edit ${item.name}`}
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-only"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => onDelete(item)}
                        aria-label={`Remove ${item.name}`}
                        title="Remove from list"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
