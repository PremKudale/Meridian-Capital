/**
 * Cash Flow Waterfall Model
 * Assembles the complete project finance cash flow statement
 */

export class CashFlowModel {
    /**
     * Build complete cash flow waterfall
     * @param {Object[]} revenueData - Annual revenue data
     * @param {Object[]} opexData - Annual OPEX data
     * @param {Object[]} debtData - Annual debt schedule data
     * @param {Object[]} taxData - Annual depreciation/tax data
     * @param {Object} constructionData - Construction results
     * @param {Object} assumptions - Model assumptions
     * @returns {Object} Complete cash flow model
     */
    static calculate(revenueData, opexData, debtData, taxData, constructionData, assumptions) {
        const { projectLife } = assumptions;
        const annualData = [];
        let cumulativeFCFE = 0;
        let cumulativeProjectCF = 0;

        // Equity investment cash flows for IRR calculation
        const equityCashFlows = [-constructionData.totalProjectCost * (1 - assumptions.debtRatio)];
        const projectCashFlows = [-constructionData.totalProjectCost];

        for (let year = 1; year <= projectLife; year++) {
            const rev = revenueData[year - 1] || {};
            const opex = opexData[year - 1] || {};
            const debt = debtData[year - 1] || {};
            const tax = taxData[year - 1] || {};

            const revenue = rev.revenue || 0;
            const totalOpex = opex.totalOpex || 0;
            const ebitda = revenue - totalOpex;

            const depreciation = tax.depreciation || 0;
            const interest = debt.interest || 0;
            const principalRepayment = debt.principalRepayment || 0;
            const debtService = debt.debtService || 0;
            const actualTax = tax.actualTax || 0;

            // Cash Flow Available for Debt Service (CFADS)
            const cfads = ebitda; // Pre-tax, pre-debt service

            // Free Cash Flow to Equity
            const fcfe = ebitda - debtService - actualTax;

            // Project-level free cash flow (pre-leverage)
            const projectFCF = ebitda - actualTax;

            cumulativeFCFE += fcfe;
            cumulativeProjectCF += projectFCF;

            equityCashFlows.push(fcfe);
            projectCashFlows.push(projectFCF);

            annualData.push({
                year,
                // Revenue
                energy: rev.energyMWh || 0,
                energyKWh: rev.energyKWh || 0,
                tariff: rev.tariff || 0,
                revenue,
                isPPA: rev.isPPA,
                // OPEX
                omCost: opex.omCost || 0,
                insurance: opex.insurance || 0,
                landLease: opex.landLease || 0,
                admin: opex.admin || 0,
                totalOpex,
                // Profitability
                ebitda,
                ebitdaMargin: revenue > 0 ? ebitda / revenue : 0,
                depreciation,
                pbt: tax.pbt || 0,
                tax: actualTax,
                pat: tax.pat || 0,
                // Debt
                interest,
                principalRepayment,
                debtService,
                openingDebt: debt.openingBalance || 0,
                closingDebt: debt.closingBalance || 0,
                // Coverage
                cfads,
                dscr: debt.dscr || 0,
                dsraRequired: debt.dsraRequired || 0,
                // Cash Flows
                fcfe,
                cumulativeFCFE,
                projectFCF,
                cumulativeProjectCF,
                // Tax detail
                isMAT: tax.isMAT || false,
                carryForwardLoss: tax.carryForwardLoss || 0
            });
        }

        return {
            annualData,
            equityCashFlows,
            projectCashFlows,
            totalRevenue: annualData.reduce((s, d) => s + d.revenue, 0),
            totalOpex: annualData.reduce((s, d) => s + d.totalOpex, 0),
            totalEBITDA: annualData.reduce((s, d) => s + d.ebitda, 0),
            totalDebtService: annualData.reduce((s, d) => s + d.debtService, 0),
            totalTax: annualData.reduce((s, d) => s + d.tax, 0),
            totalFCFE: annualData.reduce((s, d) => s + d.fcfe, 0)
        };
    }
}
