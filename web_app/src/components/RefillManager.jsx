import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Calendar, 
  Fuel, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { FuelCalculator } from '../domain/FuelCalculator';
import { formatDate } from '../utils/dateFormatter';

export function RefillManager({ 
  vehicles = [], 
  activeVehicleId, 
  onSelectVehicle, 
  entries = [], 
  onOpenAddRefill, 
  onEditRefill, 
  onDeleteRefill,
  currency = '₹',
  unit = 'km'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('ALL');

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const vehicleEntries = entries.filter(e => e.vehicleId === activeVehicleId);
  const enrichedEntries = FuelCalculator.enrichEntries(vehicleEntries);

  // Filter entries
  const filteredEntries = enrichedEntries.filter(entry => {
    const formattedDate = formatDate(entry.refillDate).toLowerCase();
    const matchesSearch = 
      (entry.notes && entry.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.fuelTypeName && entry.fuelTypeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(entry.odometer).includes(searchTerm) ||
      formattedDate.includes(searchTerm.toLowerCase());

    const matchesFuelType = selectedFuelType === 'ALL' || entry.fuelTypeName === selectedFuelType;

    return matchesSearch && matchesFuelType;
  });

  const fuelTypeOptions = Array.from(new Set(vehicleEntries.map(e => e.fuelTypeName).filter(Boolean)));

  return (
    <div className="refill-manager-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '2px' }}>
            Fuel Refill History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Vehicle: <strong style={{ color: 'var(--text-main)' }}>{activeVehicle?.name}</strong> • {vehicleEntries.length} total entries recorded
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddRefill}>
          <Plus size={16} />
          <span>Add Refill</span>
        </button>
      </div>

      {/* Vehicle Selector Pills */}
      <div className="vehicle-selector-bar" style={{ marginBottom: '18px' }}>
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

      {/* Filter and Search Bar */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '20px', 
          padding: '14px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input 
            type="text" 
            placeholder="Search date (DD/Apr/YYYY), notes, or odometer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ padding: '7px 11px', fontSize: '0.88rem' }}
          />
        </div>

        {fuelTypeOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-dim)" />
            <select
              value={selectedFuelType}
              onChange={(e) => setSelectedFuelType(e.target.value)}
              className="form-select"
              style={{ padding: '7px 11px', fontSize: '0.88rem' }}
            >
              <option value="ALL">All Fuel Types</option>
              {fuelTypeOptions.map(ft => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '44px 20px' }}>
          <AlertCircle size={36} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>No Matching Refills</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
            {vehicleEntries.length === 0 
              ? 'This vehicle has no recorded fuel refills yet.' 
              : 'Try clearing your search query or changing filters.'}
          </p>
          <button className="btn btn-primary" onClick={onOpenAddRefill}>
            <Plus size={15} />
            <span>Record Fuel Fill</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredEntries.map(entry => (
            <div 
              key={entry.id} 
              className="card card-interactive"
              style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--color-primary-glow)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--color-green)'
                    }}
                  >
                    <Fuel size={19} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                        {entry.odometer} {unit}
                      </span>
                      {entry.tripDistance && (
                        <span className="badge badge-primary">
                          +{entry.tripDistance} {unit}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Calendar size={12} />
                      <strong style={{ color: 'var(--text-main)' }}>{formatDate(entry.refillDate)}</strong>
                      <span>•</span>
                      <span>{entry.fuelTypeName || 'Regular Petrol'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Mileage Badge */}
                  {entry.calculatedMileage ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-green)' }}>
                        {entry.calculatedMileage.toFixed(2)} <span style={{ fontSize: '0.82rem' }}>{unit}/L</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        Using {entry.previousFuelUsed} L prior fill
                      </div>
                    </div>
                  ) : (
                    <span className="badge badge-amber" title="First fill establishes baseline odometer">
                      Baseline Refill
                    </span>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn-icon-only" 
                      onClick={() => onEditRefill(entry)}
                      title="Edit Refill"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      className="btn-icon-only" 
                      onClick={() => onDeleteRefill(entry.id)}
                      title="Delete Refill"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Breakdown Row */}
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <div className="calc-stat-label">Volume</div>
                  <div style={{ fontWeight: 700 }}>{entry.fuelAmount} L</div>
                </div>
                <div>
                  <div className="calc-stat-label">Total Cost</div>
                  <div style={{ fontWeight: 700 }}>{currency}{entry.totalCost}</div>
                </div>
                <div>
                  <div className="calc-stat-label">Price / Liter</div>
                  <div style={{ fontWeight: 700 }}>{currency}{entry.pricePerLiter?.toFixed(2)}</div>
                </div>
                {entry.costPerUnitDistance && (
                  <div>
                    <div className="calc-stat-label">Cost / {unit}</div>
                    <div style={{ fontWeight: 700 }}>{currency}{entry.costPerUnitDistance.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {entry.notes && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={13} color="var(--text-dim)" />
                  <span>{entry.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
