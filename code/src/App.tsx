import { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  WalletCards,
  X,
  RotateCcw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AiRecommendationCard } from "./components/AiRecommendationCard";
import { NinetyDayForecast } from "./components/NinetyDayForecast";
import { PaymentOptions } from "./components/PaymentOptions";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
};

export type AffordabilityResult = {
  status: string;
  statusLabel: string;
  risk: string;
  safeToSpend: number;
  remaining: number;
  protectedBalance: number;
  futureBalance: number;
  earliestDate: string;
  explanation: string;
  recommendation: string;
};

export type FormState = {
  purchaseName: string;
  amount: string;
  category: string;
  purchaseDate: string;
  balance: string;
  income: string;
  expenses: string;
  emi: string;
  minimumBalance: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Affordability check", icon: ShieldCheck },
  { label: "Forecast", icon: TrendingUp },
  { label: "Insights", icon: Lightbulb },
];

export const formatINR = (value: number, compact = false) => {
  if (compact && Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (compact && Math.abs(value) >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const initialForm: FormState = {
  purchaseName: "MacBook Air M4",
  amount: "120000",
  category: "Electronics",
  purchaseDate: "2026-09-18",
  balance: "84500",
  income: "75000",
  expenses: "42000",
  emi: "6500",
  minimumBalance: "20000",
};

const expenseBars = [
  { month: "Jun", essentials: 36, flexible: 11 },
  { month: "Jul", essentials: 38, flexible: 14 },
  { month: "Aug", essentials: 42, flexible: 10 },
  { month: "Sep", essentials: 39, flexible: 9 },
];

const cashFlowData = [
  { name: "Income", value: 75000, color: "#b8f25a" },
  { name: "Essentials", value: 42000, color: "#64748b" },
  { name: "Available", value: 26500, color: "#65d6c3" },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  return (
    <div className={darkMode ? "app-shell dark" : "app-shell light"}>
      <Toaster position="bottom-right" theme={darkMode ? "dark" : "light"} />
      <aside className={`sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><span>₹</span></div>
          <div>
            <div className="brand-name">Afford<span>AI</span></div>
            <div className="brand-caption">Financial clarity, daily.</div>
          </div>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => { setActivePage(label); setMobileNav(false); }}
            >
              <Icon size={18} strokeWidth={activePage === label ? 2.4 : 1.8} />
              <span>{label}</span>
              {label === "Affordability check" && <span className="nav-pulse" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${activePage === "Settings" ? "active" : ""}`} onClick={() => { setActivePage("Settings"); setMobileNav(false); }}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={15} /></div>
            <div><strong>Smart safety net</strong><p>AffordAI protects your minimum balance before every recommendation.</p></div>
          </div>
          <div className="profile-row">
            <div className="avatar">AS</div>
            <div className="profile-copy"><strong>Arjun Sharma</strong><span>Personal account</span></div>
            <ChevronDown size={15} className="muted-icon" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span><span className="slash">/</span><strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input aria-label="Search" placeholder="Search your finances" />
            </div>
            <button
              className="icon-button"
              onClick={() => toast("You're all caught up", { description: "No new alerts for your account." })}
              aria-label="Notifications"
            >
              <Bell size={18} /><span className="notification-dot" />
            </button>
            <button
              className="icon-button"
              onClick={() => setDarkMode((value) => !value)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="top-avatar">AS</div>
          </div>
        </header>
        <main className="page-content">
          {activePage === "Dashboard" && <Dashboard onNavigate={setActivePage} form={form} />}
          {activePage === "Affordability check" && <AffordabilityCheck form={form} setForm={setForm} />}
          {activePage === "Forecast" && <ForecastPage form={form} />}
          {activePage === "Insights" && <InsightsPage />}
          {activePage === "Settings" && <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
        </main>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

function Dashboard({ onNavigate, form }: { onNavigate: (page: string) => void; form: FormState }) {
  const currentBal = Number(form.balance) || 84500;
  const minBal = Number(form.minimumBalance) || 20000;
  const income = Number(form.income) || 75000;
  const expenses = Number(form.expenses) || 42000;
  const surplus = Math.max(0, income - expenses - (Number(form.emi) || 6500));
  const safeSpend = Math.max(0, Math.round(((currentBal - minBal) * 0.42 + surplus * 0.08) / 100) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Saturday, 12 September 2026"
        title="Good afternoon, Arjun."
        description="Here’s the clearest view of your money today."
        action={
          <button className="button primary" onClick={() => onNavigate("Affordability check")}>
            <ShieldCheck size={17} /> Check a purchase
          </button>
        }
      />
      <section className="dashboard-grid top-cards">
        <div className="hero-card card-surface">
          <div className="hero-card-top">
            <div>
              <div className="section-kicker light-kicker"><span className="live-dot" /> FINANCIAL HEALTH</div>
              <div className="hero-score"><span>82</span><small>/100</small></div>
              <div className="hero-status"><span className="status-dot" /> Looking healthy <ArrowUpRight size={14} /></div>
            </div>
            <HealthRing />
          </div>
          <div className="hero-divider" />
          <div className="hero-bottom">
            <div><span className="small-label">Safe to spend</span><strong>{formatINR(safeSpend)}</strong></div>
            <div><span className="small-label">Protected balance</span><strong>{formatINR(minBal)}</strong></div>
            <div><span className="small-label">Monthly surplus</span><strong>{formatINR(surplus)}</strong></div>
          </div>
        </div>
        <div className="balance-card card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">TOTAL BALANCE</div>
              <div className="big-value">{formatINR(currentBal)}</div>
            </div>
            <div className="card-icon mint"><WalletCards size={18} /></div>
          </div>
          <div className="balance-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v: 44},{v: 49},{v: 45},{v: 58},{v: 52},{v: 61},{v: 73},{v: 68},{v: 82}]}>
                <defs>
                  <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8f25a" stopOpacity={0.28}/>
                    <stop offset="100%" stopColor="#b8f25a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#b8f25a" strokeWidth={2.5} fill="url(#balanceFill)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-meta">
            <span>+12.8% <ArrowUpRight size={13}/></span>
            <em>vs last month</em>
            <span className="chart-period">30D <ChevronDown size={13}/></span>
          </div>
        </div>
        <div className="next-card card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">NEXT UP</div>
              <h3>Upcoming payments</h3>
            </div>
            <button className="more-button" onClick={() => toast("Payments timeline", { description: "Showing your next 30 days." })}>
              <MoreHorizontal size={18}/>
            </button>
          </div>
          <div className="payment-list">
            <PaymentRow date="18" month="SEP" label={form.purchaseName || "MacBook Air M4"} amount={formatINR(Number(form.amount) || 120000)} accent="lime" />
            <PaymentRow date="24" month="SEP" label="Rent + utilities" amount="₹21,500" accent="gray" />
            <PaymentRow date="18" month="OCT" label="HDFC personal loan" amount="₹6,500" accent="teal" />
          </div>
          <button className="text-button" onClick={() => onNavigate("Forecast")}>
            View cash-flow forecast <ArrowUpRight size={14}/>
          </button>
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="chart-card card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">CASH FLOW</div>
              <h3>Income vs. spending</h3>
            </div>
            <div className="segmented">
              <button className="selected">6M</button>
              <button>3M</button>
              <button>1M</button>
            </div>
          </div>
          <div className="legend-row">
            <span><i className="legend-dot income" /> Income</span>
            <span><i className="legend-dot expense" /> Expenses</span>
            <span className="chart-callout">{formatINR(surplus, true)} surplus <ArrowUpRight size={13}/></span>
          </div>
          <div className="main-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseBars} barGap={9}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-text)", fontSize: 11 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-text)", fontSize: 11 }} tickFormatter={(value) => `₹${value}k`} width={42}/>
                <Tooltip cursor={{fill: "var(--chart-hover)"}} content={<ChartTooltip />} />
                <Bar dataKey="essentials" stackId="a" fill="#64748b" radius={[4,4,0,0]} name="Essentials"/>
                <Bar dataKey="flexible" stackId="a" fill="#65d6c3" radius={[4,4,0,0]} name="Flexible"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="insight-card card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">AI INSIGHT</div>
              <h3>Your money, decoded.</h3>
            </div>
            <div className="spark-icon"><Sparkles size={17} /></div>
          </div>
          <div className="insight-quote">“You can make planned purchases work, but pacing payments keeps your September commitments secure.”</div>
          <div className="insight-points">
            <div><span className="point-icon green"><ShieldCheck size={14}/></span><span>Keep <strong>{formatINR(minBal)}</strong> protected</span></div>
            <div><span className="point-icon teal"><CalendarDays size={14}/></span><span>Full payment is safer after <strong>Oct 1</strong></span></div>
          </div>
          <button className="button secondary full-width" onClick={() => toast("Insight details", { description: "AffordAI compared your balance, recurring commitments, and salary date." })}>
            Understand this insight <ArrowUpRight size={15}/>
          </button>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="recent-card card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">RECENT DECISIONS</div>
              <h3>Affordability history</h3>
            </div>
            <button className="text-button" onClick={() => onNavigate("Affordability check")}>
              New check <ArrowUpRight size={14}/>
            </button>
          </div>
          <div className="decision-table">
            <DecisionRow icon={<Check size={15}/>} tone="success" label="Sony WH-1000XM6" meta="Electronics · 4 Sep 2026" value="₹29,990" status="Affordable"/>
            <DecisionRow icon={<CalendarDays size={14}/>} tone="warning" label="Goa weekend trip" meta="Travel · 27 Aug 2026" value="₹18,500" status="With a plan"/>
            <DecisionRow icon={<X size={15}/>} tone="danger" label="Fossil watch" meta="Personal · 18 Aug 2026" value="₹24,800" status="Not recommended"/>
          </div>
        </div>
        <div className="health-mini card-surface">
          <div className="card-header">
            <div>
              <div className="section-kicker">SPENDING SNAPSHOT</div>
              <h3>Where money went</h3>
            </div>
            <button className="more-button"><MoreHorizontal size={18}/></button>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="46%" height={140}>
              <PieChart>
                <Pie data={cashFlowData} innerRadius={45} outerRadius={62} paddingAngle={4} dataKey="value" stroke="none">
                  {cashFlowData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{formatINR(income, true)}</strong>
              <span>income</span>
            </div>
            <div className="donut-legend">
              {cashFlowData.map((entry) => (
                <div key={entry.name}>
                  <i style={{background: entry.color}}/>
                  <span>{entry.name}</span>
                  <strong>{formatINR(entry.value, true)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HealthRing() {
  return (
    <div className="health-ring">
      <div className="ring-inner">
        <span>Very good</span>
        <strong>82%</strong>
      </div>
    </div>
  );
}

function PaymentRow({ date, month, label, amount, accent }: { date: string; month: string; label: string; amount: string; accent: string }) {
  return (
    <div className="payment-row">
      <div className={`date-tile ${accent}`}>
        <strong>{date}</strong>
        <span>{month}</span>
      </div>
      <div className="payment-copy">
        <strong>{label}</strong>
        <span>Scheduled payment</span>
      </div>
      <strong className="payment-amount">{amount}</strong>
    </div>
  );
}

function DecisionRow({ icon, tone, label, meta, value, status }: { icon: React.ReactNode; tone: string; label: string; meta: string; value: string; status: string }) {
  return (
    <div className="decision-row">
      <span className={`decision-icon ${tone}`}>{icon}</span>
      <div className="decision-copy">
        <strong>{label}</strong>
        <span>{meta}</span>
      </div>
      <span className="decision-value">{value}</span>
      <span className={`status-pill ${tone}`}>{status}</span>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.name}>{item.name}: ₹{item.value}k</span>
      ))}
    </div>
  );
}

function AffordabilityCheck({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [result, setResult] = useState<AffordabilityResult | null>(null);
  const [activeOption, setActiveOption] = useState("partial");

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const analyze = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const balance = Number(form.balance);
    const income = Number(form.income);
    const expenses = Number(form.expenses);
    const emi = Number(form.emi);
    const minimum = Number(form.minimumBalance);

    if (
      !form.purchaseName ||
      !amount ||
      amount <= 0 ||
      !form.purchaseDate ||
      [balance, income, expenses, emi, minimum].some((v) => Number.isNaN(v) || v < 0)
    ) {
      toast.error("Complete the purchase and financial details first.");
      return;
    }

    const monthlySurplus = Math.max(0, income - expenses - emi);
    const safeToSpend = Math.min(
      amount,
      Math.max(0, Math.round(((balance - minimum) * 0.42 + monthlySurplus * 0.08) / 100) * 100)
    );
    const remaining = Math.max(0, amount - safeToSpend);
    const fullDate = safeToSpend >= amount ? form.purchaseDate : "2026-10-01";
    const status =
      safeToSpend >= amount
        ? "affordable_now"
        : safeToSpend > 0 && fullDate <= "2026-11-30"
        ? "affordable_with_plan"
        : "not_affordable";
    const protectedBalance = minimum + Math.round(expenses * 0.2);
    const futureBalance = Math.max(0, balance - safeToSpend + monthlySurplus);
    const statusLabel =
      status === "affordable_now"
        ? "Affordable"
        : status === "affordable_with_plan"
        ? "Affordable with a plan"
        : "Not recommended";
    const risk =
      status === "affordable_now"
        ? "Low risk"
        : status === "affordable_with_plan"
        ? "Moderate risk"
        : "High risk";
    const explanation =
      status === "affordable_now"
        ? `Your balance can cover ${form.purchaseName} and still keep your ₹${minimum.toLocaleString("en-IN")} safety floor intact.`
        : `Paying the full amount today would reduce your balance too close to your protected floor. A partial payment keeps ₹${minimum.toLocaleString("en-IN")} safe while your next salary rebuilds the buffer.`;

    setResult({
      status,
      statusLabel,
      risk,
      safeToSpend,
      remaining,
      protectedBalance,
      futureBalance,
      earliestDate: fullDate,
      explanation,
      recommendation: status === "affordable_now" ? "Pay in full today" : "Start with a partial payment",
    });
    setActiveOption(status === "affordable_now" ? "pay-now" : "partial");
    toast.success("Analysis complete", {
      description: `${statusLabel} · ${formatINR(safeToSpend)} safe to use today.`,
    });
  };

  const reset = () => {
    setForm(initialForm);
    setResult(null);
    setActiveOption("partial");
  };

  return (
    <>
      <PageHeader
        eyebrow="DECISION ENGINE"
        title="Can I safely afford this?"
        description="Give AffordAI the full picture. We’ll protect your future balance, not just check today’s cash."
        action={
          <div className="logic-badge">
            <Sparkles size={15} /> 90-day safety check
          </div>
        }
      />

      {/* Input Form Section */}
      <form className="form-card card-surface" onSubmit={analyze}>
        <div className="form-section">
          <div className="form-section-title">
            <span className="step-number">01</span>
            <div>
              <h3>What are you planning?</h3>
              <p>The purchase you want to make.</p>
            </div>
          </div>
          <div className="field-grid">
            <Field
              label="Purchase name"
              value={form.purchaseName}
              onChange={(value) => setField("purchaseName", value)}
              placeholder="e.g. MacBook Air M4"
            />
            <Field
              label="Amount"
              prefix="₹"
              type="number"
              value={form.amount}
              onChange={(value) => setField("amount", value)}
              placeholder="120000"
            />
            <label className="field-label">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) => setField("category", event.target.value)}
              >
                <option>Electronics</option>
                <option>Travel</option>
                <option>Education</option>
                <option>Home</option>
                <option>Health</option>
                <option>Other</option>
              </select>
            </label>
            <Field
              label="Purchase date"
              type="date"
              value={form.purchaseDate}
              onChange={(value) => setField("purchaseDate", value)}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <span className="step-number">02</span>
            <div>
              <h3>Your financial picture</h3>
              <p>Numbers stay on this device in this prototype.</p>
            </div>
          </div>
          <div className="field-grid three">
            <Field
              label="Current balance"
              prefix="₹"
              type="number"
              value={form.balance}
              onChange={(value) => setField("balance", value)}
            />
            <Field
              label="Monthly income"
              prefix="₹"
              type="number"
              value={form.income}
              onChange={(value) => setField("income", value)}
            />
            <Field
              label="Monthly expenses"
              prefix="₹"
              type="number"
              value={form.expenses}
              onChange={(value) => setField("expenses", value)}
            />
            <Field
              label="Existing EMIs"
              prefix="₹"
              type="number"
              value={form.emi}
              onChange={(value) => setField("emi", value)}
            />
            <Field
              label="Minimum balance to keep"
              prefix="₹"
              type="number"
              value={form.minimumBalance}
              onChange={(value) => setField("minimumBalance", value)}
            />
          </div>
        </div>

        <div className="form-footer">
          <button type="button" className="button ghost" onClick={reset}>
            <RotateCcw size={14} /> Clear
          </button>
          <button className="button primary analyze-button" type="submit">
            <Sparkles size={17} /> Analyze affordability <ArrowUpRight size={16} />
          </button>
        </div>
      </form>

      {/* Result Section: AI Recommendation -> 90-Day Forecast -> Payment Options */}
      {result ? (
        <div className="analysis-result-flow">
          {/* 1. AI Recommendation Card */}
          <AiRecommendationCard
            purchaseName={form.purchaseName}
            purchaseAmount={Number(form.amount)}
            safeToSpend={result.safeToSpend}
            remaining={result.remaining}
            status={result.status}
            statusLabel={result.statusLabel}
            earliestDate={result.earliestDate}
            explanation={result.explanation}
            minimumBalance={Number(form.minimumBalance)}
            formatINR={formatINR}
          />

          {/* 2. 90-Day Financial Forecast */}
          <NinetyDayForecast
            currentBalance={Number(form.balance)}
            safeToSpend={result.safeToSpend}
            minimumBalance={Number(form.minimumBalance)}
            monthlyIncome={Number(form.income)}
            monthlyExpenses={Number(form.expenses)}
            monthlyEmi={Number(form.emi)}
            purchaseAmount={Number(form.amount)}
            purchaseName={form.purchaseName}
            purchaseDate={form.purchaseDate}
            formatINR={formatINR}
          />

          {/* 3. Payment Options */}
          <PaymentOptions
            totalAmount={Number(form.amount)}
            safeToSpend={result.safeToSpend}
            remaining={result.remaining}
            status={result.status}
            earliestDate={result.earliestDate}
            selectedOption={activeOption}
            onSelectOption={setActiveOption}
            onContinue={(optId) => {
              const labelMap: Record<string, string> = {
                "pay-now": "Full Payment",
                partial: "Partial Payment",
                installments: "Installments",
                wait: "Waiting",
              };
              toast.success("Payment option selected", {
                description: `Proceeding with ${labelMap[optId] || optId}. Your ₹${Number(form.minimumBalance).toLocaleString("en-IN")} safety floor is protected.`,
              });
            }}
            formatINR={formatINR}
          />
        </div>
      ) : (
        <div className="empty-result card-surface" style={{ marginTop: 24 }}>
          <div className="empty-orbit">
            <div><ShieldCheck size={27} /></div>
          </div>
          <h3>Your answer will appear here</h3>
          <p>
            Enter your planned purchase and financial numbers above. AffordAI will map the safest
            way forward with an AI recommendation, 90-day forecast, and payment choices.
          </p>
          <div className="empty-details">
            <span><Check size={14} /> 90-day balance forecast</span>
            <span><Check size={14} /> Smart payment options</span>
            <span><Check size={14} /> Plain-English reasoning</span>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: string;
}) {
  return (
    <label className="field-label">
      <span>{label}</span>
      <div className="input-wrap">
        {prefix && <em>{prefix}</em>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function ForecastPage({ form }: { form: FormState }) {
  const currentBal = Number(form.balance) || 84500;
  const minBal = Number(form.minimumBalance) || 20000;
  const income = Number(form.income) || 75000;
  const expenses = Number(form.expenses) || 42000;
  const emi = Number(form.emi) || 6500;
  const purchaseAmt = Number(form.amount) || 120000;
  const surplus = Math.max(0, income - expenses - emi);
  const safeSpend = Math.max(0, Math.round(((currentBal - minBal) * 0.42 + surplus * 0.08) / 100) * 100);

  return (
    <>
      <PageHeader
        eyebrow="CASH-FLOW MAP"
        title="Your next 90 days, in focus."
        description="See when your balance rises, dips, and how close it gets to your protected floor."
      />

      <NinetyDayForecast
        currentBalance={currentBal}
        safeToSpend={safeSpend}
        minimumBalance={minBal}
        monthlyIncome={income}
        monthlyExpenses={expenses}
        monthlyEmi={emi}
        purchaseAmount={purchaseAmt}
        purchaseName={form.purchaseName || "Planned purchase"}
        purchaseDate={form.purchaseDate || "2026-09-18"}
        formatINR={formatINR}
      />
    </>
  );
}

function InsightsPage() {
  return (
    <>
      <PageHeader
        eyebrow="AFFORDAI INTELLIGENCE"
        title="Insights you can act on."
        description="Clear signals from your cash flow, commitments, and everyday spending patterns."
        action={
          <div className="logic-badge">
            <Sparkles size={15} /> Updated today
          </div>
        }
      />
      <div className="insights-hero card-surface">
        <div className="insights-hero-copy">
          <div className="section-kicker light-kicker"><Sparkles size={13} /> THIS MONTH’S SIGNAL</div>
          <h2>Your financial rhythm is getting stronger.</h2>
          <p>Your essentials stayed stable while flexible spending fell 9% this month. That gives you more room to make planned purchases without touching your safety floor.</p>
          <div className="insight-stat-row">
            <div><strong>+12.8%</strong><span>balance growth</span></div>
            <div><strong>−9.0%</strong><span>flexible spend</span></div>
            <div><strong>82</strong><span>health score</span></div>
          </div>
        </div>
        <div className="insight-orbit">
          <div className="orbit-ring ring-one"/>
          <div className="orbit-ring ring-two"/>
          <div className="orbit-core"><Sparkles size={25}/></div>
          <span className="orbit-dot dot-a"/>
          <span className="orbit-dot dot-b"/>
        </div>
      </div>
      <div className="insight-grid">
        <InsightCard icon={<ShieldCheck size={18}/>} tone="green" title="Protect the floor" text="Your ₹20,000 safety buffer is doing its job. Keep it untouched for a more resilient month-end." cta="Review protected balance"/>
        <InsightCard icon={<TrendingUp size={18}/>} tone="teal" title="Build your next milestone" text="At your current surplus, you’re 3 months away from a ₹1L emergency buffer." cta="Set a savings goal"/>
        <InsightCard icon={<Target size={18}/>} tone="lime" title="One small adjustment" text="Reducing dining out by ₹1,500 could bring your planned purchase to an affordable-now decision." cta="See the math"/>
      </div>
      <div className="patterns-card card-surface">
        <div className="card-header">
          <div><div className="section-kicker">SPENDING PATTERNS</div><h3>Essentials are steady. Flex is improving.</h3></div>
          <span className="trend-chip"><ArrowDownRight size={13}/> 9% this month</span>
        </div>
        <div className="patterns-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseBars} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)"/>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: "var(--muted-text)", fontSize: 11}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill: "var(--muted-text)", fontSize: 11}} tickFormatter={(value) => `₹${value}k`} width={38}/>
              <Bar dataKey="essentials" fill="#64748b" radius={[4,4,0,0]} name="Essentials"/>
              <Bar dataKey="flexible" fill="#b8f25a" radius={[4,4,0,0]} name="Flexible"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function InsightCard({ icon, tone, title, text, cta }: { icon: React.ReactNode; tone: string; title: string; text: string; cta: string }) {
  return (
    <div className="insight-detail-card card-surface">
      <div className={`detail-icon ${tone}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={() => toast(title, {description: cta})}>
        {cta} <ArrowUpRight size={14}/>
      </button>
    </div>
  );
}

function SettingsPage({ darkMode, setDarkMode }: { darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  return (
    <>
      <PageHeader eyebrow="YOUR SPACE" title="Settings" description="Make AffordAI feel right for the way you manage money." />
      <div className="settings-layout">
        <div className="settings-card card-surface">
          <div className="settings-row">
            <div className="settings-icon"><Sun size={17}/></div>
            <div className="settings-copy">
              <strong>Appearance</strong>
              <span>Choose how AffordAI looks on your screen.</span>
            </div>
            <button className="theme-switch" onClick={() => setDarkMode(!darkMode)}>
              <span className={darkMode ? "selected" : ""}>Dark</span>
              <span className={!darkMode ? "selected" : ""}>Light</span>
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-icon"><ShieldCheck size={17}/></div>
            <div className="settings-copy">
              <strong>Protected balance</strong>
              <span>Minimum amount AffordAI will keep untouched.</span>
            </div>
            <button className="setting-value" onClick={() => toast("Protected balance", {description: "Your current floor is ₹20,000."})}>
              ₹20,000 <ChevronDown size={15}/>
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-icon"><Bell size={17}/></div>
            <div className="settings-copy">
              <strong>Decision notifications</strong>
              <span>Get a nudge when a planned purchase becomes safer.</span>
            </div>
            <button className="toggle on" onClick={() => toast("Notifications enabled", {description: "AffordAI will keep you posted."})}>
              <span/>
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-icon"><CircleHelp size={17}/></div>
            <div className="settings-copy">
              <strong>About the decision engine</strong>
              <span>How AffordAI thinks about safe affordability.</span>
            </div>
            <button className="text-button" onClick={() => toast("About AffordAI", {description: "Recommendations combine your cash flow, obligations, preferences, and a 90-day safety check."})}>
              Read methodology <ArrowUpRight size={14}/>
            </button>
          </div>
        </div>
        <div className="settings-side card-surface">
          <div className="settings-side-mark"><Gauge size={23}/></div>
          <h3>Built for better decisions.</h3>
          <p>AffordAI is a decision support tool, not a lender or financial advisor. Use it to slow down, see the trade-offs, and choose with confidence.</p>
          <span>Version 1.0 · September 2026</span>
        </div>
      </div>
    </>
  );
}

export default App;
