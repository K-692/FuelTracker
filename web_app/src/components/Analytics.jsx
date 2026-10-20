import React, { useState, useMemo } from 'react';
import { 
  Gauge, 
  DollarSign, 
  Fuel, 
  Award, 
  AlertCircle,
  Wrench,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { FuelCalculator } from '../domain/FuelCalculator';
import { ServiceCalculator } from '../domain/serviceCalculator';
import { SERVICE_COMPONENTS } from '../domain/serviceComponents';
import { LineChart, BarChart, HorizontalBarChart } from './Charts';

export function Analytics({ 
  vehicles = [], 
  activeVehicleId, 
  onSelectVehicle, 
  entries = [],
  services = [],
  currency = '₹',
  unit = 'km'
}) {
  const [analyticsView, setAnalyticsView] = useState('fuel'); // 'fuel' | 'services'
  const [timeFilter, setTimeFilter] = useState('ALL'); // '30D', '90D', '1Y', 'ALL'
  const [selectedComponentId, setSelectedComponentId] = useState('engine_oil');

  const activeVehicle = vehicles.find(v => v.id === activeVehicleId) || vehicles[0];
  const vehicleEntries = useMemo(() => {
    return (entries || []).filter(e => e.vehicleId === activeVehicleId);
  }, [entries, activeVehicleId]);

  const vehicleServices = useMemo(() => {
    return (services || [])
      .filter(s => s.vehicleId === activeVehicleId)
      .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime());
  }, [services, activeVehicleId]);

  // Time filter logic for fuel entries
  const now = Date.now();
  const filteredEntries = useMemo(() => {
    return vehicleEntries.filter(e => {
      if (timeFilter === 'ALL') return true;
      const entryDate = new Date(e.refillDate).getTime();
      if (timeFilter === '30D') return (now - entryDate) <= 30 * 86400000;
      if (timeFilter === '90D') return (now - entryDate) <= 90 * 86400000;
      if (timeFilter === '1Y') return (now - entryDate) <= 365 * 86400000;
      return true;
    });
  }, [vehicleEntries, timeFilter, now]);

  const stats = useMemo(() => {
    return FuelCalculator.calculateStatistics(filteredEntries);
  }, [filteredEntries]);

  // Component frequency analytics for services
  const componentFrequencies = useMemo(() => {
    return ServiceCalculator.calculateComponentFrequency(vehicleServices);
  }, [vehicleServices]);

  // Set default selected component to first serviced component if 'engine_oil' is not serviced
  const activeSelectedComponentId = useMemo(() => {
    if (componentFrequencies.some(c => c.id === selectedComponentId)) {
      return selectedComponentId;
    }
    return componentFrequencies[0]?.id || 'engine_oil';
  }, [componentFrequencies, selectedComponentId]);

  // Component price trajectory analytics for active selected component
  const componentPriceTrajectory = useMemo(() => {
    return ServiceCalculator.calculateComponentPriceTrajectory(vehicleServices, activeSelectedComponentId);
  }, [vehicleServices, activeSelectedComponentId]);

  // Lifetime service metrics
  const serviceMetrics = useMemo(() => {
    return ServiceCalculator.calculateLifetimeServiceMetrics(vehicleServices);
  }, [vehicleServices]);

  // Formatted data for HorizontalBarChart
  const componentCountChartData = useMemo(() => {
    return componentFrequencies.map(c => ({
      id: c.id,
      label: c.name,
      value: c.count,
      subText: `${currency}${c.totalSpend.toLocaleString()}`,
    }));
  }, [componentFrequencies, currency]);

  // Active component definition
  const activeComponentDef = useMemo(() => {
    return SERVICE_COMPONENTS.find(c => c.id === activeSelectedComponentId) || { name: activeSelectedComponentId };
  }, [activeSelectedComponentId]);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '18px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Vehicle Telemetry & Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Comprehensive analytics for <strong style={{ color: 'var(--text-main)' }}>{activeVehicle?.name}</strong>
          </p>
        </div>

        {/* View Switcher: Fuel vs Services */}
        <div 
          style={{ 
            display: 'flex', 
            background: 'var(--bg-surface-elevated)', 
            padding: '4px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-subtle)',
            gap: '4px'
          }}
        >
          <button
            className={`btn ${analyticsView === 'fuel' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.84rem', 
              borderRadius: 'var(--radius-sm)',
              fontWeight: analyticsView === 'fuel' ? 700 : 500
            }}
            onClick={() => setAnalyticsView('fuel')}
          >
            <Fuel size={14} style={{ marginRight: '5px' }} />
            <span>Fuel & Efficiency</span>
          </button>
          <button
            className={`btn ${analyticsView === 'services' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ 
              padding: '6px 14px', 
              fontSize: '0.84rem', 
              borderRadius: 'var(--radius-sm)',
              fontWeight: analyticsView === 'services' ? 700 : 500
            }}
            onClick={() => setAnalyticsView('services')}
          >
            <Wrench size={14} style={{ marginRight: '5px' }} />
            <span>Servicing & Maintenance</span>
          </button>
        </div>
      </div>

      {/* Vehicle Selector Pills */}
      <div className="vehicle-selector-bar" style={{ marginBottom: '24px' }}>
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

      {/* VIEW 1: FUEL & EFFICIENCY ANALYTICS */}
      {analyticsView === 'fuel' && (
        <>
          {/* Time Period Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {['ALL', '1Y', '90D', '30D'].map(period => (
                <button
                  key={period}
                  className={`btn btn-ghost ${timeFilter === period ? 'active' : ''}`}
                  style={{ 
                    padding: '5px 12px', 
                    fontSize: '0.8rem', 
                    borderRadius: 'var(--radius-sm)',
                    background: timeFilter === period ? 'var(--color-primary)' : 'transparent',
                    color: timeFilter === period ? '#ffffff' : 'var(--text-muted)'
                  }}
                  onClick={() => setTimeFilter(period)}
                >
                  {period === 'ALL' ? 'All Time' : period}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length < 2 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', marginBottom: '24px' }}>
              <AlertCircle size={40} color="var(--color-accent-fuel)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Insufficient Data for Fuel Analytics</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
                Mileage calculation requires at least two consecutive fill-ups to evaluate the distance traveled against the previous refill's fuel volume.
              </p>
            </div>
          ) : (
            <>
              {/* High-Level Benchmark Cards */}
              <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Average Mileage</span>
                    <div className="stat-icon" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                      <Gauge size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                    {stats.averageMileage} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{unit}/L</span>
                  </div>
                  <div className="stat-subtext">True lifetime average efficiency</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Best Mileage Record</span>
                    <div className="stat-icon" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>
                      <Award size={18} />
                    </div>
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                    {stats.highestMileage > 0 ? stats.highestMileage : '--'} 
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> {unit}/L</span>
                  </div>
                  <div className="stat-subtext">Peak economy trip logged</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Operating Cost</span>
                    <div className="stat-icon" style={{ background: 'var(--color-orange-glow)', color: 'var(--color-orange)' }}>
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {currency}{stats.averageCostPerKm} 
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> /{unit}</span>
                  </div>
                  <div className="stat-subtext">Net cost to travel 1 {unit}</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Avg Fuel Price</span>
                    <div className="stat-icon" style={{ background: 'rgba(250, 219, 20, 0.15)', color: 'var(--color-yellow)' }}>
                      <Fuel size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {currency}{stats.averageFuelPrice.toFixed(1)} 
                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> /L</span>
                  </div>
                  <div className="stat-subtext">Weighted pump price per liter</div>
                </div>
              </div>

              {/* Chart 1: True Mileage Trend Line */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Mileage Trajectory Curve ({unit}/L)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Each data point evaluates distance traveled divided by the fuel filled in the preceding refill.
                    </p>
                  </div>
                  <span className="badge badge-primary">Previous Fill Formulation</span>
                </div>

                <LineChart 
                  data={stats.mileageHistory}
                  valueKey="mileage"
                  labelKey="date"
                  color="#52c41a"
                  unit={`${unit}/L`}
                  average={stats.averageMileage}
                  height={260}
                />
              </div>

              {/* Chart 2: Fuel Expenditure per Refill */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card">
                  <div style={{ marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Refill Expenditure ({currency})</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Total cost paid per fuel purchase.
                    </p>
                  </div>

                  <BarChart 
                    data={stats.costHistory}
                    valueKey="cost"
                    labelKey="date"
                    color="#fa8c16"
                    currency={currency}
                    height={220}
                  />
                </div>

                {/* Chart 3: Fuel Price Evolution */}
                <div className="card">
                  <div style={{ marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Fuel Price Trend ({currency}/L)</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Pump price fluctuation across fill-up dates.
                    </p>
                  </div>

                  <LineChart 
                    data={stats.fuelPriceHistory}
                    valueKey="price"
                    labelKey="date"
                    color="#fadb14"
                    unit={`${currency}/L`}
                    average={stats.averageFuelPrice}
                    height={220}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* VIEW 2: MAINTENANCE & SERVICING ANALYTICS */}
      {analyticsView === 'services' && (
        <>
          {vehicleServices.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '54px 20px', marginBottom: '24px' }}>
              <Wrench size={42} color="var(--color-primary)" style={{ margin: '0 auto 14px auto', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Servicing Records Yet</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
                Log your first maintenance record in the <strong>Services</strong> tab. Once recorded, 
                this dashboard will generate component replacement frequency rankings and chronological price trends.
              </p>
            </div>
          ) : (
            <>
              {/* Service Summary KPI Cards */}
              <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Total Services</span>
                    <Wrench size={18} color="var(--color-primary)" />
                  </div>
                  <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                    {serviceMetrics.totalServices}
                  </div>
                  <div className="stat-subtext">Lifetime workshop visits</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Total Maintenance Spend</span>
                    <DollarSign size={18} color="var(--color-orange)" />
                  </div>
                  <div className="stat-value">
                    {currency}{serviceMetrics.totalCost.toLocaleString()}
                  </div>
                  <div className="stat-subtext">Sum of all service bills</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Avg Service Bill</span>
                    <Gauge size={18} color="var(--color-yellow)" />
                  </div>
                  <div className="stat-value">
                    {currency}{serviceMetrics.averageCost.toLocaleString()}
                  </div>
                  <div className="stat-subtext">Average per maintenance visit</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Components Serviced</span>
                    <Layers size={18} color="var(--color-primary)" />
                  </div>
                  <div className="stat-value">
                    {componentFrequencies.length}
                  </div>
                  <div className="stat-subtext">Distinct parts serviced</div>
                </div>
              </div>

              {/* Chart: Component-Level Servicing Frequency & Count Plot */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Component Servicing Frequency & Count Plot</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Ranked breakdown of parts and systems serviced for <strong style={{ color: 'var(--text-main)' }}>{activeVehicle?.name}</strong>.
                    </p>
                  </div>
                  <span className="badge badge-primary">
                    {componentFrequencies.length} Unique Components
                  </span>
                </div>

                {componentCountChartData.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                    No specific components tagged in previous services yet.
                  </div>
                ) : (
                  <HorizontalBarChart 
                    data={componentCountChartData}
                    color="#52c41a"
                    emptyMessage="No component service counts recorded yet"
                  />
                )}
              </div>

              {/* Chart: Component-Level Price Analysis Over Time */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Component Price Analysis Over Time</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Historical replacement and servicing price trajectory for individual vehicle components.
                    </p>
                  </div>

                  {/* Component Selector Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Component:
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.88rem', padding: '6px 12px', minWidth: '200px' }}
                      value={activeSelectedComponentId}
                      onChange={(e) => setSelectedComponentId(e.target.value)}
                    >
                      {componentFrequencies.length === 0 ? (
                        <option value="engine_oil">Engine oil</option>
                      ) : (
                        componentFrequencies.map(c => (
                          <option key={c.id} value={c.id}>
                            #{c.number} {c.name} ({c.count}x)
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Price Statistics Row for Selected Component */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                    gap: '12px', 
                    marginBottom: '20px',
                    background: 'var(--bg-surface-elevated)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Latest Price
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {componentPriceTrajectory.data.length > 0 
                        ? `${currency}${componentPriceTrajectory.data[componentPriceTrajectory.data.length - 1].price.toLocaleString()}`
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Min Historical
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {componentPriceTrajectory.data.length > 0 
                        ? `${currency}${componentPriceTrajectory.minPrice.toLocaleString()}`
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Max Historical
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {componentPriceTrajectory.data.length > 0 
                        ? `${currency}${componentPriceTrajectory.maxPrice.toLocaleString()}`
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Average Price
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {componentPriceTrajectory.data.length > 0 
                        ? `${currency}${componentPriceTrajectory.avgPrice.toLocaleString()}`
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Price Evolution
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {componentPriceTrajectory.data.length < 2 ? (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Baseline</span>
                      ) : componentPriceTrajectory.priceChangePct > 0 ? (
                        <span style={{ color: 'var(--color-danger)', display: 'inline-flex', alignItems: 'center' }}>
                          <ArrowUpRight size={16} /> +{componentPriceTrajectory.priceChangePct}%
                        </span>
                      ) : componentPriceTrajectory.priceChangePct < 0 ? (
                        <span style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center' }}>
                          <ArrowDownRight size={16} /> {componentPriceTrajectory.priceChangePct}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                          <Minus size={14} /> 0%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SVG Line Chart for Component Price Over Time */}
                {componentPriceTrajectory.data.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                    No recorded replacement cost data for {activeComponentDef.name}.
                  </div>
                ) : (
                  <LineChart 
                    data={componentPriceTrajectory.data}
                    valueKey="price"
                    labelKey="date"
                    color="#fa8c16"
                    unit={currency}
                    average={componentPriceTrajectory.avgPrice}
                    height={250}
                    emptyMessage={`No price history for ${activeComponentDef.name}`}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
