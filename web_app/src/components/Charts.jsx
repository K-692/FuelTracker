import React, { useState } from 'react';
import { formatDate } from '../utils/dateFormatter';

/**
 * LineChart: SVG-based smooth line chart with gradient fill and interactive tooltips.
 */
export function LineChart({ 
  data = [], 
  valueKey = 'value', 
  labelKey = 'date', 
  color = '#52c41a', 
  unit = '',
  height = 240,
  average = null,
  emptyMessage = 'No data points recorded yet' 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
        {emptyMessage}
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div style={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color }}>
          {data[0][valueKey]} {unit}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Recorded on {formatDate(data[0][labelKey])}. Add 1 more refill to plot visual trend lines.
        </div>
      </div>
    );
  }

  const values = data.map(d => Number(d[valueKey]) || 0);
  const minVal = Math.min(...values) * 0.85;
  const maxVal = Math.max(...values) * 1.15;
  const range = maxVal - minVal || 1;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * chartWidth;
    const y = height - paddingY - ((Number(item[valueKey]) - minVal) / range) * chartHeight;
    return { x, y, item, idx };
  });

  const polylineStr = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaStr = `${points[0].x.toFixed(1)},${height - paddingY} ${polylineStr} ${points[points.length - 1].x.toFixed(1)},${height - paddingY}`;

  let avgY = null;
  if (average && average >= minVal && average <= maxVal) {
    avgY = height - paddingY - ((average - minVal) / range) * chartHeight;
  }

  const gradientId = `grad_${color.replace('#', '')}_${Math.floor(Math.random() * 1000)}`;

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.33, 0.66, 1].map((pct, i) => {
          const y = height - paddingY - pct * chartHeight;
          const labelVal = (minVal + pct * range).toFixed(1);
          return (
            <g key={i}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={width - paddingX} 
                y2={y} 
                stroke="var(--border-subtle)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingX - 8} 
                y={y + 4} 
                fill="var(--text-dim)" 
                fontSize="10" 
                textAnchor="end"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Optional Average Guide Line */}
        {avgY !== null && (
          <g>
            <line 
              x1={paddingX} 
              y1={avgY} 
              x2={width - paddingX} 
              y2={avgY} 
              stroke="var(--text-dim)" 
              strokeDasharray="2 2" 
              strokeWidth="1.5"
            />
            <text 
              x={width - paddingX + 6} 
              y={avgY + 3} 
              fill="var(--text-dim)" 
              fontSize="9"
              fontWeight="600"
            >
              Avg: {average} {unit}
            </text>
          </g>
        )}

        <polygon points={areaStr} fill={`url(#${gradientId})`} />

        <polyline 
          points={polylineStr} 
          fill="none" 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.idx === idx ? 6.5 : 4}
            fill={hoveredPoint?.idx === idx ? '#ffffff' : color}
            stroke={color}
            strokeWidth="2.5"
            style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* X-axis date labels formatted as DD/Apr/YYYY */}
        {points.length > 0 && (
          <>
            <text 
              x={points[0].x} 
              y={height - 8} 
              fill="var(--text-dim)" 
              fontSize="10" 
              textAnchor="start"
            >
              {formatDate(points[0].item[labelKey])}
            </text>
            <text 
              x={points[points.length - 1].x} 
              y={height - 8} 
              fill="var(--text-dim)" 
              fontSize="10" 
              textAnchor="end"
            >
              {formatDate(points[points.length - 1].item[labelKey])}
            </text>
          </>
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div 
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 800, color }}>
            {hoveredPoint.item[valueKey]} {unit}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {formatDate(hoveredPoint.item[labelKey])}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BarChart: Clean SVG bar chart for expenditure with DD/Apr/YYYY tooltip.
 */
export function BarChart({ 
  data = [], 
  valueKey = 'cost', 
  labelKey = 'date', 
  color = '#fa8c16', 
  currency = '₹', 
  height = 220 
}) {
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
        No expenditure recorded
      </div>
    );
  }

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1) * 1.1;

  const width = 600;
  const paddingX = 35;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const barWidth = Math.min(30, (chartWidth / data.length) * 0.7);

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <line 
          x1={paddingX} 
          y1={height - paddingY} 
          x2={width - paddingX} 
          y2={height - paddingY} 
          stroke="var(--border-subtle)" 
        />

        {data.map((item, idx) => {
          const val = Number(item[valueKey]) || 0;
          const barHeight = (val / maxVal) * chartHeight;
          const x = paddingX + (idx + 0.5) * (chartWidth / data.length) - barWidth / 2;
          const y = height - paddingY - barHeight;

          return (
            <rect
              key={idx}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(4, barHeight)}
              rx="3"
              fill={hoveredBar === idx ? '#ffa940' : color}
              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={() => setHoveredBar(idx)}
              onMouseLeave={() => setHoveredBar(null)}
            />
          );
        })}
      </svg>

      {hoveredBar !== null && data[hoveredBar] && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-main)',
          }}
        >
          {formatDate(data[hoveredBar][labelKey])}: <strong>{currency}{data[hoveredBar][valueKey]}</strong>
        </div>
      )}
    </div>
  );
}
