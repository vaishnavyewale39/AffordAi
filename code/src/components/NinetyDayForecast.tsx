import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wallet,
  TrendingUp,
  Shield,
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';

export interface NinetyDayForecastProps {
  currentBalance: number;
  safeToSpend: number;
  minimumBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  purchaseAmount: number;
  purchaseName?: string;
  purchaseDate?: string;
  formatINR: (val: number, compact?: boolean) => string;
}

interface CashFlowEvent {
  day: number;
  type: 'salary' | 'rent' | 'bills' | 'installment' | 'purchase';
  label: string;
  amount: number;
}

interface TrajectoryPoint {
  day: number;
  date: Date;
  balance: number;
  events: CashFlowEvent[];
}

const EVENT_CONFIG = {
  salary: { label: 'Salary', color: '#65d6c3' },
  rent: { label: 'Rent', color: '#f1c771' },
  bills: { label: 'Bills', color: '#8b989f' },
  installment: { label: 'Existing installments', color: '#a78bfa' },
  purchase: { label: 'Proposed purchase', color: '#b8f25a' },
};

export const NinetyDayForecast: React.FC<NinetyDayForecastProps> = ({
  currentBalance,
  safeToSpend,
  minimumBalance,
  monthlyIncome,
  monthlyExpenses,
  monthlyEmi,
  purchaseAmount,
  purchaseName = 'Planned purchase',
  purchaseDate,
  formatINR,
}) => {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(90);
  const [includePurchase, setIncludePurchase] = useState<boolean>(true);

  // Baseline start date (Sept 12, 2026)
  const startDate = useMemo(() => new Date(2026, 8, 12), []);

  // Purchase day offset
  const purchaseDayOffset = useMemo(() => {
    if (!purchaseDate) return 6;
    try {
      const target = new Date(purchaseDate);
      const diffTime = target.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(85, diffDays));
    } catch {
      return 6;
    }
  }, [purchaseDate, startDate]);

  // Generate recurring events and trajectory
  const { points } = useMemo(() => {
    const events: CashFlowEvent[] = [];
    const rentPortion = Math.round(monthlyExpenses * 0.55);
    const billsPortion = Math.max(0, monthlyExpenses - rentPortion);

    // Populate recurring monthly cycles
    for (let cycle = 0; cycle * 30 < horizon; cycle++) {
      const baseDay = cycle * 30;

      // Salary on day 4 of cycle (+income)
      if (baseDay + 4 <= horizon && monthlyIncome > 0) {
        events.push({
          day: baseDay + 4,
          type: 'salary',
          label: 'Salary credited',
          amount: monthlyIncome,
        });
      }

      // Rent on day 12 of cycle (-rent)
      if (baseDay + 12 <= horizon && rentPortion > 0) {
        events.push({
          day: baseDay + 12,
          type: 'rent',
          label: 'Rent & utilities',
          amount: -rentPortion,
        });
      }

      // Existing EMI on day 18 of cycle (-emi)
      if (baseDay + 18 <= horizon && monthlyEmi > 0) {
        events.push({
          day: baseDay + 18,
          type: 'installment',
          label: 'Loan EMI payment',
          amount: -monthlyEmi,
        });
      }

      // Bills on day 24 of cycle (-bills)
      if (baseDay + 24 <= horizon && billsPortion > 0) {
        events.push({
          day: baseDay + 24,
          type: 'bills',
          label: 'Bills & groceries',
          amount: -billsPortion,
        });
      }
    }

    // Include proposed purchase if enabled
    if (includePurchase && purchaseDayOffset <= horizon) {
      events.push({
        day: purchaseDayOffset,
        type: 'purchase',
        label: purchaseName,
        amount: -(safeToSpend > 0 ? safeToSpend : purchaseAmount),
      });
    }

    // Sort events chronologically
    events.sort((a, b) => a.day - b.day);

    // Calculate daily balances
    const pts: TrajectoryPoint[] = [];
    let runningBalance = currentBalance;

    for (let day = 0; day <= horizon; day++) {
      const dayEvents = events.filter((e) => e.day === day);
      for (const ev of dayEvents) {
        runningBalance += ev.amount;
      }
      const ptDate = new Date(startDate);
      ptDate.setDate(ptDate.getDate() + day);
      pts.push({
        day,
        date: ptDate,
        balance: runningBalance,
        events: dayEvents,
      });
    }

    return { points: pts, events };
  }, [
    horizon,
    includePurchase,
    purchaseDayOffset,
    purchaseName,
    safeToSpend,
    purchaseAmount,
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyEmi,
    startDate,
  ]);

  // Lowest balance in projected timeframe
  const lowestPoint = useMemo(() => {
    return points.reduce((min, p) => (p.balance < min.balance ? p : min), points[0]);
  }, [points]);

  const endBalance = points[points.length - 1].balance;
  const isBreached = lowestPoint.balance < minimumBalance;
  const cushion = lowestPoint.balance - minimumBalance;

  // Chart rendering with SVG
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(720);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setChartWidth(Math.max(300, Math.floor(entries[0].contentRect.width)));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const chartMetrics = useMemo(() => {
    const balances = points.map((p) => p.balance);
    const minVal = Math.min(...balances, minimumBalance);
    const maxVal = Math.max(...balances, currentBalance);
    const range = maxVal - minVal || 1;
    const padMin = minVal - range * 0.12;
    const padMax = maxVal + range * 0.12;

    const padLeft = 24;
    const padRight = 24;
    const padTop = 30;
    const padBottom = 34;
    const innerW = chartWidth - padLeft - padRight;
    const innerH = 320 - padTop - padBottom;
    const maxDay = points[points.length - 1]?.day || 1;

    const getX = (d: number) => padLeft + (d / maxDay) * innerW;
    const getY = (b: number) => padTop + (1 - (b - padMin) / (padMax - padMin)) * innerH;

    // Coords
    const coords = points.map((p) => ({ x: getX(p.day), y: getY(p.balance) }));

    // Smooth Bezier line
    let linePath = '';
    if (coords.length > 0) {
      linePath = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i - 1] ?? coords[i];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] ?? p2;

        const cp1x = p1.x + ((p2.x - p0.x) * 0.18);
        const cp1y = p1.y + ((p2.y - p0.y) * 0.18);
        const cp2x = p2.x - ((p3.x - p1.x) * 0.18);
        const cp2y = p2.y - ((p3.y - p1.y) * 0.18);

        linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
    }

    // Area closed path
    const areaPath =
      linePath +
      ` L ${coords[coords.length - 1].x} ${padTop + innerH}` +
      ` L ${coords[0].x} ${padTop + innerH} Z`;

    // Y Axis Grid lines (4 steps)
    const gridValues: number[] = [];
    for (let s = 0; s <= 4; s++) {
      gridValues.push(minVal + ((maxVal - minVal) / 4) * s);
    }

    return {
      getX,
      getY,
      coords,
      linePath,
      areaPath,
      gridValues,
      innerW,
      padLeft,
      floorY: getY(minimumBalance),
      maxDay,
    };
  }, [points, minimumBalance, currentBalance, chartWidth]);

  // Active hover point
  const activePt = hoverIndex !== null ? points[hoverIndex] : null;
  const activeX = activePt ? chartMetrics.getX(activePt.day) : 0;
  const activeY = activePt ? chartMetrics.getY(activePt.balance) : 0;

  // Event dots to highlight
  const eventPoints = useMemo(() => points.filter((p) => p.events.length > 0), [points]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="ninety-day-forecast-wrapper">
      {/* Header with Horizon Buttons */}
      <div className="forecast-header">
        <div>
          <div className="forecast-brand-pill">
            <span className="pill-spark">
              <Sparkles size={14} />
            </span>
            <span className="section-kicker">AffordAI Projection</span>
          </div>
          <h2 className="forecast-title">90-Day Financial Forecast</h2>
          <p className="forecast-subtitle">
            See how your projected balance moves against your protected floor before you commit.
          </p>
        </div>

        <div className="segmented-horizon">
          {([30, 60, 90] as const).map((days) => (
            <button
              key={days}
              type="button"
              className={`horizon-tab ${horizon === days ? 'selected' : ''}`}
              onClick={() => setHorizon(days)}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="forecast-metrics-grid">
        <div className="forecast-metric-card card-surface">
          <div className="metric-icon-wrap mint">
            <Wallet size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Current balance</span>
            <strong className="metric-val">{formatINR(currentBalance)}</strong>
            <small className="metric-sub">Available across accounts</small>
          </div>
        </div>

        <div className="forecast-metric-card card-surface">
          <div className="metric-icon-wrap lime">
            <TrendingUp size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Safe-to-spend</span>
            <strong className="metric-val lime-text">{formatINR(safeToSpend)}</strong>
            <small className="metric-sub">Without breaching protection</small>
          </div>
        </div>

        <div className="forecast-metric-card card-surface">
          <div className="metric-icon-wrap teal">
            <Shield size={18} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Minimum protected</span>
            <strong className="metric-val">{formatINR(minimumBalance)}</strong>
            <small className="metric-sub">Your safety floor</small>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="forecast-chart-panel card-surface">
        <div className="chart-panel-top">
          <div>
            <span className="section-kicker">PROJECTED BALANCE</span>
            <h3 className="chart-subhead">
              Next {horizon} days · ending at {formatINR(endBalance)}
            </h3>
          </div>

          <button
            type="button"
            className={`purchase-toggle-btn ${includePurchase ? 'included' : 'excluded'}`}
            onClick={() => setIncludePurchase((prev) => !prev)}
          >
            <span className="toggle-dot" />
            {includePurchase ? 'Purchase included' : 'Purchase excluded'}
          </button>
        </div>

        {/* SVG Curve Canvas */}
        <div ref={containerRef} className="svg-chart-container">
          <svg
            viewBox={`0 0 ${chartWidth} 320`}
            width={chartWidth}
            height={320}
            className="forecast-svg"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * chartWidth - chartMetrics.padLeft;
              const dayEst = Math.round((relX / chartMetrics.innerW) * chartMetrics.maxDay);
              setHoverIndex(Math.max(0, Math.min(points.length - 1, dayEst)));
            }}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#65d6c3" stopOpacity={0.32} />
                <stop offset="60%" stopColor="#65d6c3" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#65d6c3" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b8f25a" />
                <stop offset="100%" stopColor="#65d6c3" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {chartMetrics.gridValues.map((val, idx) => {
              const y = chartMetrics.getY(val);
              return (
                <g key={idx}>
                  <line
                    x1={chartMetrics.padLeft}
                    x2={chartWidth - chartMetrics.padLeft}
                    y1={y}
                    y2={y}
                    stroke="var(--line)"
                    strokeWidth={1}
                  />
                  <text
                    x={chartMetrics.padLeft}
                    y={y - 5}
                    className="grid-text"
                    fill="var(--muted-text)"
                    fontSize={10}
                    fontFamily="DM Mono"
                  >
                    {formatINR(val, true)}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            <path d={chartMetrics.areaPath} fill="url(#forecastAreaGrad)" />

            {/* Curve Line */}
            <path
              d={chartMetrics.linePath}
              fill="none"
              stroke="url(#forecastLineGrad)"
              strokeWidth={2.8}
              strokeLinecap="round"
            />

            {/* Minimum Protected Floor Line */}
            <line
              x1={chartMetrics.padLeft}
              x2={chartWidth - chartMetrics.padLeft}
              y1={chartMetrics.floorY}
              y2={chartMetrics.floorY}
              stroke="var(--warning)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              opacity={0.8}
            />
            <text
              x={chartWidth - chartMetrics.padLeft}
              y={chartMetrics.floorY - 6}
              textAnchor="end"
              fill="var(--warning)"
              fontSize={10}
              fontWeight={600}
              fontFamily="DM Mono"
            >
              Min protected · {formatINR(minimumBalance, true)}
            </text>

            {/* Event Markers along the curve */}
            {eventPoints.map((pt) => {
              const ev = pt.events[0];
              const color = EVENT_CONFIG[ev.type]?.color || '#b8f25a';
              return (
                <circle
                  key={pt.day}
                  cx={chartMetrics.getX(pt.day)}
                  cy={chartMetrics.getY(pt.balance)}
                  r={3.8}
                  fill="var(--surface)"
                  stroke={color}
                  strokeWidth={2.2}
                />
              );
            })}

            {/* Lowest point dot */}
            <circle
              cx={chartMetrics.getX(lowestPoint.day)}
              cy={chartMetrics.getY(lowestPoint.balance)}
              r={5}
              fill={isBreached ? 'var(--danger)' : 'var(--lime)'}
              stroke="var(--surface)"
              strokeWidth={2}
            />

            {/* Hover vertical crosshair */}
            {activePt && (
              <g>
                <line
                  x1={activeX}
                  x2={activeX}
                  y1={24}
                  y2={286}
                  stroke="var(--text)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  opacity={0.4}
                />
                <circle
                  cx={activeX}
                  cy={activeY}
                  r={5.5}
                  fill="var(--teal)"
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </g>
            )}
          </svg>

          {/* Interactive Floating Tooltip */}
          {activePt && (
            <div
              className="chart-tooltip-floating"
              style={{
                left: `${(activeX / chartWidth) * 100}%`,
                top: Math.max(activeY - 14, 0),
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="tooltip-date">
                Day {activePt.day} · {formatDate(activePt.date)}
              </div>
              <div className="tooltip-balance">{formatINR(activePt.balance)}</div>
              {activePt.events.length > 0 && (
                <div className="tooltip-events-list">
                  {activePt.events.map((e, idx) => (
                    <div key={idx} className="tooltip-event-row">
                      <span className="tooltip-event-tag">
                        <i
                          style={{
                            backgroundColor: EVENT_CONFIG[e.type]?.color || '#fff',
                          }}
                        />
                        {e.label}
                      </span>
                      <span
                        className={`tooltip-event-amt ${
                          e.amount >= 0 ? 'positive' : 'negative'
                        }`}
                      >
                        {e.amount >= 0 ? '+' : ''}
                        {formatINR(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="chart-legend-row">
          <span className="legend-item">
            <i className="legend-line line-balance" /> Projected balance
          </span>
          <span className="legend-item">
            <i className="legend-line line-floor" /> Min threshold
          </span>
          {Object.entries(EVENT_CONFIG).map(([key, conf]) => (
            <span key={key} className="legend-item">
              <i className="legend-dot" style={{ backgroundColor: conf.color }} />
              {conf.label}
            </span>
          ))}
        </div>
      </div>

      {/* Dynamic Safety Alert Banner */}
      <div className={`forecast-alert-banner card-surface ${isBreached ? 'breached' : 'safe'}`}>
        <span className="alert-banner-icon">
          {isBreached ? <TriangleAlert size={20} /> : <CircleCheck size={20} />}
        </span>
        <div className="alert-banner-copy">
          <p className="alert-banner-title">
            {isBreached
              ? 'This purchase breaches your protected balance'
              : "You're safe to make this purchase"}
          </p>
          <p className="alert-banner-text">
            Your lowest projected balance is{' '}
            <strong className="highlight-white">{formatINR(lowestPoint.balance)}</strong> on{' '}
            {formatDate(lowestPoint.date)} (day {lowestPoint.day}).{' '}
            {isBreached ? (
              <>That&apos;s {formatINR(Math.abs(cushion))} below your safety floor.</>
            ) : (
              <>That leaves a {formatINR(cushion)} cushion above your protected floor.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NinetyDayForecast;
