import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export interface AiRecommendationCardProps {
  purchaseName: string;
  purchaseAmount: number;
  safeToSpend: number;
  remaining: number;
  status: string; // 'affordable_now' | 'affordable_with_plan' | 'not_affordable'
  statusLabel: string;
  earliestDate: string;
  explanation: string;
  minimumBalance: number;
  formatINR: (val: number, compact?: boolean) => string;
}

// Hook for smooth countup animation with reduced-motion support
function useCountUp(target: number, isMounted: boolean, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let startTime: number | null = null;
    const animate = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(target * ease);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, isMounted, duration]);

  return value;
}

export const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({
  purchaseName,
  purchaseAmount,
  safeToSpend,
  remaining,
  status,
  statusLabel,
  earliestDate,
  explanation,
  minimumBalance,
  formatINR,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const animatedSafe = useCountUp(safeToSpend, isMounted);
  const animatedRemaining = useCountUp(remaining, isMounted);

  const isAffordable = status === 'affordable_now';
  const isWithPlan = status === 'affordable_with_plan';
  const isNotAffordable = status === 'not_affordable';

  // Dynamic reasons grounded in financial logic
  const reasons = [
    `Minimum balance of ${formatINR(minimumBalance)} protected`,
    'Essential recurring obligations preserved',
    '90-day cash flow forecast validated',
  ];
  if (explanation) {
    reasons.push(explanation);
  }

  // Format milestone date (e.g., '2026-10-01' -> 'October 1')
  const formattedDate = (() => {
    try {
      const parts = earliestDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return earliestDate;
  })();

  return (
    <div
      className={`ai-recommendation-card card-surface ${isMounted ? 'mounted' : ''}`}
      data-mounted={isMounted}
    >
      {/* Radial ambient glow matching Stitch Mint */}
      <div aria-hidden="true" className="card-ambient-glow" />

      {/* Header */}
      <div className="ai-card-header">
        <div className="ai-card-title-wrap">
          <span className="ai-card-spark-icon">
            <Sparkles size={15} />
          </span>
          <span className="section-kicker">AFFORDABILITY RESULT</span>
        </div>
        <span className="brand-tag">AffordAI</span>
      </div>

      {/* Status Pill */}
      <div
        className={`status-chip ${
          isAffordable || isWithPlan ? 'status-safe' : 'status-danger'
        }`}
      >
        <span className="status-chip-dot">
          {isNotAffordable ? <AlertTriangle size={12} /> : <Check size={12} strokeWidth={3} />}
        </span>
        <span className="status-chip-text">{statusLabel}</span>
      </div>

      {/* Purchase Row */}
      <div className="ai-purchase-row">
        <div>
          <span className="small-kicker">PURCHASE</span>
          <h4 className="purchase-name">{purchaseName || 'Planned Purchase'}</h4>
        </div>
        <div className="purchase-amount">{formatINR(purchaseAmount)}</div>
      </div>

      {/* Metrics Grid */}
      <div className="ai-metrics-grid">
        <div className="ai-metric-tile safe">
          <span className="metric-label">You can safely pay today</span>
          <strong className="metric-num safe-num">{formatINR(animatedSafe)}</strong>
        </div>
        <div className="ai-metric-tile">
          <span className="metric-label">Remaining</span>
          <strong className="metric-num">{formatINR(animatedRemaining)}</strong>
        </div>
      </div>

      {/* Recommended Plan */}
      <div className="ai-plan-section">
        <span className="small-kicker">RECOMMENDED PLAN</span>
        <ol className="plan-steps-list">
          {isAffordable ? (
            <li className="plan-step-item">
              <span className="step-num active">1</span>
              <span className="step-copy">
                Pay <strong className="highlight-white">{formatINR(safeToSpend)}</strong> today in full
              </span>
            </li>
          ) : isWithPlan ? (
            <>
              <li className="plan-step-item">
                <span className="step-num active">1</span>
                <span className="step-copy">
                  Pay <strong className="highlight-white">{formatINR(safeToSpend)}</strong> today
                </span>
              </li>
              <li className="plan-step-item">
                <span className="step-num">2</span>
                <span className="step-copy">
                  Pay <strong className="highlight-white">{formatINR(remaining)}</strong> on{' '}
                  <span className="highlight-accent">{formattedDate}</span>
                </span>
              </li>
            </>
          ) : (
            <li className="plan-step-item">
              <span className="step-num danger">!</span>
              <span className="step-copy">
                Wait until <span className="highlight-accent">{formattedDate}</span> when cash buffer is restored
              </span>
            </li>
          )}
        </ol>
      </div>

      {/* Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="ai-accordion-button"
      >
        <span className="accordion-label">
          <ShieldCheck size={16} className="text-teal" />
          Why is this affordable?
        </span>
        <ChevronRight
          size={16}
          className={`accordion-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {/* Accordion Content */}
      <div className={`accordion-collapse ${isOpen ? 'open' : ''}`}>
        <div className="accordion-inner card-surface">
          <span className="small-kicker">REASONS</span>
          <ul className="reasons-list">
            {reasons.map((reason, idx) => (
              <li
                key={idx}
                className="reason-item"
                style={{
                  animationDelay: isOpen ? `${idx * 60}ms` : '0ms',
                }}
              >
                <span className="reason-check">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span className="reason-text">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AiRecommendationCard;
