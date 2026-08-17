/**
 * Scenario Manager
 * Base / Bull / Bear case management and comparison
 */

import { ModelEngine } from '../model/engine.js';

export class ScenarioManager {
    /**
     * Get predefined scenarios
     * @param {Object} baseAssumptions - Base case assumptions
     * @returns {Object} Scenario definitions
     */
    static getScenarios(baseAssumptions) {
        return {
            base: {
                name: 'Base Case',
                description: 'Management case with P50 assumptions',
                icon: '📊',
                color: '#3b82f6',
                overrides: {} // Uses base assumptions as-is
            },
            bull: {
                name: 'Bull Case',
                description: 'Upside scenario: higher CUF, lower CAPEX, favorable financing',
                icon: '🚀',
                color: '#10b981',
                overrides: {
                    capacityFactor: baseAssumptions.capacityFactor * 1.10,     // +10% CUF
                    capexPerMW: baseAssumptions.capexPerMW * 0.95,            // -5% CAPEX
                    ppaTariff: baseAssumptions.ppaTariff * 1.05,              // +5% tariff
                    interestRate: baseAssumptions.interestRate - 0.005,        // -50bps interest
                    omCostPerMW: baseAssumptions.omCostPerMW * 0.95,          // -5% O&M
                    degradationRate: baseAssumptions.degradationRate * 0.80    // 20% less degradation
                }
            },
            bear: {
                name: 'Bear Case',
                description: 'Downside scenario: lower CUF, higher costs, adverse conditions',
                icon: '⚠️',
                color: '#ef4444',
                overrides: {
                    capacityFactor: baseAssumptions.capacityFactor * 0.90,     // -10% CUF
                    capexPerMW: baseAssumptions.capexPerMW * 1.08,            // +8% CAPEX
                    ppaTariff: baseAssumptions.ppaTariff * 0.97,              // -3% tariff
                    interestRate: baseAssumptions.interestRate + 0.010,        // +100bps interest
                    omCostPerMW: baseAssumptions.omCostPerMW * 1.10,          // +10% O&M
                    degradationRate: baseAssumptions.degradationRate * 1.20    // 20% more degradation
                }
            },
            stress: {
                name: 'Stress Case',
                description: 'Extreme downside: severe underperformance across all parameters',
                icon: '🔴',
                color: '#dc2626',
                overrides: {
                    capacityFactor: baseAssumptions.capacityFactor * 0.82,     // -18% CUF
                    capexPerMW: baseAssumptions.capexPerMW * 1.15,            // +15% CAPEX
                    ppaTariff: baseAssumptions.ppaTariff * 0.95,              // -5% tariff
                    interestRate: baseAssumptions.interestRate + 0.020,        // +200bps interest
                    omCostPerMW: baseAssumptions.omCostPerMW * 1.15,          // +15% O&M
                    degradationRate: baseAssumptions.degradationRate * 1.50    // 50% more degradation
                }
            }
        };
    }

    /**
     * Run all scenarios and return comparison
     * @param {Object} baseAssumptions
     * @returns {Object} Scenario comparison results
     */
    static runAllScenarios(baseAssumptions) {
        const scenarios = this.getScenarios(baseAssumptions);
        const results = {};

        for (const [key, scenario] of Object.entries(scenarios)) {
            const modifiedAssumptions = {
                ...baseAssumptions,
                ...scenario.overrides
            };

            try {
                const modelResults = ModelEngine.run(modifiedAssumptions);
                results[key] = {
                    ...scenario,
                    assumptions: modifiedAssumptions,
                    results: {
                        equityIRR: modelResults.equityIRR,
                        projectIRR: modelResults.projectIRR,
                        npv: modelResults.npv,
                        moic: modelResults.moic,
                        paybackPeriod: modelResults.paybackPeriod,
                        minDSCR: modelResults.minDSCR,
                        avgDSCR: modelResults.avgDSCR,
                        totalCapex: modelResults.totalCapex,
                        equityInvestment: modelResults.equityInvestment,
                        totalFCFE: modelResults.totalFCFE
                    }
                };
            } catch (e) {
                results[key] = {
                    ...scenario,
                    error: e.message
                };
            }
        }

        return results;
    }

    /**
     * Generate comparison table data
     * @param {Object} scenarioResults - Results from runAllScenarios
     * @returns {Object[]} Rows for comparison table
     */
    static getComparisonTable(scenarioResults) {
        const metrics = [
            { key: 'equityIRR', label: 'Equity IRR', format: 'percent' },
            { key: 'projectIRR', label: 'Project IRR', format: 'percent' },
            { key: 'npv', label: 'NPV', format: 'crores' },
            { key: 'moic', label: 'MOIC', format: 'multiple' },
            { key: 'paybackPeriod', label: 'Payback Period', format: 'years' },
            { key: 'minDSCR', label: 'Min DSCR', format: 'multiple' },
            { key: 'avgDSCR', label: 'Avg DSCR', format: 'multiple' },
            { key: 'totalCapex', label: 'Total CAPEX', format: 'crores' },
            { key: 'totalFCFE', label: 'Total FCFE', format: 'crores' }
        ];

        return metrics.map(metric => {
            const row = { metric: metric.label, format: metric.format };
            for (const [scenarioKey, scenario] of Object.entries(scenarioResults)) {
                row[scenarioKey] = scenario.results?.[metric.key] ?? null;
            }
            return row;
        });
    }
}
