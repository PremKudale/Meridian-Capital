# Meridian Capital — Project Finance Modeling & Advisory Platform

<div align="center">

**A professional-grade infrastructure project finance analyzer with full DCF modeling, debt waterfall structuring, sensitivity analysis, Monte Carlo simulation, and automated investment memorandum generation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.4-FF6384?logo=chartdotjs)](https://www.chartjs.org/)
![Status](https://img.shields.io/badge/Status-Production-10b981)

</div>

---

## 📋 Overview

**Meridian Capital** is an interactive web-based project finance platform that models the complete financial lifecycle of infrastructure investments. Built as a case study around a **100 MW Solar Power Plant (₹450+ Cr CAPEX)**, it demonstrates institutional-grade financial modeling capabilities used in infrastructure investment banking and project finance advisory.

The platform runs a **25-year discounted cash flow (DCF) model** with interconnected sub-models for construction, revenue, OPEX, depreciation, tax, debt servicing, and equity returns — all computed in real-time as assumptions change.

### Key Capabilities

| Category | Features |
|----------|----------|
| **Financial Modeling** | 25-year DCF, cash flow waterfall, revenue/OPEX projections with escalation |
| **Capital Structuring** | Debt/equity optimization, annuity & sculpted repayment, IDC, DSRA |
| **Coverage Analysis** | DSCR (min/avg/period), LLCR, PLCR with threshold monitoring |
| **Returns Analysis** | Project IRR, Equity IRR (Newton-Raphson), NPV, MOIC, simple & discounted payback |
| **Tax Optimization** | Accelerated depreciation (40% Y1), MAT vs Normal tax, loss carry-forward |
| **Sensitivity Analysis** | Tornado chart (±20% on 10 variables), two-way data tables |
| **Scenario Analysis** | Base / Bull / Bear / Stress cases with side-by-side comparison |
| **Monte Carlo Simulation** | 1,000 iterations, P10/P50/P90, VaR, probability distributions |
| **Reporting** | Auto-generated investment memorandum, CSV export, print-ready PDF |

---

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- Node.js (for the local dev server, optional)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/meridian-capital.git
cd meridian-capital

# Start a local server (ES modules require a server)
npx serve

# Open in browser
# Navigate to http://localhost:3000
```

Alternatively, you can use any static file server:
```bash
# Python
python -m http.server 3000

# VS Code
# Install "Live Server" extension → Right-click index.html → "Open with Live Server"
```

---

## 🏗️ Architecture

### Project Structure

```
meridian-capital/
│
├── index.html                      # Application shell (sidebar + 7 tabs + KPI bar)
├── README.md
│
├── css/
│   ├── index.css                   # Design system (CSS custom properties, dark theme)
│   ├── dashboard.css               # KPI cards, tab layout, responsive grid
│   ├── sidebar.css                 # Assumptions panel, custom form controls
│   └── charts.css                  # Chart containers, heat maps, analysis layouts
│
└── js/
    ├── app.js                      # Application orchestrator & event handling
    ├── assumptions.js              # Input management, validation, defaults
    │
    ├── model/                      # ── Financial Model Engine ──
    │   ├── engine.js               # Central orchestrator (runs all sub-models)
    │   ├── construction.js         # S-curve CAPEX drawdown, IDC calculation
    │   ├── revenue.js              # P50 energy generation, PPA + merchant revenue
    │   ├── opex.js                 # O&M, insurance, land lease (inflation-indexed)
    │   ├── depreciation.js         # Accelerated dep, WDV, MAT vs Normal tax
    │   ├── debt.js                 # Annuity/sculpted repayment, DSCR/LLCR/PLCR
    │   ├── cashflow.js             # Cash flow waterfall aggregation
    │   └── returns.js              # IRR, NPV, MOIC, payback calculations
    │
    ├── analysis/                   # ── Risk & Scenario Analysis ──
    │   ├── sensitivity.js          # Tornado chart, two-way data tables
    │   ├── scenarios.js            # Base/Bull/Bear/Stress scenario manager
    │   └── montecarlo.js           # 1,000-iteration probabilistic simulation
    │
    ├── charts/                     # ── Data Visualization ──
    │   ├── chartConfigs.js         # Chart.js dark theme configurations
    │   └── chartManager.js         # Chart lifecycle management
    │
    └── utils/                      # ── Utility Functions ──
        ├── financial.js            # IRR (Newton-Raphson), NPV, PMT, WACC, etc.
        ├── format.js               # Indian numbering (Cr/Lakhs), currency formatting
        └── export.js               # CSV export, investment memo generator
```

### Model Flow

```
Assumptions (UI Inputs)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                  MODEL ENGINE                        │
│                                                      │
│  Construction ─→ Revenue ─→ OPEX                     │
│       │              │          │                     │
│       ▼              ▼          ▼                     │
│  Total CAPEX    EBITDA = Revenue - OPEX              │
│       │              │                                │
│       ▼              ▼                                │
│  Debt Schedule ←── CFADS (Cash Flow for Debt Service)│
│       │              │                                │
│       ▼              ▼                                │
│  Interest ──→ Depreciation & Tax                     │
│                      │                                │
│                      ▼                                │
│              Cash Flow Waterfall                      │
│              FCFE = EBITDA - Debt Service - Tax       │
│                      │                                │
│                      ▼                                │
│              Returns (IRR, NPV, MOIC, Payback)       │
└─────────────────────────────────────────────────────┘
    │
    ▼
Dashboard (Charts, KPIs, Tables)
```

---

## 📊 Dashboard Tabs

### 1. Overview
- Revenue / EBITDA / FCFE trend line chart (25 years)
- Cash Flow Waterfall (stacked bar: Revenue, OPEX, Debt Service, Tax)
- CAPEX Breakdown (doughnut chart with EPC, Land, Grid, Dev, IDC)
- Cumulative Cash Flow curve with breakeven indicator
- DSCR Timeline with 1.2x minimum threshold

### 2. Cash Flows
- Complete 25-year annual cash flow statement
- Columns: Energy (MWh), Revenue, OPEX, EBITDA, Debt Service, Tax, FCFE, DSCR, Cumulative FCFE
- All values in ₹ Lakhs with color-coded positive/negative values

### 3. Debt Schedule
- Debt Service Profile (stacked bar: Principal + Interest)
- DSCR Timeline with threshold monitoring

### 4. Sensitivity Analysis
- **Tornado Chart**: Top 8 variables ranked by impact on Equity IRR (±20% variation)
- **Detail Table**: Shows IRR at -20%, base, +20% for each variable with impact range

### 5. Scenario Analysis
- **Four scenarios**: Base Case, Bull Case, Bear Case, Stress Case
- Side-by-side comparison cards showing Equity IRR, NPV, MOIC, Min DSCR, Payback
- Color-coded indicators (green/amber/red)

### 6. Monte Carlo Simulation
- **1,000 iterations** with randomized: Capacity Factor, CAPEX, PPA Tariff, O&M, Interest Rate, Degradation
- Histogram showing IRR distribution (color-coded: green >14%, amber >10%, red <10%)
- Statistical summary: Mean, Median, Std Dev, P10/P50/P90
- Probability analysis: P(IRR > 12%), P(IRR > 14%), P(IRR > 16%), P(NPV > 0), P(DSCR > 1.2x)
- Value at Risk (VaR) at 95% and 99% confidence

### 7. Executive Summary
- Auto-generated Investment Memorandum with:
  - Project Overview & key parameters
  - Capital Structure (Debt/Equity split)
  - Returns Analysis (IRR, NPV, MOIC, Payback)
  - Debt Coverage Assessment (DSCR, LLCR)
  - Investment Recommendation (Proceed / Caution / Review)

---

## 🔧 Model Assumptions (Default — 100 MW Solar)

| Parameter | Default Value | Description |
|-----------|--------------|-------------|
| Capacity | 100 MW | Nameplate capacity |
| Project Life | 25 years | Operating period |
| CAPEX per MW | ₹4.50 Cr | All-in development cost |
| Capacity Factor | 22% | P50 annual CUF |
| Degradation | 0.50%/yr | Annual generation decline |
| PPA Tariff | ₹3.50/kWh | Fixed tariff |
| PPA Tenure | 25 years | Contract duration |
| O&M Cost | ₹6.00 L/MW/yr | Annual O&M |
| Inflation | 5.00% | OPEX escalation rate |
| Debt:Equity | 70:30 | Capital structure |
| Interest Rate | 9.50% | Cost of debt |
| Loan Tenor | 15 years | Repayment period |
| Tax Rate | 25.20% | Corporate tax (incl. surcharge) |
| Accelerated Dep | 40% (Year 1) | Solar project benefit |
| Discount Rate | 10.00% | WACC for NPV |

All assumptions are fully adjustable in real-time through the sidebar panel.

---

## 🧮 Financial Mathematics

### IRR Calculation (Newton-Raphson Method)
The platform implements a custom IRR solver using the Newton-Raphson iterative method with a bisection fallback for convergence:

```javascript
// Newton-Raphson iteration
rate = rate - NPV(rate) / NPV'(rate)

// Convergence criteria: |Δrate| < 10⁻⁷
// Fallback: Bisection method over [-0.5, 5.0] range
```

### Coverage Ratios
```
DSCR = CFADS / Debt Service (Principal + Interest)
LLCR = NPV(Future CFADS over Loan Life) / Outstanding Debt
PLCR = NPV(Future CFADS over Project Life) / Outstanding Debt
```

### Monte Carlo Variables
Each variable is sampled from a normal distribution with variable-specific standard deviations, clamped to realistic bounds:

| Variable | Std Dev | Min Bound | Max Bound |
|----------|---------|-----------|-----------|
| Capacity Factor | ±8% of mean | 75% of base | 125% of base |
| CAPEX/MW | ±6% of mean | 85% of base | 120% of base |
| PPA Tariff | ±5% of mean | 85% of base | 115% of base |
| O&M Cost | ±10% of mean | 80% of base | 130% of base |
| Interest Rate | ±80 bps | -200 bps | +300 bps |
| Degradation | ±20% of mean | 0.1% | 2× base |

---

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic application structure |
| **CSS3** | Dark-mode design system with glassmorphism, CSS Grid, custom properties |
| **JavaScript (ES6+)** | Financial model engine, DOM manipulation, ES modules |
| **Chart.js 4.4** | Interactive data visualization (8 chart types) |
| **Inter + JetBrains Mono** | Typography (Google Fonts) |

**Zero build tools. Zero dependencies (except Chart.js CDN). Pure vanilla web technologies.**

---

## 📈 Sample Output (Base Case)

| Metric | Value |
|--------|-------|
| Total CAPEX | ₹472 Cr |
| Equity Investment | ₹142 Cr |
| Total Debt | ₹331 Cr |
| Equity IRR | 7.47% |
| Project IRR | 8.66% |
| NPV @ 10% | ₹-41.2 Cr |
| MOIC | 2.83x |
| Payback Period | 16.5 years |
| Min DSCR | 1.03x |
| Avg DSCR | 1.48x |

> **Note**: Returns are highly sensitive to PPA tariff and capacity factor. Increasing tariff to ₹4.00/kWh or CUF to 24% yields Equity IRR > 14%.

---

## 🤝 Contributing

Contributions are welcome! Here are some ideas for extension:

- [ ] Add more infrastructure asset classes (wind, toll roads, data centers)
- [ ] Implement debt sculpting with target DSCR optimization
- [ ] Add foreign exchange risk modeling for cross-border projects
- [ ] Integrate real-time solar irradiance data APIs
- [ ] Add portfolio-level analysis for multiple projects
- [ ] Implement waterfall chart for equity distribution

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built for infrastructure finance professionals and aspiring investment bankers.**

*Meridian Capital — Where Infrastructure Meets Capital Markets*

</div>
