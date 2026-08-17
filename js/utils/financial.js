/**
 * Financial Mathematics Utilities
 * Core financial functions for project finance modeling
 */

export const Financial = {
    /**
     * Calculate Net Present Value (NPV)
     * @param {number} rate - Discount rate (decimal)
     * @param {number[]} cashFlows - Array of cash flows (CF0, CF1, CF2, ...)
     * @returns {number} NPV
     */
    calcNPV(rate, cashFlows) {
        return cashFlows.reduce((npv, cf, t) => {
            return npv + cf / Math.pow(1 + rate, t);
        }, 0);
    },

    /**
     * Calculate Internal Rate of Return using Newton-Raphson method
     * @param {number[]} cashFlows - Array of cash flows (CF0 should be negative)
     * @param {number} guess - Initial guess (default 0.1 = 10%)
     * @param {number} tolerance - Convergence tolerance
     * @param {number} maxIterations - Maximum iterations
     * @returns {number|null} IRR as decimal, or null if doesn't converge
     */
    calcIRR(cashFlows, guess = 0.1, tolerance = 1e-7, maxIterations = 1000) {
        // Validate inputs
        if (!cashFlows || cashFlows.length < 2) return null;
        
        // Check if there's at least one sign change
        let hasPositive = false;
        let hasNegative = false;
        for (const cf of cashFlows) {
            if (cf > 0) hasPositive = true;
            if (cf < 0) hasNegative = true;
        }
        if (!hasPositive || !hasNegative) return null;

        let rate = guess;

        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0; // derivative of NPV with respect to rate

            for (let t = 0; t < cashFlows.length; t++) {
                const denominator = Math.pow(1 + rate, t);
                npv += cashFlows[t] / denominator;
                if (t > 0) {
                    dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
                }
            }

            if (Math.abs(dnpv) < 1e-14) {
                // Derivative too small, try bisection fallback
                return this._calcIRRBisection(cashFlows, tolerance, maxIterations);
            }

            const newRate = rate - npv / dnpv;

            if (Math.abs(newRate - rate) < tolerance) {
                return newRate;
            }

            rate = newRate;

            // Guard against divergence
            if (rate < -0.99 || rate > 100) {
                return this._calcIRRBisection(cashFlows, tolerance, maxIterations);
            }
        }

        // Fall back to bisection if Newton-Raphson doesn't converge
        return this._calcIRRBisection(cashFlows, tolerance, maxIterations);
    },

    /**
     * Bisection method fallback for IRR calculation
     */
    _calcIRRBisection(cashFlows, tolerance = 1e-7, maxIterations = 1000) {
        let low = -0.5;
        let high = 5.0;

        for (let i = 0; i < maxIterations; i++) {
            const mid = (low + high) / 2;
            const npvMid = this.calcNPV(mid, cashFlows);

            if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
                return mid;
            }

            const npvLow = this.calcNPV(low, cashFlows);
            if (npvLow * npvMid < 0) {
                high = mid;
            } else {
                low = mid;
            }
        }

        return null;
    },

    /**
     * Calculate Debt Service Coverage Ratio
     * @param {number} cashAvailableForDebtService - CFADS
     * @param {number} debtService - Total debt service (principal + interest)
     * @returns {number} DSCR
     */
    calcDSCR(cashAvailableForDebtService, debtService) {
        if (debtService === 0) return Infinity;
        return cashAvailableForDebtService / debtService;
    },

    /**
     * Calculate Loan Life Coverage Ratio
     * @param {number[]} cfads - Array of future CFADS
     * @param {number} discountRate - Discount rate
     * @param {number} outstandingDebt - Current outstanding debt
     * @returns {number} LLCR
     */
    calcLLCR(cfads, discountRate, outstandingDebt) {
        if (outstandingDebt === 0) return Infinity;
        const npvCFADS = this.calcNPV(discountRate, [0, ...cfads]);
        return npvCFADS / outstandingDebt;
    },

    /**
     * Calculate Project Life Coverage Ratio
     * @param {number[]} cfads - Array of all future CFADS through project life
     * @param {number} discountRate - Discount rate
     * @param {number} outstandingDebt - Current outstanding debt
     * @returns {number} PLCR
     */
    calcPLCR(cfads, discountRate, outstandingDebt) {
        if (outstandingDebt === 0) return Infinity;
        const npvCFADS = this.calcNPV(discountRate, [0, ...cfads]);
        return npvCFADS / outstandingDebt;
    },

    /**
     * Calculate Weighted Average Cost of Capital
     * @param {number} equityWeight - Equity proportion (decimal)
     * @param {number} costOfEquity - Cost of equity (decimal)
     * @param {number} debtWeight - Debt proportion (decimal)
     * @param {number} costOfDebt - Pre-tax cost of debt (decimal)
     * @param {number} taxRate - Corporate tax rate (decimal)
     * @returns {number} WACC
     */
    calcWACC(equityWeight, costOfEquity, debtWeight, costOfDebt, taxRate) {
        return (equityWeight * costOfEquity) + (debtWeight * costOfDebt * (1 - taxRate));
    },

    /**
     * Calculate Simple Payback Period
     * @param {number} initialInvestment - Total investment (positive number)
     * @param {number[]} cashFlows - Annual cash flows (positive)
     * @returns {number} Payback period in years
     */
    calcPaybackPeriod(initialInvestment, cashFlows) {
        let cumulative = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            cumulative += cashFlows[i];
            if (cumulative >= initialInvestment) {
                // Interpolate within the year
                const excessInPreviousYears = cumulative - cashFlows[i];
                const remainingAtStartOfYear = initialInvestment - excessInPreviousYears;
                return i + (remainingAtStartOfYear / cashFlows[i]);
            }
        }
        return Infinity; // Never pays back
    },

    /**
     * Calculate Discounted Payback Period
     * @param {number} initialInvestment - Total investment (positive number)
     * @param {number[]} cashFlows - Annual cash flows (positive)
     * @param {number} discountRate - Discount rate (decimal)
     * @returns {number} Discounted payback period in years
     */
    calcDiscountedPaybackPeriod(initialInvestment, cashFlows, discountRate) {
        let cumulative = 0;
        for (let i = 0; i < cashFlows.length; i++) {
            const discountedCF = cashFlows[i] / Math.pow(1 + discountRate, i + 1);
            cumulative += discountedCF;
            if (cumulative >= initialInvestment) {
                const excessInPreviousYears = cumulative - discountedCF;
                const remainingAtStartOfYear = initialInvestment - excessInPreviousYears;
                return i + (remainingAtStartOfYear / discountedCF);
            }
        }
        return Infinity;
    },

    /**
     * Calculate MOIC (Multiple on Invested Capital)
     * @param {number} totalDistributions - Total cash returned to equity
     * @param {number} totalInvested - Total equity invested
     * @returns {number} MOIC
     */
    calcMOIC(totalDistributions, totalInvested) {
        if (totalInvested === 0) return 0;
        return totalDistributions / totalInvested;
    },

    /**
     * Calculate annuity payment (PMT equivalent)
     * @param {number} rate - Interest rate per period
     * @param {number} nper - Number of periods
     * @param {number} pv - Present value (loan amount, positive)
     * @returns {number} Payment per period (positive)
     */
    calcPMT(rate, nper, pv) {
        if (rate === 0) return pv / nper;
        const factor = Math.pow(1 + rate, nper);
        return pv * (rate * factor) / (factor - 1);
    },

    /**
     * Generate random number from normal distribution (Box-Muller transform)
     * @param {number} mean
     * @param {number} stdDev
     * @returns {number}
     */
    randomNormal(mean = 0, stdDev = 1) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return z0 * stdDev + mean;
    },

    /**
     * Calculate percentile from sorted array
     * @param {number[]} sortedArr - Sorted array of values
     * @param {number} percentile - Percentile (0-100)
     * @returns {number}
     */
    calcPercentile(sortedArr, percentile) {
        const index = (percentile / 100) * (sortedArr.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return sortedArr[lower];
        const fraction = index - lower;
        return sortedArr[lower] * (1 - fraction) + sortedArr[upper] * fraction;
    }
};
