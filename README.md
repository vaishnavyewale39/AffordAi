# AffordAI — Buy or Wait? 💡

> **AI-Powered Financial Affordability Assistant**  
> Built for the **HackerRank Orchestrate** Hackathon (September 2026).  
> Inspired by the [Google Stitch Design Reference](https://stitch.withgoogle.com/projects/14345988458300079026).

---

## 🌟 Executive Summary

When deciding whether to make a major purchase, checking the current account balance is rarely enough. A user asking **"Can I afford this laptop?"** needs an answer that accounts for:
- Scheduled recurring commitments (rent, utilities, insurance, subscriptions).
- Pending and unsettled transactions.
- Conservative essential variable spending.
- Confirmed income settlements.
- The user's non-negotiable **minimum balance cushion**.
- Seller-provided payment options (interest-free periods, installments, split payments).

**AffordAI** reconstructs the user's financial reality across a **90-day horizon** and delivers personalized, deterministic, and safe recommendations: **Pay in Full**, **Pay Partially**, **Use Installments**, **Wait**, or **Do Not Proceed**.

---

## 🚀 Live Demo & Repository

- **GitHub Repository**: [https://github.com/vaishnavyewale39/AffordAi.git](https://github.com/vaishnavyewale39/AffordAi.git)
- **Live Vercel Deployment**: Connected directly to the `main` branch with automatic continuous deployment.
- **HackerRank Challenge Submission**: [Buy or Wait? Submission Portal](https://www.hackerrank.com/contests/hackerrank-orchestrate-september26/challenges/buy-or-wait/submission)

---

## 🧠 Approach Overview & Financial Decision Engine

AffordAI operates on a rigorous, single-source-of-truth financial projection engine adhering to the challenge contract:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  Financial Profile     │      │   Financial Events      │      │   Payment Options       │
│  - Home Currency       │      │   - Recurring Bills     │      │   - Pay in Full         │
│  - Available Balance   │  ──► │   - Pending Debits      │  ──► │   - Partial (50/50)     │
│  - Minimum Cushion     │      │   - Confirmed Income    │      │   - Installments        │
│  - Priority Categories │      │   - Historical Trends   │      │   - Defer / Wait        │
└────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   90-Day Cash Simulation  │
                               │   - Daily Balance Trace   │
                               │   - Cushion Invariance    │
                               │   - Stress-Test Purchase  │
                               └───────────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │   Personalized Decision   │
                               │   - AI Verdict & Plan     │
                               │   - Dynamic Curve Visual  │
                               │   - Selected Option Flow  │
                               └───────────────────────────┘
```

### Key Decision Principles:
1. **Never Breach the Minimum Cushion**: The projected balance must stay strictly above `minimum_balance_to_keep` on every single day across the forecast window.
2. **Conservative Income & Credit Handling**:
   - Confirmed salary is credited only on its scheduled settlement date.
   - Pending debits are reserved immediately against available funds.
   - Pending credits, refunds, or unrealized investments are never treated as available cash until settled.
3. **Multi-Horizon Cash-Flow Simulation**:
   - Daily balance trajectories are modeled for 30, 60, and 90 days.
   - Compares the baseline curve (without purchase) against the adjusted curve (with purchase or plan).
4. **Tailored Affordability Classifications**:
   - `affordable_now`: The user can safely pay the full amount today while maintaining the safety cushion and covering all projected commitments.
   - `affordable_with_plan`: The purchase is feasible when utilizing structured installments, a safe 2-step partial payment, or permissible flexible spending reductions.
   - `affordable_later`: The purchase cannot be safely made today, but projected net cash flows will make it safe by an identifiable date (`earliest_date_for_full_payment`).
   - `not_affordable`: The expense would violate safety margins or cause debt risk within the forecast period.

---

## 🎨 Three Custom Integrated Components

The application integrates three custom React components crafted according to the Google Stitch design language (obsidian & neon mint palette, Space Grotesk headers, DM Mono figures, glassmorphism, and responsive micro-animations):

### 1. AI Recommendation Card (`src/components/AiRecommendationCard.tsx`)
- **Verdict Badge**: High-visibility status tag (`Affordable Now`, `Affordable with Plan`, `Affordable Later`, `Not Affordable`).
- **Animated Numeric Counters**: Smooth cubic ease-out counting animation for `Safe Today` and `Remaining` amounts.
- **Milestone Breakdown**: Step-by-step payment timeline dates and amounts.
- **Collapsible Reasoning**: Expandable accordion detailing exact cash-flow reserves, cushion buffers, and upcoming bills justifying the decision.

### 2. 90-Day Cash Flow Forecast (`src/components/NinetyDayForecast.tsx`)
- **Interactive Balance Curve**: Responsive SVG curve rendered dynamically using `ResizeObserver`.
- **Horizon Selector**: Instant toggling between 30-day, 60-day, and 90-day projection windows.
- **Purchase Impact Toggle**: Switch to compare trajectory with the purchase included vs. excluded.
- **Safety Cushion Guideline**: Visual dashed boundary indicating the user's non-negotiable minimum balance.
- **Crosshair Tooltip**: Hover inspection showing exact dates, projected balances, and transaction markers (paychecks, rent, utility bills).

### 3. Smart Payment Options (`src/components/PaymentOptions.tsx`)
- **4 Tailored Choices**:
  1. *Pay in Full* (Instant checkout with 0% extra fee)
  2. *Partial Payment* (Pay safe amount today, remainder on earliest safe date)
  3. *Installments* (Structured monthly installments matching user limits)
  4. *Wait* (Save until safe full payment date)
- **Interactive Radio Cards**: Visual selection state, fee tags, and fee breakdowns.
- **Continue CTA**: Direct action confirmation triggering guided payment completion.

---

## 📂 Repository Layout

```text
.
├── code/                             # Web Application source code
│   ├── src/
│   │   ├── components/
│   │   │   ├── AiRecommendationCard.tsx  # Component 1: Verdict & reasoning
│   │   │   ├── NinetyDayForecast.tsx     # Component 2: 90-day balance curve
│   │   │   └── PaymentOptions.tsx        # Component 3: Payment option cards
│   │   ├── App.tsx                       # Main application & financial engine
│   │   └── main.tsx                      # React root mount
│   ├── index.html                        # HTML entry point with metadata
│   ├── index.css                         # Stitch design system CSS tokens
│   ├── package.json                      # Frontend dependencies & scripts
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── vercel.json                       # Subdirectory Vercel SPA routing
│   └── vite.config.ts                    # Vite build configuration
├── dataset/                          # Challenge dataset files
│   ├── requests.csv                  # Purchase requests to evaluate
│   ├── sample_requests.csv           # Solved benchmark examples
│   ├── financial_profiles.csv        # Balances, cushions, priorities
│   ├── financial_events.csv          # Recurring, pending, confirmed events
│   ├── request_payment_options.csv   # Available payment options
│   ├── exchange_rates.csv            # Currency conversion rates
│   ├── messages.csv                  # Supporting message evidence
│   └── images.csv                    # Supporting document references
├── package.json                      # Root package with build delegation
├── vercel.json                       # Root Vercel deployment configuration
├── AGENTS.md                         # Agent protocol & turn logging specs
├── problem_statement.md              # Official HackerRank challenge statement
└── README.md                         # Project documentation
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/vaishnavyewale39/AffordAi.git
cd AffordAi
```

### 2. Install Dependencies
You can install dependencies from the repository root:
```bash
npm install
```
*(Or directly inside `code/`: `cd code && npm install`)*

### 3. Run Locally (Development Server)
Start the Vite development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
To build the TypeScript project and generate minified production bundles:
```bash
npm run build
```
This automatically compiles TypeScript and bundles the application via Vite into both `code/dist/` and root `dist/`.

### 5. Preview Production Build
```bash
npm run preview
```
Open [http://localhost:4173](http://localhost:4173) to preview the production build.

---

## ☁️ Deployment Guide (Vercel)

The repository includes pre-configured deployment files for **Vercel** (`vercel.json` at root and in `code/`).

### Option A: Automatic Git Deployment (Default)
1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. In your Vercel project, the deployment will trigger automatically.
3. Root `vercel.json` runs `npm run build`, outputs to `dist/`, and handles single-page app (SPA) rewrites.

### Option B: Setting Root Directory in Vercel Dashboard (Best Practice)
If you prefer Vercel to treat `code/` directly as the project root:
1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings** ➔ **General**.
3. Under **Root Directory**, click **Edit** and set it to:
   ```text
   code
   ```
4. Click **Save** and trigger a **Redeploy**.

---

## 📊 Dataset & Required Output Compliance

The core engine maps directly to the challenge schema specified in `problem_statement.md`:

| Output Column | Description | Format / Allowed Values |
|---|---|---|
| `request_id` | Unique ID of the purchase request | e.g. `req_001` |
| `amount_safe_to_pay` | Safe initial payment on `request_date` | `0 <= amount <= requested_amount` |
| `affordability_status` | Classification of the request | `affordable_now` \| `affordable_with_plan` \| `affordable_later` \| `not_affordable` |
| `recommended_payment_method` | Selected payment approach | `full_payment` \| `partial_payment` \| `installments` \| `wait` \| `not_recommended` |
| `payment_plan` | Chronological schedule | `YYYY-MM-DD:amount\|...` or `none` |
| `earliest_date_for_full_payment` | First date one full payment is safe | `YYYY-MM-DD` or empty |
| `spending_changes_needed` | Optional reductions in flexible spending | `stop:<id>` / `reduce_to:<id>:<amount>` or `none` |
| `decision_explanation` | Grounded, concise rationale | Plain text summary |

---

## 💻 Tech Stack

- **Frontend Framework**: React 18 (TypeScript)
- **Bundler & Tooling**: Vite 6, TypeScript 5
- **Design System & Styling**: Custom CSS with Google Stitch Design Tokens (Vanilla CSS + HSL design tokens, Glassmorphism, Zero CSS framework conflicts)
- **Charts & Projections**: Custom Responsive SVG Curve Engine & Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

---

## 👥 Authors & Acknowledgments

- **Team / Participant**: Vaishnav Yewale ([vaishnavyewale39](https://github.com/vaishnavyewale39))
- **Hackathon**: HackerRank Orchestrate (September 2026)
- **Design System**: Google Stitch Reference (`projects/14345988458300079026`)
