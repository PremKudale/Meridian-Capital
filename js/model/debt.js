/**
 * Debt Schedule Model
 * Loan repayment, interest calculation, DSCR, LLCR, PLCR
 */

import { Financial } from '../utils/financial.js';

export class DebtModel {
    /**
     * Calculate debt schedule
     * @param {Object} assumptions
     * @param {number} totalProjectCost - Total project cost including IDC
     * @param {Object[]} cfadsData - Array of {year, cfads} — Cash Flow Available for Debt Service
     * @returns {Object} Debt schedule and coverage ratios
     */
    static calculate(assumptions, totalProjectCost, cfadsData) {
        const {
            debtRatio,          // Debt as decimal (e.g., 0.70)
            interestRate,       // Annual interest rate (decimal)
            loanTenor,          // Years
            dsraMonths,         // Months of debt service reserve
            repaymentType,      // 'annuity' or 'sculpted'
            projectLife         // Years
        } = assumptions;

        const totalDebt = totalProjectCost * debtRatio;
        const equityInvestment = totalProjectCost * (1 - debtRatio);
        const annualData = [];

        let openingBalance = totalDebt;

        if (repaymentType === 'sculpted') {
            return this._calculateSculpted(assumptions, totalDebt, equityInvestment, cfadsData);
        }

        // Annuity repayment
        const annuity = Financial.calcPMT(interestRate, loanTenor, totalDebt);

        for (let year = 1; year <= projectLife; year++) {
            const interest = year <= loanTenor ? openingBalance * interestRate : 0;
            const principalRepayment = year <= loanTenor ? Math.min(annuity - interest, openingBalance) : 0;
            const debtService = interest + principalRepayment;
            const closingBalance = Math.max(0, openingBalance - principalRepayment);

            // CFADS for this year
            const cfads = cfadsData[year - 1]?.cfads || 0;
            const dscr = debtService > 0 ? cfads / debtService : Infinity;

            // DSRA
            const nextYearDS = year < loanTenor ? annuity : 0;
            const dsraRequired = nextYearDS * (dsraMonths / 12);

            annualData.push({
                year,
                openingBalance,
                interest,
                principalRepayment,
                debtService,
                closingBalance,
                cfads,
                dscr,
                dsraRequired,
                isDebtYear: year <= loanTenor
            });

            openingBalance = closingBalance;
        }

        // Calculate aggregate metrics
        const debtYears = annualData.filter(d => d.isDebtYear && d.debtService > 0);
        const dscrValues = debtYears.map(d => d.dscr).filter(d => isFinite(d));
        const minDSCR = dscrValues.length > 0 ? Math.min(...dscrValues) : 0;
        const avgDSCR = dscrValues.length > 0 ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length : 0;

        // LLCR — NPV of remaining CFADS / Outstanding Debt at each point
        const llcrAtStart = this._calcLLCR(cfadsData.slice(0, loanTenor), interestRate, totalDebt);

        return {
            totalDebt,
            equityInvestment,
            annualData,
            minDSCR,
            avgDSCR,
            llcr: llcrAtStart,
            annuity,
            repaymentType: 'annuity'
        };
    }

    /**
     * Sculpted repayment — principal sized to maintain target DSCR
     */
    static _calculateSculpted(assumptions, totalDebt, equityInvestment, cfadsData) {
        const {
            interestRate,
            loanTenor,
            dsraMonths,
            projectLife
        } = assumptions;

        const targetDSCR = 1.30; // Target DSCR for sculpting
        const annualData = [];
        let openingBalance = totalDebt;
        let totalPrincipalScheduled = 0;

        // First pass: calculate sculpted principal
        const sculptedPrincipals = [];
        let tempBalance = totalDebt;

        for (let year = 1; year <= loanTenor; year++) {
            const interest = tempBalance * interestRate;
            const cfads = cfadsData[year - 1]?.cfads || 0;
            const maxDebtService = cfads / targetDSCR;
            const principal = Math.max(0, Math.min(maxDebtService - interest, tempBalance));
            sculptedPrincipals.push(principal);
            totalPrincipalScheduled += principal;
            tempBalance -= principal;
        }

        // Scale principals to ensure full repayment
        const scaleFactor = totalDebt / (totalPrincipalScheduled || 1);
        openingBalance = totalDebt;

        for (let year = 1; year <= projectLife; year++) {
            const interest = year <= loanTenor ? openingBalance * interestRate : 0;
            let principalRepayment = 0;

            if (year <= loanTenor) {
                principalRepayment = Math.min(sculptedPrincipals[year - 1] * scaleFactor, openingBalance);
            }

            const debtService = interest + principalRepayment;
            const closingBalance = Math.max(0, openingBalance - principalRepayment);
            const cfads = cfadsData[year - 1]?.cfads || 0;
            const dscr = debtService > 0 ? cfads / debtService : Infinity;

            const nextYearDS = year < loanTenor
                ? (closingBalance * interestRate + (sculptedPrincipals[year]?.valueOf() || 0) * scaleFactor)
                : 0;
            const dsraRequired = nextYearDS * (dsraMonths / 12);

            annualData.push({
                year,
                openingBalance,
                interest,
                principalRepayment,
                debtService,
                closingBalance,
                cfads,
                dscr,
                dsraRequired,
                isDebtYear: year <= loanTenor
            });

            openingBalance = closingBalance;
        }

        const debtYears = annualData.filter(d => d.isDebtYear && d.debtService > 0);
        const dscrValues = debtYears.map(d => d.dscr).filter(d => isFinite(d));
        const minDSCR = dscrValues.length > 0 ? Math.min(...dscrValues) : 0;
        const avgDSCR = dscrValues.length > 0 ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length : 0;
        const llcrAtStart = this._calcLLCR(cfadsData.slice(0, loanTenor), interestRate, totalDebt);

        return {
            totalDebt,
            equityInvestment,
            annualData,
            minDSCR,
            avgDSCR,
            llcr: llcrAtStart,
            annuity: null,
            repaymentType: 'sculpted'
        };
    }

    /**
     * Calculate LLCR
     */
    static _calcLLCR(cfadsArray, discountRate, outstandingDebt) {
        if (outstandingDebt === 0) return Infinity;
        const cfads = cfadsArray.map(d => d.cfads || 0);
        const npv = Financial.calcNPV(discountRate, [0, ...cfads]);
        return npv / outstandingDebt;
    }
}
