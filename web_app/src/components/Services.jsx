import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Gauge, 
  Building2, 
  DollarSign, 
  Search, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Car
} from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';
import { ServiceCalculator } from '../domain/serviceCalculator';
import { SERVICE_COMPONENTS } from '../domain/serviceComponents';

export function Services({
  vehicles = [],
  activeVehicleId,
  onSelectVehicle,
  services = [],
  fuelEntries = [],
  onOpenAddService,
  onEditService,
  onDeleteService,
  onOpenAddVehicle,
  currency = '₹',
  unit = 'km',
  engineOilInterval = 5000,
  engineOilMonthsInterval = 6
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const vehicleServices = useMemo(() => {
    return (services || [])
      .filter(s => s.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }, [services, activeVehicleId]);

  const vehicleFuelEntries = useMemo(() => {
    return (fuelEntries || []).filter(e => e.vehicleId === activeVehicleId);
  }, [fuelEntries, activeVehicleId]);

  // Engine oil status for this vehicle (Dual threshold: Distance & Months)
  const oilStatus = useMemo(() => {
    return ServiceCalculator.calculateEngineOilStatus(
      vehicleServices,
      vehicleFuelEntries,
      engineOilInterval,
      engineOilMonthsInterval
    );
  }, [vehicleServices, vehicleFuelEntries, engineOilInterval, engineOilMonthsInterval]);

  // Filtered services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return vehicleServices;
    const q = searchQuery.toLowerCase().trim();

    return vehicleServices.filter(s => {
      const matchCenter = s.serviceCenter?.toLowerCase().includes(q);
      const matchNotes = s.notes?.toLowerCase().includes(q);
      const matchDate = s.serviceDate?.toLowerCase().includes(q);
      const matchOdo = String(s.odometer).includes(q);
      
      // Check if any serviced component matches query
      const matchComp = s.components && Object.entries(s.components).some(([compId, data]) => {
        if (!data || !data.done) return false;
        const compDef = SERVICE_COMPONENTS.find(c => c.id === compId);
        return compDef && compDef.name.toLowerCase().includes(q);
      });

      return matchCenter || matchNotes || matchDate || matchOdo || matchComp;
    });
  }, [vehicleServices, searchQuery]);

  // Total maintenance expenditure for this vehicle
  const lifetimeMetrics = useMemo(() => {
    return ServiceCalculator.calculateLifetimeServiceMetrics(vehicleServices);
  }, [vehicleServices]);

  const toggleExpand = (id) => {
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  if (vehicles.length === 0) {
    return (
      <div className="services-container">
        <div className="dashboard-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
              Vehicle Maintenance & Services
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Track periodic servicing, component health, individual replacement charges, and engine oil reminders.
            </p>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Car size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px auto', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No Vehicle Profiles Configured</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Please add your first vehicle profile in the Garage to start tracking servicing and maintenance telemetry.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddVehicle}>
            <Plus size={16} />
            <span>Add Vehicle in Garage</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="services-container">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Vehicle Maintenance & Services
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Component-level tracking, historical maintenance charges, and engine oil interval telemetry for{' '}
            <strong style={{ color: 'var(--text-main)' }}>{activeVehicle?.name}</strong>.
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={onOpenAddService}
          style={{ padding: '9px 18px', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Log Service</span>
        </button>
      </div>

      {/* Vehicle Selector Ribbon */}
      <div className="vehicle-selector-bar" style={{ marginBottom: '22px' }}>
        {vehicles.map(v => (
          <button
            key={v.id}
            className={`vehicle-pill ${v.id === activeVehicleId ? 'active' : ''}`}
            onClick={() => onSelectVehicle(v.id)}
          >
            <span>{v.name}</span>
          </button>
        ))}
      </div>

      {/* Engine Oil Alert & Dual Telemetry Banner */}
      <div 
        className="card"
        style={{
          marginBottom: '24px',
          borderLeft: `4px solid ${
            oilStatus.status === 'overdue' 
              ? 'var(--color-danger)' 
              : oilStatus.status === 'warning' 
              ? 'var(--color-orange)' 
              : 'var(--color-primary)'
          }`,
          background: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: oilStatus.status === 'overdue'
                  ? 'rgba(245, 34, 45, 0.12)'
                  : oilStatus.status === 'warning'
                  ? 'rgba(250, 140, 22, 0.12)'
                  : 'rgba(82, 196, 26, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: oilStatus.status === 'overdue'
                  ? 'var(--color-danger)'
                  : oilStatus.status === 'warning'
                  ? 'var(--color-orange)'
                  : 'var(--color-primary)'
              }}
            >
              {oilStatus.status === 'overdue' ? (
                <AlertTriangle size={24} />
              ) : oilStatus.status === 'warning' ? (
                <Clock size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  Engine Oil Replacement Telemetry
                </h3>
                <span 
                  className={`badge ${
                    oilStatus.status === 'overdue' 
                      ? 'badge-danger' 
                      : oilStatus.status === 'warning' 
                      ? 'badge-amber' 
                      : 'badge-primary'
                  }`}
                  style={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}
                >
                  {oilStatus.status === 'overdue' 
                    ? (oilStatus.primaryTrigger === 'both'
                        ? `Overdue: Distance & Time Exceeded`
                        : oilStatus.primaryTrigger === 'time'
                        ? `Overdue: Time Exceeded (${Math.abs(oilStatus.remainingDays)} days past)`
                        : `Overdue by ${Math.abs(oilStatus.remainingKm).toLocaleString()} ${unit}`)
                    : oilStatus.status === 'warning' 
                    ? (oilStatus.primaryTrigger === 'both'
                        ? `Due Soon: Distance & Time (${oilStatus.remainingKm.toLocaleString()} ${unit} • ${oilStatus.remainingDays}d)`
                        : oilStatus.primaryTrigger === 'time'
                        ? `Due Soon: ${oilStatus.remainingDays} days left`
                        : `Due Soon: ${oilStatus.remainingKm.toLocaleString()} ${unit} left`)
                    : oilStatus.status === 'no_service_recorded'
                    ? `Interval: ${oilStatus.intervalKm.toLocaleString()} ${unit} / ${oilStatus.intervalMonths} mos`
                    : `Good: ${oilStatus.remainingKm.toLocaleString()} ${unit} • ${oilStatus.remainingMonths} mos left`}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {oilStatus.hasHistory ? (
                  <>
                    Last changed at <strong>{oilStatus.lastOilOdometer.toLocaleString()} {unit}</strong> on{' '}
                    <strong>{formatDate(oilStatus.lastOilDate)}</strong>. Driven{' '}
                    <strong>{oilStatus.distanceDriven.toLocaleString()} {unit}</strong> over{' '}
                    <strong>{oilStatus.daysElapsed} days</strong> (~{oilStatus.monthsElapsed} mos) since last oil replacement.
                  </>
                ) : (
                  <>
                    No previous oil change recorded yet for this vehicle. Current odometer: <strong>{oilStatus.currentOdometer.toLocaleString()} {unit}</strong>.
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Service Target (Whichever first)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {oilStatus.nextDueOdometer.toLocaleString()} {unit}
            </div>
            {oilStatus.nextDueDate && (
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Due by: {formatDate(oilStatus.nextDueDate)}
              </div>
            )}
          </div>
        </div>

        {/* Dual Telemetry Progress Gauges: Distance & Time Duration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          {/* 1. Distance Telemetry Gauge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>
                Distance Progress: {oilStatus.distanceDriven.toLocaleString()} / {oilStatus.intervalKm.toLocaleString()} {unit}
              </span>
              <span style={{ 
                fontWeight: 700, 
                color: oilStatus.isKmOverdue ? 'var(--color-danger)' : oilStatus.isKmWarning ? 'var(--color-orange)' : 'var(--text-muted)' 
              }}>
                {oilStatus.remainingKm > 0 
                  ? `${oilStatus.remainingKm.toLocaleString()} ${unit} left` 
                  : `Exceeded by ${Math.abs(oilStatus.remainingKm).toLocaleString()} ${unit}`} ({Math.round(oilStatus.percentKmElapsed)}%)
              </span>
            </div>
            <div 
              style={{ 
                width: '100%', 
                height: '7px', 
                background: 'var(--bg-surface-elevated)', 
                borderRadius: '999px', 
                overflow: 'hidden' 
              }}
            >
              <div 
                style={{
                  width: `${Math.min(100, Math.max(0, oilStatus.percentKmElapsed))}%`,
                  height: '100%',
                  background: oilStatus.isKmOverdue
                    ? 'var(--color-danger)'
                    : oilStatus.isKmWarning
                    ? 'var(--color-orange)'
                    : 'var(--color-primary)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* 2. Duration Telemetry Gauge */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>
                Duration Progress: {oilStatus.daysElapsed} / {oilStatus.totalIntervalDays || (oilStatus.intervalMonths * 30)} days ({oilStatus.intervalMonths} months)
              </span>
              <span style={{ 
                fontWeight: 700, 
                color: oilStatus.isTimeOverdue ? 'var(--color-danger)' : oilStatus.isTimeWarning ? 'var(--color-orange)' : 'var(--text-muted)' 
              }}>
                {oilStatus.remainingDays !== null 
                  ? (oilStatus.remainingDays > 0 
                      ? `${oilStatus.remainingDays} days (~${oilStatus.remainingMonths} mos) left` 
                      : `Exceeded by ${Math.abs(oilStatus.remainingDays)} days`)
                  : '--'} ({Math.round(oilStatus.percentTimeElapsed)}%)
              </span>
            </div>
            <div 
              style={{ 
                width: '100%', 
                height: '7px', 
                background: 'var(--bg-surface-elevated)', 
                borderRadius: '999px', 
                overflow: 'hidden' 
              }}
            >
              <div 
                style={{
                  width: `${Math.min(100, Math.max(0, oilStatus.percentTimeElapsed))}%`,
                  height: '100%',
                  background: oilStatus.isTimeOverdue
                    ? 'var(--color-danger)'
                    : oilStatus.isTimeWarning
                    ? 'var(--color-orange)'
                    : 'var(--color-primary)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ℹ️</span>
            <span>Automotive Dual-Trigger Rule: Engine oil is prompted when either <strong>{oilStatus.intervalKm.toLocaleString()} {unit}</strong> or <strong>{oilStatus.intervalMonths} months</strong> is reached from the last oil change.</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Services Logged</span>
            <Wrench size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-value">{lifetimeMetrics.totalServices}</div>
          <div className="stat-subtext">Total maintenance records</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Maintenance Cost</span>
            <DollarSign size={18} color="var(--color-orange)" />
          </div>
          <div className="stat-value">
            {currency}{lifetimeMetrics.totalCost.toLocaleString()}
          </div>
          <div className="stat-subtext">Lifetime workshop expenditure</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average Service Bill</span>
            <Gauge size={18} color="var(--color-yellow)" />
          </div>
          <div className="stat-value">
            {currency}{lifetimeMetrics.averageCost.toLocaleString()}
          </div>
          <div className="stat-subtext">Per maintenance visit</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Oil Service Interval</span>
            <Clock size={18} color="var(--color-primary)" />
          </div>
          <div className="stat-value">
            {engineOilInterval.toLocaleString()} {unit} / {engineOilMonthsInterval}m
          </div>
          <div className="stat-subtext">Dual-threshold • Settings</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '400px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
            placeholder="Search by notes, center, component (e.g. Brake, Oil)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredServices.length} of {vehicleServices.length} service records
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <Wrench size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
            {searchQuery ? 'No matching service records' : 'No service records logged yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 18px auto', fontSize: '0.88rem' }}>
            {searchQuery 
              ? 'Try modifying your search term or clear the filter.' 
              : 'Record periodic services, parts replacements, and workshop bills to keep your maintenance history organized.'}
          </p>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={onOpenAddService}>
              <Plus size={16} />
              <span>Log First Service</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredServices.map(service => {
            const isExpanded = expandedCardId === service.id;

            // Extract serviced components
            const servicedComponentsList = [];
            if (service.components) {
              Object.entries(service.components).forEach(([id, data]) => {
                if (data && data.done) {
                  const def = SERVICE_COMPONENTS.find(c => c.id === id);
                  servicedComponentsList.push({
                    id,
                    name: def ? def.name : id,
                    price: Number(data.price) || 0,
                    label: def?.vehicleLabel || 'Both',
                    category: def?.category || 'General',
                  });
                }
              });
            }

            return (
              <div 
                key={service.id} 
                className="card"
                style={{ 
                  padding: '20px', 
                  transition: 'border-color var(--transition-fast)',
                  borderColor: isExpanded ? 'var(--border-active)' : 'var(--border-subtle)'
                }}
              >
                {/* Top Summary Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                        {formatDate(service.serviceDate)}
                      </span>
                      <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        <Gauge size={11} style={{ marginRight: '3px' }} />
                        {Number(service.odometer).toLocaleString()} {unit}
                      </span>
                      {service.serviceCenter && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          • <Building2 size={12} /> {service.serviceCenter}
                        </span>
                      )}
                    </div>

                    {service.notes && (
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {service.notes}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Total Bill
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {currency}{Number(service.totalCost).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => onEditService(service)}
                        title="Edit Service Record"
                        aria-label="Edit Service Record"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-icon-only text-danger" 
                        onClick={() => onDeleteService(service.id)}
                        title="Delete Service Record"
                        aria-label="Delete Service Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Serviced Components Chips Preview */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Serviced Components ({servicedComponentsList.length}):
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.78rem', padding: '3px 8px', color: 'var(--color-primary)' }}
                      onClick={() => toggleExpand(service.id)}
                    >
                      {isExpanded ? (
                        <>Hide Complete Checklist <ChevronUp size={13} style={{ marginLeft: '3px' }} /></>
                      ) : (
                        <>View Full 60-Item Checklist <ChevronDown size={13} style={{ marginLeft: '3px' }} /></>
                      )}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {servicedComponentsList.length === 0 ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No specific components tagged as replaced or serviced.
                      </span>
                    ) : (
                      servicedComponentsList.map(item => (
                        <span 
                          key={item.id}
                          style={{
                            fontSize: '0.78rem',
                            padding: '3px 9px',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          {item.price > 0 && (
                            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                              ({currency}{item.price.toLocaleString()})
                            </span>
                          )}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Collapsible Complete 60-Item Checklist Drawer */}
                {isExpanded && (
                  <div 
                    style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px dashed var(--border-medium)',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px' }}>
                      Detailed 60-Component Status Breakdown
                    </div>

                    <div 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                        gap: '8px',
                        maxHeight: '360px',
                        overflowY: 'auto',
                        paddingRight: '6px'
                      }}
                    >
                      {SERVICE_COMPONENTS.map(comp => {
                        const itemData = service.components?.[comp.id];
                        const isDone = itemData && itemData.done;
                        const price = Number(itemData?.price) || 0;

                        return (
                          <div
                            key={comp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              background: isDone ? 'rgba(82, 196, 26, 0.08)' : 'var(--bg-surface)',
                              border: `1px solid ${isDone ? 'var(--color-primary-glow)' : 'var(--border-subtle)'}`,
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', minWidth: '18px' }}>
                                #{comp.number}
                              </span>
                              <span style={{ fontWeight: isDone ? 700 : 400, color: isDone ? 'var(--color-primary)' : 'var(--text-main)' }}>
                                {comp.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span 
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: isDone ? 'var(--color-primary)' : 'var(--text-dim)'
                                }}
                              >
                                {isDone ? 'YES' : 'NO'}
                              </span>
                              {isDone && price > 0 && (
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                  {currency}{price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
