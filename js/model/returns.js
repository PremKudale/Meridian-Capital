/**
 * Returns Calculation Module
 * IRR, NPV, MOIC, Payback Period computations
 */

import { Financial } from '../utils/financial.js';

export class ReturnsModel {
    /**
     * Calculate all return metrics
     * @param {Object} cashFlowResults - Results from CashFlowModel
     * @param {Object} constructionData - Construction results
     * @param {Object} debtResults - Results from DebtModel
     * @param {Object} assumptions - Model assumptions
     * @returns {Object} Return metrics
     */
    static calculate(cashFlowResults, constructionData, debtResults, assumptions) {
        const { equityCashFlows, projectCashFlows, annualData } = cashFlowResults;
        const { totalProjectCost } = constructionData;
        const { equityInvestment } = debtResults;

        // Project IRR (pre-leverage, pre-tax)
        const projectIRR = Financial.calcIRR(projectCashFlows) || 0;

        // Equity IRR (post-leverage, post-tax)
        const equityIRR = Financial.calcIRR(equityCashFlows) || 0;

        // NPV at discount rate
        const discountRate = assumptions.discountRate || Financial.calcWACC(
            1 - assumptions.debtRatio,
            assumptions.costOfEquity || 0.14,
            assumptions.debtRatio,
            assumptions.interestRate,
            assumptions.taxRate
        );
        const npv = Financial.calcNPV(discountRate, projectCashFlows);

        // MOIC
        const totalDistributions = annualData.reduce((sum, d) => sum + Math.max(0, d.fcfe), 0);
        const moic = Financial.calcMOIC(totalDistributions, equityInvestment);

        // Payback Period
        const positiveFCFE = annualData.map(d => d.fcfe);
        const paybackPeriod = Financial.calcPaybackPeriod(equityInvestment, positiveFCFE);

        // Discounted Payback
        const discountedPayback = Financial.calcDiscountedPaybackPeriod(
            equityInvestment, positiveFCFE, discountRate
        );

        return {
            projectIRR,
            equityIRR,
            npv,
            moic,
            paybackPeriod,
            discountedPayback,
            discountRate,
            equityInvestment,
            totalDistributions,
            totalProjectCost
        };
    }
}
