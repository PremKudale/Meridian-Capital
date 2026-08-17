/**
 * Sensitivity Analysis Module
 * Single-variable sensitivity (tornado), two-way data table
 */

import { ModelEngine } from '../model/engine.js';

export class SensitivityAnalysis {
    /**
     * Run single-variable sensitivity analysis (tornado)
     * Varies each key input by ±20% and measures impact on Equity IRR
     * @param {Object} baseAssumptions - Base case assumptions
     * @returns {Object[]} Sensitivity results sorted by impact
     */
    static runTornado(baseAssumptions) {
        const baseResults = ModelEngine.run(baseAssumptions);
        const baseIRR = baseResults.equityIRR;

        const variables = [
            { key: 'capexPerMW', label: 'CAPEX per MW', unit: '₹/MW' },
            { key: 'capacityFactor', label: 'Capacity Factor', unit: '%' },
            { key: 'ppaTariff', label: 'PPA Tariff', unit: '₹/kWh' },
            { key: 'interestRate', label: 'Interest Rate', unit: '%' },
            { key: 'debtRatio', label: 'Debt Ratio', unit: '%' },
            { key: 'omCostPerMW', label: 'O&M Cost/MW', unit: '₹/MW' },
            { key: 'degradationRate', label: 'Degradation Rate', unit: '%' },
            { key: 'inflationRate', label: 'Inflation Rate', unit: '%' },
            { key: 'loanTenor', label: 'Loan Tenor', unit: 'yrs' },
            { key: 'taxRate', label: 'Tax Rate', unit: '%' }
        ];

        const variationPercent = 0.20; // ±20%

        const results = variables.map(variable => {
            const baseValue = baseAssumptions[variable.key];
            if (baseValue === undefined || baseValue === 0) return null;

            // Downside (for CAPEX/interest/opex, higher = worse; for CF/tariff, lower = worse)
            const lowValue = baseValue * (1 - variationPercent);
            const highValue = baseValue * (1 + variationPercent);

            // Calculate IRR for low and high cases
            const lowAssumptions = { ...baseAssumptions, [variable.key]: lowValue };
            const highAssumptions = { ...baseAssumptions, [variable.key]: highValue };

            let irrLow, irrHigh;
            try {
                irrLow = ModelEngine.run(lowAssumptions).equityIRR;
            } catch {
                irrLow = baseIRR;
            }
            try {
                irrHigh = ModelEngine.run(highAssumptions).equityIRR;
            } catch {
                irrHigh = baseIRR;
            }

            const range = Math.abs(irrHigh - irrLow);

            return {
                ...variable,
                baseValue,
                lowValue,
                highValue,
                irrLow,
                irrHigh,
                baseIRR,
                range,
                // Determine which direction is favorable
                irrAtLowInput: irrLow,
                irrAtHighInput: irrHigh
            };
        }).filter(Boolean);

        // Sort by range (highest impact first)
        results.sort((a, b) => b.range - a.range);

        return { baseIRR, results };
    }

    /**
     * Run two-way sensitivity analysis
     * Creates a grid of IRR values for two variable combinations
     * @param {Object} baseAssumptions
     * @param {string} var1Key - First variable key
     * @param {string} var2Key - Second variable key
     * @param {number} steps - Number of steps in each direction
     * @returns {Object} Two-way table data
     */
    static runTwoWay(baseAssumptions, var1Key, var2Key, steps = 5) {
        const base1 = baseAssumptions[var1Key];
        const base2 = baseAssumptions[var2Key];

        // Generate values: ±20% in equal steps
        const range = 0.20;
        const var1Values = [];
        const var2Values = [];

        for (let i = -steps; i <= steps; i++) {
            var1Values.push(base1 * (1 + (i / steps) * range));
            var2Values.push(base2 * (1 + (i / steps) * range));
        }

        // Build grid
        const grid = [];
        for (const v1 of var1Values) {
            const row = [];
            for (const v2 of var2Values) {
                const modified = {
                    ...baseAssumptions,
                    [var1Key]: v1,
                    [var2Key]: v2
                };
                try {
                    const result = ModelEngine.run(modified);
                    row.push(result.equityIRR);
                } catch {
                    row.push(null);
                }
            }
            grid.push(row);
        }

        return {
            var1Key,
            var2Key,
            var1Values,
            var2Values,
            grid,
            baseIRR: ModelEngine.run(baseAssumptions).equityIRR
        };
    }
}
