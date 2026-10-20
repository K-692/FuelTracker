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
  FileText 
} from 'lucide-react';
import { 
  SERVICE_CATEGORIES, 
  getComponentsForVehicle, 
  getDefaultComponentsState 
} from '../domain/serviceComponents';

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  activeVehicle = null,
  currency = '₹',
  unit = 'km',
  latestOdometer = 0
}) {
  const [serviceDate, setServiceDate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [serviceCenter, setServiceCenter] = useState('');
  const [notes, setNotes] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [componentsState, setComponentsState] = useState(getDefaultComponentsState);
  
  const [forceAllComponents, setForceAllComponents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [error, setError] = useState('');

  // Synchronize modal state with initialData or defaults
  useEffect(() => {
    if (initialData) {
      setServiceDate(initialData.serviceDate || new Date().toISOString().split('T')[0]);
      setOdometer(initialData.odometer ? String(initialData.odometer) : '');
      setServiceCenter(initialData.serviceCenter || '');
      setNotes(initialData.notes || '');
      setTotalCost(initialData.totalCost !== undefined && initialData.totalCost !== null ? String(initialData.totalCost) : '');

      const base = getDefaultComponentsState();
      if (initialData.components) {
        Object.keys(initialData.components).forEach(key => {
          if (base[key]) {
            base[key] = {
              done: Boolean(initialData.components[key].done),
              price: initialData.components[key].price !== undefined && initialData.components[key].price !== null 
                ? initialData.components[key].price 
                : '',
            };
          }
        });
      }
      setComponentsState(base);
    } else {
      setServiceDate(new Date().toISOString().split('T')[0]);
      setOdometer(latestOdometer > 0 ? String(latestOdometer) : '');
      setServiceCenter('');
      setNotes('');
      setTotalCost('');
      setComponentsState(getDefaultComponentsState());
    }
    setError('');
    setSearchQuery('');
    setSelectedCategory('ALL');
  }, [initialData, isOpen, latestOdometer]);

  const vehicleType = activeVehicle?.vehicleType || 'CAR';

  // Visible components filtered by vehicle type and filters
  const visibleComponents = useMemo(() => {
    let list = getComponentsForVehicle(vehicleType, forceAllComponents);

    if (selectedCategory !== 'ALL') {
      list = list.filter(c => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.vehicleLabel.toLowerCase().includes(q) ||
        String(c.number).includes(q)
      );
    }

    return list;
  }, [vehicleType, forceAllComponents, selectedCategory, searchQuery]);

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
    const cleanedComponents = {};
    Object.entries(componentsState).forEach(([id, data]) => {
      cleanedComponents[id] = {
        done: Boolean(data.done),
        price: data.done ? (parseFloat(data.price) || 0) : 0,
      };
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
        className="modal-content service-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
              margin: '0 24px 16px 24px'
            }}
          >
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '0 24px 20px 24px', flex: 1 }}>
          {/* General Service Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '18px' }}>
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

          {/* Component Checklist & Charges Section */}
          <div 
            style={{ 
              background: 'var(--bg-surface-elevated)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px', 
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Component Maintenance Checklist & Charges
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {servicedCount} Serviced
                  </span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Default is <strong>No</strong>. Select <strong>Yes</strong> if serviced and enter the individual charge.
                </p>
              </div>

              {/* Show All vs Type-specific Toggle */}
              {(vehicleType === 'BIKE' || vehicleType === 'SCOOTER') && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                  onClick={() => setForceAllComponents(prev => !prev)}
                >
                  {forceAllComponents ? 'Showing All 60 (Click to filter for 2-wheeler)' : 'Filter: Two-wheeler (Click to show all 60)'}
                </button>
              )}
            </div>

            {/* Filter / Search Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input 
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', fontSize: '0.85rem', padding: '7px 10px 7px 32px' }}
                  placeholder="Search component (e.g. Engine oil, Brake pads, Coolant)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '160px', fontSize: '0.85rem', padding: '7px 10px' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {Object.values(SERVICE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Components List Container */}
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
              {visibleComponents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No components matched your search filter.
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
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 1fr) auto 130px',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '9px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isDone ? 'rgba(82, 196, 26, 0.05)' : 'transparent',
                        transition: 'background var(--transition-fast)'
                      }}
                    >
                      {/* Name & Badge */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700, minWidth: '18px' }}>
                            #{comp.number}
                          </span>
                          <span style={{ fontWeight: isDone ? 700 : 500, fontSize: '0.88rem', color: isDone ? 'var(--color-primary)' : 'var(--text-main)' }}>
                            {comp.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px', marginLeft: '26px' }}>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--text-dim)', 
                              background: 'var(--bg-surface-elevated)', 
                              padding: '1px 5px', 
                              borderRadius: '4px' 
                            }}
                          >
                            {comp.vehicleLabel}
                          </span>
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--text-dim)', 
                              background: 'var(--bg-surface-elevated)', 
                              padding: '1px 5px', 
                              borderRadius: '4px' 
                            }}
                          >
                            {comp.category}
                          </span>
                        </div>
                      </div>

                      {/* Yes / No Toggle Segment */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          background: 'var(--bg-surface-elevated)', 
                          borderRadius: 'var(--radius-sm)', 
                          padding: '2px',
                          border: '1px solid var(--border-subtle)' 
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleComponent(comp.id, false)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: !isDone ? 700 : 500,
                            borderRadius: '5px',
                            background: !isDone ? 'var(--text-dim)' : 'transparent',
                            color: !isDone ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleComponent(comp.id, true)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: isDone ? 700 : 500,
                            borderRadius: '5px',
                            background: isDone ? 'var(--color-primary)' : 'transparent',
                            color: isDone ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Yes
                        </button>
                      </div>

                      {/* Individual Component Price / Charge */}
                      <div style={{ position: 'relative' }}>
                        <span 
                          style={{ 
                            position: 'absolute', 
                            left: '8px', 
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
                          step="any"
                          min="0"
                          disabled={!isDone}
                          placeholder={isDone ? 'Charge' : '—'}
                          value={isDone ? item.price : ''}
                          onChange={(e) => handlePriceChange(comp.id, e.target.value)}
                          className="form-input"
                          style={{
                            paddingLeft: '22px',
                            paddingRight: '6px',
                            paddingTop: '5px',
                            paddingBottom: '5px',
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
