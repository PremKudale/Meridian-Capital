/**
 * InfraFin Pro — Application Entry Point
 * Orchestrates model calculation, UI updates, and user interactions
 */

import { Assumptions } from './assumptions.js';
import { ModelEngine } from './model/engine.js';
import { ChartManager } from './charts/chartManager.js';
import { SensitivityAnalysis } from './analysis/sensitivity.js';
import { ScenarioManager } from './analysis/scenarios.js';
import { MonteCarloSimulation } from './analysis/montecarlo.js';
import { ExportUtils } from './utils/export.js';
import { Format } from './utils/format.js';

class InfraFinApp {
    constructor() {
        this.chartManager = new ChartManager();
        this.currentResults = null;
        this.currentAssumptions = null;
        this.debounceTimer = null;
        this.activeTab = 'overview';
        this.mcResults = null;
        this.sensitivityResults = null;
        this.scenarioResults = null;
    }

    /**
     * Initialize the application
     */
    init() {
        // Load defaults
        const defaults = Assumptions.getDefaults();
        Assumptions.writeToUI(defaults);
        this.currentAssumptions = defaults;

        // Setup event listeners
        this.setupInputListeners();
        this.setupTabNavigation();
        this.setupActionButtons();
        this.setupSidebarToggle();

        // Run initial model
        this.runModel();

        // Responsive resize
        window.addEventListener('resize', () => {
            this.chartManager.resizeAll();
        });

        console.log('InfraFin Pro initialized successfully');
    }

