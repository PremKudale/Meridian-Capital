/**
 * Monte Carlo Simulation
 * Probabilistic analysis with randomized inputs
 */

import { ModelEngine } from '../model/engine.js';
import { Financial } from '../utils/financial.js';

export class MonteCarloSimulation {
    /**
     * Run Monte Carlo simulation
     * @param {Object} baseAssumptions - Base case assumptions
     * @param {number} iterations - Number of iterations (default 1000)
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Object} Simulation results
     */
    static run(baseAssumptions, iterations = 1000, progressCallback = null) {
        const results = [];
        const errors = [];

        // Define stochastic variables with their distributions
        const stochasticVars = [
            {
                key: 'capacityFactor',
                mean: baseAssumptions.capacityFactor,
                stdDev: baseAssumptions.capacityFactor * 0.08, // ±8% std dev
                min: baseAssumptions.capacityFactor * 0.75,
                max: baseAssumptions.capacityFactor * 1.25
            },
            {
                key: 'capexPerMW',
                mean: baseAssumptions.capexPerMW,
                stdDev: baseAssumptions.capexPerMW * 0.06,
                min: baseAssumptions.capexPerMW * 0.85,
                max: baseAssumptions.capexPerMW * 1.20
            },
            {
                key: 'ppaTariff',
                mean: baseAssumptions.ppaTariff,
                stdDev: baseAssumptions.ppaTariff * 0.05,
                min: baseAssumptions.ppaTariff * 0.85,
                max: baseAssumptions.ppaTariff * 1.15
            },
            {
                key: 'omCostPerMW',
                mean: baseAssumptions.omCostPerMW,
                stdDev: baseAssumptions.omCostPerMW * 0.10,
                min: baseAssumptions.omCostPerMW * 0.80,
                max: baseAssumptions.omCostPerMW * 1.30
            },
            {
                key: 'interestRate',
                mean: baseAssumptions.interestRate,
                stdDev: 0.008, // ±80bps
                min: baseAssumptions.interestRate - 0.02,
                max: baseAssumptions.interestRate + 0.03
            },
            {
                key: 'degradationRate',
                mean: baseAssumptions.degradationRate,
                stdDev: baseAssumptions.degradationRate * 0.20,
                min: 0.001,
                max: baseAssumptions.degradationRate * 2.0
            }
        ];

        for (let i = 0; i < iterations; i++) {
            // Randomize assumptions
            const randomized = { ...baseAssumptions };

            for (const v of stochasticVars) {
                let value = Financial.randomNormal(v.mean, v.stdDev);
                value = Math.max(v.min, Math.min(v.max, value)); // Clamp
                randomized[v.key] = value;
            }

            try {
                const modelResult = ModelEngine.run(randomized);
                results.push({
                    iteration: i + 1,
                    equityIRR: modelResult.equityIRR,
                    projectIRR: modelResult.projectIRR,
                    npv: modelResult.npv,
                    moic: modelResult.moic,
                    minDSCR: modelResult.minDSCR,
                    paybackPeriod: modelResult.paybackPeriod,
                    inputs: {
                        capacityFactor: randomized.capacityFactor,
                        capexPerMW: randomized.capexPerMW,
                        ppaTariff: randomized.ppaTariff,
                        omCostPerMW: randomized.omCostPerMW,
                        interestRate: randomized.interestRate,
                        degradationRate: randomized.degradationRate
                    }
                });
            } catch (e) {
                errors.push({ iteration: i + 1, error: e.message });
            }

            // Progress callback
            if (progressCallback && i % 50 === 0) {
                progressCallback(Math.round((i / iterations) * 100));
            }
        }

        // Sort results for percentile calculations
        const sortedIRR = results.map(r => r.equityIRR).sort((a, b) => a - b);
        const sortedNPV = results.map(r => r.npv).sort((a, b) => a - b);
        const sortedDSCR = results.map(r => r.minDSCR).sort((a, b) => a - b);

        // Statistics
        const stats = {
            equityIRR: this._calcStats(sortedIRR),
            npv: this._calcStats(sortedNPV),
            minDSCR: this._calcStats(sortedDSCR),
            iterations: results.length,
            errors: errors.length
        };

        // Histogram data for equity IRR
        const histogram = this._buildHistogram(sortedIRR, 30);

        // Value at Risk
        const var95 = Financial.calcPercentile(sortedIRR, 5); // 5th percentile
        const var99 = Financial.calcPercentile(sortedIRR, 1); // 1st percentile

        // Probability of IRR > threshold
        const probIRRAbove12 = sortedIRR.filter(irr => irr > 0.12).length / sortedIRR.length;
        const probIRRAbove14 = sortedIRR.filter(irr => irr > 0.14).length / sortedIRR.length;
        const probIRRAbove16 = sortedIRR.filter(irr => irr > 0.16).length / sortedIRR.length;
        const probNPVPositive = sortedNPV.filter(npv => npv > 0).length / sortedNPV.length;
        const probDSCRAbove1_2 = sortedDSCR.filter(d => d > 1.2).length / sortedDSCR.length;

        return {
            results,
            stats,
            histogram,
            var95,
            var99,
            probabilities: {
                irrAbove12: probIRRAbove12,
                irrAbove14: probIRRAbove14,
                irrAbove16: probIRRAbove16,
                npvPositive: probNPVPositive,
                dscrAbove1_2: probDSCRAbove1_2
            },
            stochasticVars
        };
    }

    /**
     * Calculate descriptive statistics
     * @param {number[]} sortedValues
     * @returns {Object}
     */
    static _calcStats(sortedValues) {
        if (sortedValues.length === 0) return {};

        const n = sortedValues.length;
        const mean = sortedValues.reduce((a, b) => a + b, 0) / n;
        const variance = sortedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);

        return {
            mean,
            median: Financial.calcPercentile(sortedValues, 50),
            stdDev,
            min: sortedValues[0],
            max: sortedValues[n - 1],
            p5: Financial.calcPercentile(sortedValues, 5),
            p10: Financial.calcPercentile(sortedValues, 10),
            p25: Financial.calcPercentile(sortedValues, 25),
            p50: Financial.calcPercentile(sortedValues, 50),
            p75: Financial.calcPercentile(sortedValues, 75),
            p90: Financial.calcPercentile(sortedValues, 90),
            p95: Financial.calcPercentile(sortedValues, 95)
        };
    }

    /**
     * Build histogram bins
     * @param {number[]} sortedValues
     * @param {number} numBins
     * @returns {Object[]}
     */
    static _buildHistogram(sortedValues, numBins = 30) {
        if (sortedValues.length === 0) return [];

        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        const binWidth = (max - min) / numBins;

        const bins = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = binStart + binWidth;
            const count = sortedValues.filter(v => v >= binStart && (i === numBins - 1 ? v <= binEnd : v < binEnd)).length;
            bins.push({
                binStart,
                binEnd,
                binMid: (binStart + binEnd) / 2,
                count,
                frequency: count / sortedValues.length
            });
        }

        return bins;
    }
}
