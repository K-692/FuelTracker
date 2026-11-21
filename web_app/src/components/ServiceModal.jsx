import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Wrench, 
  Check, 
  Search, 
  Calculator, 
  Calendar, 
  Gauge, 
  Building2, 
  FileText,
  Plus,
  Droplet
} from 'lucide-react';
import { sortServiceItems, isEngineOilItem, resolveItemName, getItemNameSuggestions } from '../domain/serviceItems';
import { ItemNameInput } from './ItemNameInput';

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  activeVehicle = null,
  currency = '₹',
  unit = 'km',
  latestOdometer = 0,
  serviceItems = [],
  services = [],
  onAddServiceItem
}) {
  const [serviceDate, setServiceDate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [notes, setNotes] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [componentsState, setComponentsState] = useState({});

  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemIsOil, setNewItemIsOil] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [error, setError] = useState('');

  // Synchronize modal state with initialData or defaults
  useEffect(() => {
    if (initialData) {
      setServiceDate(initialData.serviceDate || new Date().toISOString().split('T')[0]);
      setOdometer(initialData.odometer ? String(initialData.odometer) : '');
      setServiceCenter(initialData.serviceCenter || '');
      setNotes(initialData.notes || '');
      setTotalCost(initialData.totalCost !== undefined && initialData.totalCost !== null ? String(initialData.totalCost) : '');

      const base = {};
      if (initialData.components) {
        Object.entries(initialData.components).forEach(([key, data]) => {
          if (!data) return;
          base[key] = {
            done: Boolean(data.done),
            price: data.price !== undefined && data.price !== null ? data.price : '',
            name: data.name || '',
          };
        });
      }
      setComponentsState(base);
    } else {
      setServiceDate(new Date().toISOString().split('T')[0]);
      setOdometer(latestOdometer > 0 ? String(latestOdometer) : '');
      setServiceCenter('');
      setNotes('');
      setTotalCost('');
      setComponentsState({});
    }
    setError('');
    setSearchQuery('');
    setNewItemName('');
    setNewItemIsOil(false);
  }, [initialData, isOpen, latestOdometer]);

  const vehicleType = activeVehicle?.vehicleType || 'CAR';

  // The user's own items, plus any item referenced by this record that is no longer in the list
  const allItems = useMemo(() => {
    const list = sortServiceItems(serviceItems);
    const known = new Set(list.map(i => i.id));
    Object.entries(componentsState).forEach(([id, data]) => {
      if (data?.done && !known.has(id)) {
        list.push({ id, name: resolveItemName(id, serviceItems, data), category: '', isEngineOil: false, orphan: true });
      }
    });
    return list;
  }, [serviceItems, componentsState]);

  const visibleComponents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allItems;
    return allItems.filter(c =>
      c.name.toLowerCase().includes(q) || (c.category || '').toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  // Names used before (current items + past service records) for autocomplete
  const nameSuggestions = useMemo(() => getItemNameSuggestions(services, serviceItems), [services, serviceItems]);

  // Total sum of component-level charges
  const sumOfComponentPrices = useMemo(() => {
    return Object.values(componentsState).reduce((acc, item) => {
      if (item && item.done) {
        const p = parseFloat(item.price);
        return acc + (isNaN(p) ? 0 : p);
      }
      return acc;
    }, 0);
  }, [componentsState]);

  // Count of items marked 'Yes'
  const servicedCount = useMemo(() => {
    return Object.values(componentsState).filter(c => c && c.done).length;
  }, [componentsState]);

  if (!isOpen) return null;

  const handleToggleComponent = (compId, isDone) => {
    setComponentsState(prev => {
      const current = prev[compId] || { done: false, price: '' };
      return {
        ...prev,
        [compId]: {
          ...current,
          done: isDone,
          // Preserve price if toggled back to Yes, or leave as is
        }
      };
    });
  };

  const handlePriceChange = (compId, priceVal) => {
    setComponentsState(prev => {
      const current = prev[compId] || { done: false, price: '' };
      return {
        ...prev,
        [compId]: {
          ...current,
          price: priceVal,
        }
      };
    });
  };

  const handleAddItem = async () => {
    const name = newItemName.trim();
    if (!name || !onAddServiceItem) return;
    setIsAddingItem(true);
    try {
      const item = await onAddServiceItem({ name, isEngineOil: newItemIsOil });
      if (item) {
        setComponentsState(prev => ({ ...prev, [item.id]: { done: true, price: prev[item.id]?.price ?? '', name: item.name } }));
        setNewItemName('');
        setNewItemIsOil(false);
        setSearchQuery('');
      }
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleApplySumToTotal = () => {
    setTotalCost(String(sumOfComponentPrices));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!serviceDate) {
      setError('Please provide a valid service date.');
      return;
    }

    const parsedOdo = parseFloat(odometer);
    if (isNaN(parsedOdo) || parsedOdo < 0) {
      setError(`Please enter a valid non-negative odometer reading (${unit}).`);
      return;
    }

    const parsedTotal = parseFloat(totalCost);
    if (isNaN(parsedTotal) || parsedTotal < 0) {
      setError('Please insert the final total service cost.');
      return;
    }

    // Clean component data: convert prices to numbers
    // Items marked "Yes" store their charge and name (so history stays readable).
    // Items switched back to "No" are written as done:false — Firestore merge keeps old map keys.
    const cleanedComponents = {};
    Object.entries(componentsState).forEach(([id, data]) => {
      if (!data) return;
      if (data.done) {
        cleanedComponents[id] = {
          done: true,
          price: parseFloat(data.price) || 0,
          name: resolveItemName(id, serviceItems, data),
        };
      } else if (initialData?.components?.[id]) {
        cleanedComponents[id] = { done: false, price: 0 };
      }
    });

    const payload = {
      ...(initialData || {}),
      vehicleId: activeVehicle?.id,
      serviceDate,
      odometer: parsedOdo,
      serviceCenter: serviceCenter.trim() || null,
      notes: notes.trim() || null,
      totalCost: parsedTotal,
      components: cleanedComponents,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        role="dialog" aria-modal="true" className="modal-content service-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'rgba(82, 196, 26, 0.12)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--color-primary)' 
              }}
            >
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>
                {initialData ? 'Edit Service Record' : 'Log Vehicle Service'}
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Vehicle: <strong>{activeVehicle?.name || 'Selected Vehicle'}</strong> ({vehicleType})
              </div>
            </div>
          </div>
          <button className="btn-icon-only" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              background: 'rgba(245, 34, 45, 0.1)', 
              border: '1px solid rgba(245, 34, 45, 0.3)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              margin: '0 0 16px 0'
            }}
          >
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="modal-scroll-body">
          {/* General Service Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '14px', marginBottom: '18px' }}>
            <div className="form-group">
              <label className="form-label">
                <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Service Date *
              </label>
              <input 
                type="date"
                className="form-input"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Gauge size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Odometer Reading ({unit}) *
              </label>
              <input 
                type="number"
                step="any"
                min="0"
                className="form-input"
                placeholder={latestOdometer > 0 ? `e.g. ${latestOdometer}` : 'e.g. 15400'}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Building2 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Service Center / Workshop
              </label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Authorized Service Center"
                value={serviceCenter}
                onChange={(e) => setServiceCenter(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label className="form-label">
              <FileText size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Service Notes & Observations (Optional)
            </label>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g. 20,000 km general periodic service, brake inspection, oil replacement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Service Items Checklist & Charges Section (user-defined items) */}
          <div 
            style={{ 
              background: 'var(--bg-surface-elevated)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px', 
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px' 
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                Items Serviced & Charges
                <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                  {servicedCount} Serviced
                </span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Your own list of service items. Select <strong>Yes</strong> for each item done and enter its charge. Add new items below — they are saved for future services too.
              </p>
            </div>

            {/* Add a new item */}
            <div className="add-item-row">
              <ItemNameInput
                value={newItemName}
                onChange={setNewItemName}
                onEnter={handleAddItem}
                suggestions={nameSuggestions}
                placeholder="Type an item, e.g. Chain lubrication"
                ariaLabel="New service item name"
              />
              <label className="oil-flag" title="Use this item for engine-oil change reminders">
                <input type="checkbox" checked={newItemIsOil} onChange={(e) => setNewItemIsOil(e.target.checked)} />
                <Droplet size={13} aria-hidden="true" />
                <span>Engine oil</span>
              </label>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddItem}
                disabled={!newItemName.trim() || isAddingItem}
              >
                <Plus size={15} />
                <span>Add Item</span>
              </button>
            </div>

            {allItems.length > 6 && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }} />
                <input 
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                  placeholder="Search your items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {/* Items List */}
            <div 
              className="component-checklist-list"
              style={{ 
                maxHeight: '340px', 
                overflowY: 'auto', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)'
              }}
            >
              {allItems.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  <Wrench size={22} style={{ margin: '0 auto 8px auto', display: 'block', opacity: 0.6 }} />
                  No service items yet. Add the parts or jobs you get serviced (e.g. <em>Engine oil</em>, <em>Air filter</em>) using the box above.
                </div>
              ) : visibleComponents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No items match "{searchQuery}".
                </div>
              ) : (
                visibleComponents.map((comp) => {
                  const item = componentsState[comp.id] || { done: false, price: '' };
                  const isDone = item.done;

                  return (
                    <div 
                      key={comp.id}
                      className={`checklist-row ${isDone ? 'checklist-row-active' : ''}`}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isDone ? 'rgba(82, 196, 26, 0.05)' : 'transparent',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      {/* Name & Tags */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: isDone ? 700 : 500, fontSize: '0.9rem', color: isDone ? 'var(--color-primary)' : 'var(--text-main)' }}>
                          {comp.name}
                        </div>
                        {(isEngineOilItem(comp) || comp.category || comp.orphan) && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                            {isEngineOilItem(comp) && <span className="item-tag item-tag-oil">Engine oil reminder</span>}
                            {comp.category && <span className="item-tag">{comp.category}</span>}
                            {comp.orphan && <span className="item-tag">Removed from list</span>}
                          </div>
                        )}
                      </div>

                      {/* Yes / No Toggle Segment */}
                      <div className="yes-no-toggle" role="group" aria-label={`${comp.name} serviced?`}>
                        <button
                          type="button"
                          className={!isDone ? 'is-no' : ''}
                          aria-pressed={!isDone}
                          onClick={() => handleToggleComponent(comp.id, false)}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className={isDone ? 'is-yes' : ''}
                          aria-pressed={isDone}
                          onClick={() => handleToggleComponent(comp.id, true)}
                        >
                          Yes
                        </button>
                      </div>

                      {/* Individual Item Charge */}
                      <div style={{ position: 'relative' }}>
                        <span 
                          style={{ 
                            position: 'absolute', 
                            left: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            fontSize: '0.8rem', 
                            color: isDone ? 'var(--text-main)' : 'var(--text-dim)',
                            pointerEvents: 'none'
                          }}
                        >
                          {currency}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          disabled={!isDone}
                          placeholder={isDone ? 'Charge' : '—'}
                          value={isDone ? item.price : ''}
                          onChange={(e) => handlePriceChange(comp.id, e.target.value)}
                          className="form-input"
                          aria-label={`${comp.name} charge`}
                          style={{
                            paddingLeft: '24px',
                            paddingRight: '8px',
                            fontSize: '0.85rem',
                            textAlign: 'right',
                            opacity: isDone ? 1 : 0.45,
                            background: isDone ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                            borderColor: isDone ? 'var(--border-active)' : 'var(--border-subtle)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Final Total Bill Box - Inserted by user */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.08) 0%, rgba(250, 140, 22, 0.08) 100%)', 
              border: '1px solid var(--border-medium)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '2px' }}>
                  Total Servicing Cost / Final Bill ({currency}) *
                </label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Enter the final overall bill amount charged by the service center.
                </div>
              </div>

              {/* Sum helper link */}
              {sumOfComponentPrices > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={handleApplySumToTotal}
                  title="Copy sum of individual component charges into Total"
                >
                  <Calculator size={13} style={{ marginRight: '4px' }} />
                  Set to components sum ({currency}{sumOfComponentPrices.toLocaleString()})
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <span 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  color: 'var(--color-primary)' 
                }}
              >
                {currency}
              </span>
              <input 
                type="number"
                step="any"
                min="0"
                className="form-input"
                style={{ 
                  paddingLeft: '32px', 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  letterSpacing: '0.5px' 
                }}
                placeholder="0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontWeight: 700 }}
            >
              <Check size={16} />
              <span>{initialData ? 'Update Service Record' : 'Save Service Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