    /**
     * Setup sidebar input change listeners
     */
    setupInputListeners() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Listen to all inputs
        sidebar.querySelectorAll('input, select').forEach(input => {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                this.debouncedRunModel();
            });
        });

        // Accordion sections
        sidebar.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.parentElement;
                section.classList.toggle('collapsed');
                const icon = header.querySelector('.toggle-icon');
                if (icon) icon.textContent = section.classList.contains('collapsed') ? '▸' : '▾';
            });
        });

        // Reset button
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const defaults = Assumptions.getDefaults();
                Assumptions.writeToUI(defaults);
                this.runModel();
            });
        }
    }

    /**
     * Setup tab navigation
     */
    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    /**
     * Switch active tab
     */
    switchTab(tabName) {
        this.activeTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });

        // Lazy-load analysis tabs
        if (tabName === 'sensitivity' && !this.sensitivityResults) {
            this.runSensitivity();
        }
        if (tabName === 'montecarlo' && !this.mcResults) {
            this.runMonteCarlo();
        }
        if (tabName === 'scenarios' && !this.scenarioResults) {
            this.runScenarios();
        }
        if (tabName === 'summary' && this.currentResults) {
            this.renderExecutiveSummary();
        }

        // Resize charts after tab switch (they may have been hidden)
        setTimeout(() => this.chartManager.resizeAll(), 100);
    }

    /**
     * Setup action buttons (export, print)
     */
    setupActionButtons() {
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (this.currentResults) {
                    ExportUtils.exportToCSV(this.currentResults);
                }
            });
        }

        const printBtn = document.getElementById('btn-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                ExportUtils.printReport();
            });
        }
    }

    /**
     * Setup sidebar toggle for mobile
     */
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }

    /**
     * Debounced model execution
     */
    debouncedRunModel() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.runModel();
        }, 300);
    }

    /**
     * Run the complete financial model
     */
    runModel() {
        try {
            // Show loading state
            this.setLoadingState(true);

            // Read assumptions
            this.currentAssumptions = Assumptions.readFromUI();

            // Validate
            const validation = Assumptions.validate(this.currentAssumptions);
            if (!validation.valid) {
                this.showErrors(validation.errors);
                this.setLoadingState(false);
                return;
            }

            // Run model
            this.currentResults = ModelEngine.run(this.currentAssumptions);

            // Update UI
            this.updateKPICards();
            this.updateProjectInfoBar();
            this.chartManager.updateAll(this.currentResults);
            this.updateCashFlowTable();

            // Reset analysis caches (assumptions changed)
            this.sensitivityResults = null;
            this.mcResults = null;
            this.scenarioResults = null;

            // If on an analysis tab, re-run
            if (this.activeTab === 'sensitivity') this.runSensitivity();
            if (this.activeTab === 'montecarlo') this.runMonteCarlo();
            if (this.activeTab === 'scenarios') this.runScenarios();
            if (this.activeTab === 'summary') this.renderExecutiveSummary();

            this.clearErrors();
        } catch (error) {
            console.error('Model error:', error);
            this.showErrors([`Model calculation error: ${error.message}`]);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Update KPI summary cards
     */
    updateKPICards() {
        const r = this.currentResults;
        if (!r) return;

        // Update each KPI card with animation
        this.animateValue('kpi-equity-irr', r.equityIRR * 100, '%', 2);
        this.animateValue('kpi-project-irr', r.projectIRR * 100, '%', 2);
        this.animateValue('kpi-npv', r.npv / 1e7, ' Cr', 1);
        this.animateValue('kpi-moic', r.moic, 'x', 2);
        this.animateValue('kpi-payback', r.paybackPeriod, ' yrs', 1);
        this.animateValue('kpi-dscr', r.minDSCR, 'x', 2);

        // Color coding
        this.setKPIColor('kpi-equity-irr', r.equityIRR >= 0.14 ? 'positive' : r.equityIRR >= 0.10 ? 'neutral' : 'negative');
        this.setKPIColor('kpi-npv', r.npv > 0 ? 'positive' : 'negative');
        this.setKPIColor('kpi-dscr', r.minDSCR >= 1.3 ? 'positive' : r.minDSCR >= 1.1 ? 'neutral' : 'negative');

        // Additional details
        const capexEl = document.getElementById('kpi-total-capex');
        if (capexEl) capexEl.textContent = `₹${(r.totalCapex / 1e7).toFixed(0)} Cr`;

        const equityEl = document.getElementById('kpi-equity-amount');
        if (equityEl) equityEl.textContent = `₹${(r.equityInvestment / 1e7).toFixed(0)} Cr`;

        const debtEl = document.getElementById('kpi-debt-amount');
        if (debtEl) debtEl.textContent = `₹${(r.totalDebt / 1e7).toFixed(0)} Cr`;
    }

    /**
     * Update project info bar
     */
    updateProjectInfoBar() {
        const a = this.currentAssumptions;
        if (!a) return;

        const set = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        set('info-capacity', `${a.capacity} MW Solar`);
        set('info-life', `${a.projectLife} years`);
        set('info-cuf', `${(a.capacityFactor * 100).toFixed(0)}% CUF`);
        set('info-tariff', `₹${a.ppaTariff.toFixed(2)}/kWh`);
        set('info-de', `${(a.debtRatio * 100).toFixed(0)}:${((1 - a.debtRatio) * 100).toFixed(0)} D:E`);
    }

    /**
     * Animate a KPI value with counting effect
     */
    animateValue(elementId, targetValue, suffix = '', decimals = 2) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const startValue = parseFloat(el.textContent) || 0;
        const duration = 600;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

            const currentValue = startValue + (targetValue - startValue) * eased;
            el.textContent = `${currentValue.toFixed(decimals)}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Set KPI card color class
     */
    setKPIColor(elementId, status) {
        const card = document.getElementById(elementId)?.closest('.kpi-card');
        if (!card) return;
        card.classList.remove('positive', 'neutral', 'negative');
        card.classList.add(status);
    }

    /**
     * Update cash flow table
     */
    updateCashFlowTable() {
        const tbody = document.getElementById('cashflow-tbody');
        if (!tbody || !this.currentResults) return;

        const data = this.currentResults.annualData;
        tbody.innerHTML = data.map(d => `
            <tr>
                <td class="sticky-col">Y${d.year}</td>
                <td>${(d.energyMWh || d.energy).toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                <td class="positive">${(d.revenue / 1e5).toFixed(1)}</td>
                <td class="negative">${(d.totalOpex / 1e5).toFixed(1)}</td>
                <td class="positive">${(d.ebitda / 1e5).toFixed(1)}</td>
                <td class="negative">${(d.debtService / 1e5).toFixed(1)}</td>
                <td>${(d.tax / 1e5).toFixed(1)}</td>
                <td class="${d.fcfe >= 0 ? 'positive' : 'negative'}">${(d.fcfe / 1e5).toFixed(1)}</td>
                <td class="${d.dscr >= 1.2 ? 'positive' : d.dscr >= 1.0 ? 'neutral' : 'negative'}">${isFinite(d.dscr) ? d.dscr.toFixed(2) : '—'}</td>
                <td class="${d.cumulativeFCFE >= 0 ? 'positive' : 'negative'}">${(d.cumulativeFCFE / 1e5).toFixed(1)}</td>
            </tr>
        `).join('');
    }

    /**
     * Run sensitivity analysis
     */
    runSensitivity() {
        if (!this.currentAssumptions) return;

        const loadingEl = document.getElementById('sensitivity-loading');
        if (loadingEl) loadingEl.style.display = 'flex';

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            try {
                this.sensitivityResults = SensitivityAnalysis.runTornado(this.currentAssumptions);
                this.chartManager.updateTornado(this.sensitivityResults);
                this.renderSensitivityTable();
            } catch (e) {
                console.error('Sensitivity analysis error:', e);
            } finally {
                if (loadingEl) loadingEl.style.display = 'none';
            }
        }, 50);
    }

    /**
     * Render sensitivity table
     */
    renderSensitivityTable() {
        const container = document.getElementById('sensitivity-table');
        if (!container || !this.sensitivityResults) return;

        const results = this.sensitivityResults.results;
        const baseIRR = this.sensitivityResults.baseIRR;

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>-20% Value</th>
                        <th>IRR @ -20%</th>
                        <th>Base IRR</th>
                        <th>IRR @ +20%</th>
                        <th>+20% Value</th>
                        <th>Impact Range</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr>
                            <td><strong>${r.label}</strong></td>
                            <td>${this.formatVariableValue(r.key, r.lowValue)}</td>
                            <td class="${r.irrAtLowInput >= baseIRR ? 'positive' : 'negative'}">${(r.irrAtLowInput * 100).toFixed(2)}%</td>
                            <td>${(baseIRR * 100).toFixed(2)}%</td>
                            <td class="${r.irrAtHighInput >= baseIRR ? 'positive' : 'negative'}">${(r.irrAtHighInput * 100).toFixed(2)}%</td>
                            <td>${this.formatVariableValue(r.key, r.highValue)}</td>
                            <td><strong>${(r.range * 100).toFixed(2)}%</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Format variable value for display
     */
    formatVariableValue(key, value) {
        const percentKeys = ['capacityFactor', 'debtRatio', 'interestRate', 'degradationRate', 'inflationRate', 'taxRate'];
        const croreKeys = ['capexPerMW'];
        const lakhKeys = ['omCostPerMW'];

        if (percentKeys.includes(key)) return `${(value * 100).toFixed(2)}%`;
        if (croreKeys.includes(key)) return `₹${(value / 1e7).toFixed(2)} Cr`;
        if (lakhKeys.includes(key)) return `₹${(value / 1e5).toFixed(1)} L`;
        return value.toFixed(1);
    }

    /**
     * Run Monte Carlo simulation
     */
    runMonteCarlo() {
        if (!this.currentAssumptions) return;

        const loadingEl = document.getElementById('mc-loading');
        const progressEl = document.getElementById('mc-progress');
        if (loadingEl) loadingEl.style.display = 'flex';

        setTimeout(() => {
            try {
                this.mcResults = MonteCarloSimulation.run(
                    this.currentAssumptions,
                    1000,
                    (progress) => {
                        if (progressEl) progressEl.textContent = `${progress}%`;
                    }
                );
                this.chartManager.updateMonteCarlo(this.mcResults);
                this.renderMonteCarloStats();
            } catch (e) {
                console.error('Monte Carlo error:', e);
            } finally {
                if (loadingEl) loadingEl.style.display = 'none';
            }
        }, 50);
    }

    /**
     * Render Monte Carlo statistics
     */
    renderMonteCarloStats() {
        const container = document.getElementById('mc-stats');
        if (!container || !this.mcResults) return;

        const s = this.mcResults.stats.equityIRR;
        const p = this.mcResults.probabilities;

        container.innerHTML = `
            <div class="mc-stats-grid">
                <div class="mc-stat-card">
                    <span class="mc-stat-label">Mean IRR</span>
                    <span class="mc-stat-value">${(s.mean * 100).toFixed(2)}%</span>
                </div>
                <div class="mc-stat-card">
                    <span class="mc-stat-label">Median (P50)</span>
                    <span class="mc-stat-value">${(s.p50 * 100).toFixed(2)}%</span>
                </div>
                <div class="mc-stat-card">
                    <span class="mc-stat-label">Std Deviation</span>
                    <span class="mc-stat-value">${(s.stdDev * 100).toFixed(2)}%</span>
                </div>
                <div class="mc-stat-card">
                    <span class="mc-stat-label">P10 (Downside)</span>
                    <span class="mc-stat-value negative">${(s.p10 * 100).toFixed(2)}%</span>
                </div>
                <div class="mc-stat-card">
                    <span class="mc-stat-label">P90 (Upside)</span>
                    <span class="mc-stat-value positive">${(s.p90 * 100).toFixed(2)}%</span>
                </div>
                <div class="mc-stat-card">
                    <span class="mc-stat-label">VaR (95%)</span>
                    <span class="mc-stat-value">${(this.mcResults.var95 * 100).toFixed(2)}%</span>
                </div>
            </div>
            <div class="mc-prob-grid">
                <div class="mc-prob-card">
                    <div class="mc-prob-bar" style="width: ${p.irrAbove12 * 100}%"></div>
                    <span class="mc-prob-label">P(IRR > 12%)</span>
                    <span class="mc-prob-value">${(p.irrAbove12 * 100).toFixed(1)}%</span>
                </div>
                <div class="mc-prob-card">
                    <div class="mc-prob-bar" style="width: ${p.irrAbove14 * 100}%"></div>
                    <span class="mc-prob-label">P(IRR > 14%)</span>
                    <span class="mc-prob-value">${(p.irrAbove14 * 100).toFixed(1)}%</span>
                </div>
                <div class="mc-prob-card">
                    <div class="mc-prob-bar" style="width: ${p.irrAbove16 * 100}%"></div>
                    <span class="mc-prob-label">P(IRR > 16%)</span>
                    <span class="mc-prob-value">${(p.irrAbove16 * 100).toFixed(1)}%</span>
                </div>
                <div class="mc-prob-card">
                    <div class="mc-prob-bar" style="width: ${p.npvPositive * 100}%"></div>
                    <span class="mc-prob-label">P(NPV > 0)</span>
                    <span class="mc-prob-value">${(p.npvPositive * 100).toFixed(1)}%</span>
                </div>
                <div class="mc-prob-card">
                    <div class="mc-prob-bar" style="width: ${p.dscrAbove1_2 * 100}%"></div>
                    <span class="mc-prob-label">P(DSCR > 1.2x)</span>
                    <span class="mc-prob-value">${(p.dscrAbove1_2 * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    /**
     * Run scenario analysis
     */
    runScenarios() {
        if (!this.currentAssumptions) return;

        try {
            this.scenarioResults = ScenarioManager.runAllScenarios(this.currentAssumptions);
            this.renderScenarioComparison();
        } catch (e) {
            console.error('Scenario analysis error:', e);
        }
    }

    /**
     * Render scenario comparison
     */
    renderScenarioComparison() {
        const container = document.getElementById('scenario-comparison');
        if (!container || !this.scenarioResults) return;

        const scenarios = this.scenarioResults;
        const keys = Object.keys(scenarios);

        container.innerHTML = `
            <div class="scenario-cards">
                ${keys.map(key => {
                    const s = scenarios[key];
                    if (s.error) return '';
                    const r = s.results;
                    return `
                        <div class="scenario-card" style="--accent: ${s.color}">
                            <div class="scenario-card-header">
                                <span class="scenario-icon">${s.icon}</span>
                                <h3>${s.name}</h3>
                                <p class="scenario-desc">${s.description}</p>
                            </div>
                            <div class="scenario-metrics">
                                <div class="scenario-metric">
                                    <span class="label">Equity IRR</span>
                                    <span class="value" style="color: ${r.equityIRR >= 0.14 ? '#10b981' : r.equityIRR >= 0.10 ? '#f59e0b' : '#ef4444'}">${(r.equityIRR * 100).toFixed(2)}%</span>
                                </div>
                                <div class="scenario-metric">
                                    <span class="label">NPV</span>
                                    <span class="value">₹${(r.npv / 1e7).toFixed(1)} Cr</span>
                                </div>
                                <div class="scenario-metric">
                                    <span class="label">MOIC</span>
                                    <span class="value">${r.moic.toFixed(2)}x</span>
                                </div>
                                <div class="scenario-metric">
                                    <span class="label">Min DSCR</span>
                                    <span class="value" style="color: ${r.minDSCR >= 1.3 ? '#10b981' : r.minDSCR >= 1.1 ? '#f59e0b' : '#ef4444'}">${r.minDSCR.toFixed(2)}x</span>
                                </div>
                                <div class="scenario-metric">
                                    <span class="label">Payback</span>
                                    <span class="value">${r.paybackPeriod.toFixed(1)} yrs</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render executive summary
     */
    renderExecutiveSummary() {
        const container = document.getElementById('executive-summary-content');
        if (!container || !this.currentResults) return;

        container.innerHTML = ExportUtils.generateExecutiveSummary(
            this.currentResults,
            this.currentAssumptions
        );
    }

    /**
     * Show error messages
     */
    showErrors(errors) {
        const container = document.getElementById('error-container');
        if (!container) return;
        container.innerHTML = errors.map(e => `<div class="error-msg">⚠️ ${e}</div>`).join('');
        container.style.display = 'block';
    }

    /**
     * Clear error messages
     */
    clearErrors() {
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = loading ? 'flex' : 'none';
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InfraFinApp();
    window.app.init();
});
