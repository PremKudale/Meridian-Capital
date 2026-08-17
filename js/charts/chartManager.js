/**
 * Chart Manager
 * Manages Chart.js instance lifecycle, creation, updates, and disposal
 */

import { ChartConfigs, ChartTheme } from './chartConfigs.js';

export class ChartManager {
    constructor() {
        this.charts = new Map();
    }

    /**
     * Create or update a chart
     * @param {string} canvasId - Canvas element ID
     * @param {Object} config - Chart.js configuration
     * @returns {Chart} Chart instance
     */
    createOrUpdate(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas element '${canvasId}' not found`);
            return null;
        }

        // Destroy existing chart on this canvas
        if (this.charts.has(canvasId)) {
            this.charts.get(canvasId).destroy();
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Update all charts with new model results
     * @param {Object} modelResults - Complete model results
     */
    updateAll(modelResults) {
        const { annualData, construction, debtResults } = modelResults;

        // 1. Revenue & EBITDA Trend
        this.createOrUpdate('chart-revenue-ebitda',
            ChartConfigs.revenueEBITDA(annualData)
        );

        // 2. Cash Flow Waterfall
        this.createOrUpdate('chart-cashflow-waterfall',
            ChartConfigs.cashFlowWaterfall(annualData)
        );

        // 3. CAPEX Breakdown
        this.createOrUpdate('chart-capex-breakdown',
            ChartConfigs.capexBreakdown(construction.capexBreakdown)
        );

        // 4. Debt Service Profile
        this.createOrUpdate('chart-debt-profile',
            ChartConfigs.debtProfile(debtResults.annualData)
        );

        // 5. DSCR Timeline (Overview tab)
        this.createOrUpdate('chart-dscr',
            ChartConfigs.dscrTimeline(debtResults.annualData)
        );

        // 5b. DSCR Timeline (Debt tab duplicate)
        this.createOrUpdate('chart-dscr-debt',
            ChartConfigs.dscrTimeline(debtResults.annualData)
        );

        // 6. Cumulative Cash Flow
        this.createOrUpdate('chart-cumulative-cf',
            ChartConfigs.cumulativeCashFlow(annualData)
        );
    }

    /**
     * Update tornado chart
     * @param {Object} sensitivityData - From SensitivityAnalysis.runTornado()
     */
    updateTornado(sensitivityData) {
        this.createOrUpdate('chart-tornado',
            ChartConfigs.tornado(sensitivityData)
        );
    }

    /**
     * Update Monte Carlo histogram
     * @param {Object} mcResults - From MonteCarloSimulation.run()
     */
    updateMonteCarlo(mcResults) {
        this.createOrUpdate('chart-montecarlo',
            ChartConfigs.monteCarloHistogram(mcResults.histogram, mcResults.stats)
        );
    }

    /**
     * Destroy all chart instances
     */
    destroyAll() {
        for (const [id, chart] of this.charts) {
            chart.destroy();
        }
        this.charts.clear();
    }

    /**
     * Resize all charts (call on window resize)
     */
    resizeAll() {
        for (const [id, chart] of this.charts) {
            chart.resize();
        }
    }
}
