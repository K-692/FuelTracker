import React from 'react';
import { 
  Plus, 
  Car, 
  Trash2, 
  Edit3, 
  CheckCircle 
} from 'lucide-react';
import { FuelCalculator } from '../domain/FuelCalculator';

export function Garage({ 
  vehicles = [], 
  activeVehicleId, 
  onSelectVehicle, 
  entries = [], 
  onOpenAddVehicle, 
  onEditVehicle, 
  onDeleteVehicle,
  currency = '₹',
  unit = 'km'
}) {
  const getVehicleIcon = (type) => {
    switch (type) {
      case 'BIKE': return '🏍️';
      case 'SCOOTER': return '🛵';
      case 'CAR': return '🚗';
      default: return '🚙';
    }
  };

  return (
    <div className="garage-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Vehicle Garage
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage your fleet profiles. Select an active vehicle to isolate tracking timelines.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddVehicle}>
          <Plus size={18} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Grid of Vehicles */}
      {vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <Car size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Your Garage is Empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Add your first vehicle to start tracking fuel efficiency.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddVehicle}>
            <Plus size={16} />
            <span>Create Vehicle Profile</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {vehicles.map(v => {
            const vEntries = entries.filter(e => e.vehicleId === v.id);
            const stats = FuelCalculator.calculateStatistics(vEntries);
            const isActive = v.id === activeVehicleId;

            return (
              <div 
                key={v.id} 
                className={`card ${isActive ? 'card-active' : 'card-interactive'}`}
                style={{ 
                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px'
                }}
              >
                {/* Card Top */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: 'var(--radius-md)', 
                          background: isActive ? 'var(--color-primary-glow)' : 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-medium)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '1.6rem'
                        }}
                      >
                        {getVehicleIcon(v.vehicleType)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{v.name}</h3>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {v.manufacturer} {v.model} {v.year ? `(${v.year})` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => onEditVehicle(v)}
                        title="Edit Vehicle"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-icon-only" 
                        onClick={() => onDeleteVehicle(v)}
                        title="Delete Vehicle"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {v.registrationNumber && (
                    <div style={{ marginBottom: '16px' }}>
                      <span 
                        style={{ 
                          display: 'inline-block', 
                          padding: '3px 10px', 
                          borderRadius: 'var(--radius-sm)', 
                          background: 'var(--bg-surface-elevated)', 
                          border: '1px solid var(--border-medium)', 
                          fontSize: '0.8rem', 
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          letterSpacing: '0.05em'
                        }}
                      >
                        {v.registrationNumber}
                      </span>
                    </div>
                  )}

                  {/* Summary Metrics */}
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '8px', 
                      padding: '12px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      textAlign: 'center'
                    }}
                  >
                    <div>
                      <div className="calc-stat-label">Avg Mileage</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {stats.averageMileage > 0 ? `${stats.averageMileage}` : '--'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{unit}/L</div>
                    </div>

                    <div>
                      <div className="calc-stat-label">Refills</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {vEntries.length}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>entries</div>
                    </div>

                    <div>
                      <div className="calc-stat-label">Spent</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {currency}{stats.totalSpending.toFixed(0)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>total</div>
                    </div>
                  </div>
                </div>

                {/* Card Action: Select Active */}
                <div>
                  {isActive ? (
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        color: 'var(--color-primary)', 
                        fontWeight: 700, 
                        fontSize: '0.88rem',
                        padding: '8px 0'
                      }}
                    >
                      <CheckCircle size={16} />
                      <span>Active Fleet Machine</span>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-secondary" 
                      style={{ width: '100%', fontSize: '0.88rem' }}
                      onClick={() => onSelectVehicle(v.id)}
                    >
                      Set as Active Vehicle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
