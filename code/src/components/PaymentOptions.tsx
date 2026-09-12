import React, { useState } from 'react';
import {
  Wallet,
  PieChart as ChartPie,
  CalendarClock,
  Hourglass,
  Sparkles,
  Check,
  TriangleAlert,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export interface PaymentOptionsProps {
  totalAmount: number;
  safeToSpend: number;
  remaining: number;
  status: string; // 'affordable_now' | 'affordable_with_plan' | 'not_affordable'
  earliestDate: string;
  selectedOption?: string;
  onSelectOption?: (optionId: string) => void;
  onContinue?: (optionId: string) => void;
  formatINR: (val: number, compact?: boolean) => string;
}

interface PaymentCardOption {
  id: string;
  label: string;
  icon: typeof Wallet;
  primary: string;
  secondary: string;
  tertiary?: string;
  status: 'recommended' | 'safe' | 'warning';
  statusLabel: string;
  isRecommendedBadge?: boolean;
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  totalAmount,
  safeToSpend,
  remaining,
  status,
  earliestDate,
  selectedOption: controlledSelected,
  onSelectOption,
  onContinue,
  formatINR,
}) => {
  const isAffordable = status === 'affordable_now';
  const defaultSelection = isAffordable ? 'pay-now' : 'partial';
  const [internalSelected, setInternalSelected] = useState<string>(defaultSelection);
  const activeId = controlledSelected !== undefined ? controlledSelected : internalSelected;

  const handleSelect = (id: string) => {
    setInternalSelected(id);
    if (onSelectOption) onSelectOption(id);
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(activeId);
    }
  };

  // Format date for wait option
  const formattedWaitDate = (() => {
    try {
      const parts = earliestDate.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
    } catch {
      // fallback
    }
    return earliestDate || '1 Oct';
  })();

  // 6 month installment estimate
  const installmentPerMonth = Math.round((totalAmount * 1.06) / 6);

  const options: PaymentCardOption[] = [
    {
      id: 'pay-now',
      label: 'Pay Now',
      icon: Wallet,
      primary: formatINR(totalAmount),
      secondary: 'Full amount today',
      status: isAffordable ? 'safe' : 'warning',
      statusLabel: isAffordable ? 'Safe to pay today' : 'Not recommended',
      isRecommendedBadge: isAffordable,
    },
    {
      id: 'partial',
      label: 'Partial Payment',
      icon: ChartPie,
      primary: formatINR(safeToSpend > 0 ? safeToSpend : Math.round(totalAmount * 0.3)),
      secondary: 'today',
      tertiary: `${formatINR(remaining > 0 ? remaining : Math.round(totalAmount * 0.7))} later`,
      status: !isAffordable ? 'recommended' : 'safe',
      statusLabel: !isAffordable ? 'Best for your cash flow' : 'Safe alternative',
      isRecommendedBadge: !isAffordable,
    },
    {
      id: 'installments',
      label: 'Installments',
      icon: CalendarClock,
      primary: formatINR(installmentPerMonth),
      secondary: '× 6 months · low interest',
      status: 'safe',
      statusLabel: 'Safe monthly pace',
    },
    {
      id: 'wait',
      label: 'Wait',
      icon: Hourglass,
      primary: formattedWaitDate,
      secondary: 'Safe to pay after',
      status: 'safe',
      statusLabel: 'Cushion restored',
    },
  ];

  const currentOption = options.find((o) => o.id === activeId) || options[0];

  return (
    <div className="payment-recommendation-wrapper">
      {/* Header */}
      <div className="payment-options-header">
        <div>
          <div className="recommendation-badge-pill">
            <Sparkles size={14} className="text-lime" />
            <span>AffordAI Recommendation</span>
          </div>
          <h2 className="payment-section-title">How should you pay this bill?</h2>
          <p className="payment-section-desc">
            We analyzed your balance, upcoming expenses, and income timing to find the option that
            keeps you safest.
          </p>
        </div>

        <div className="total-due-badge card-surface">
          <span className="small-kicker">TOTAL DUE</span>
          <strong className="due-amount">{formatINR(totalAmount)}</strong>
        </div>
      </div>

      {/* Radiogroup Grid */}
      <div role="radiogroup" aria-label="Payment options" className="payment-cards-grid">
        {options.map((opt) => {
          const isSelected = activeId === opt.id;
          const isRec = opt.status === 'recommended' || opt.isRecommendedBadge;
          const IconComponent = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id)}
              className={`payment-choice-card card-surface ${isSelected ? 'selected' : ''} ${
                isRec ? 'recommended-highlight' : ''
              }`}
            >
              {/* Recommended ambient glow */}
              {isRec && <div aria-hidden="true" className="rec-ambient-glow" />}

              {/* Radio selection check circle */}
              <span className={`radio-check-indicator ${isSelected ? 'checked' : ''}`}>
                <Check size={12} strokeWidth={3} />
              </span>

              {/* Top Row with Icon & Label */}
              <div className="card-top-row">
                <span className={`payment-icon-wrap ${isRec ? 'accent-icon' : ''}`}>
                  <IconComponent size={18} strokeWidth={1.8} />
                </span>
                <span className="payment-choice-label">{opt.label}</span>
              </div>

              {/* Recommended Pill Badge */}
              {isRec && (
                <span className="recommended-pill">
                  <Check size={11} strokeWidth={3} /> Recommended
                </span>
              )}

              {/* Amount Display */}
              <div className="payment-amount-block">
                <div className="payment-primary-amt">{opt.primary}</div>
                {opt.secondary && <div className="payment-sub-text">{opt.secondary}</div>}
                {opt.tertiary && <div className="payment-tertiary-text">{opt.tertiary}</div>}
              </div>

              {/* Status Badge */}
              <div
                className={`payment-status-tag ${
                  opt.status === 'warning'
                    ? 'warning-tag'
                    : isRec
                    ? 'recommended-tag'
                    : 'safe-tag'
                }`}
              >
                {opt.status === 'warning' ? (
                  <TriangleAlert size={14} />
                ) : isRec ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : (
                  <ShieldCheck size={14} />
                )}
                <span>{opt.statusLabel}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirmation & Continue Footer */}
      <div className="payment-footer-bar card-surface">
        <p className="footer-summary-text">
          You selected <strong className="highlight-white">{currentOption.label}</strong>. You can
          change this anytime before proceeding.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className="button primary continue-btn"
        >
          <span>Continue</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

export default PaymentOptions;
