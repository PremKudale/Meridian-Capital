/**
 * Financial Model Engine
 * Central orchestrator that runs the complete project finance model
 */

import { ConstructionModel } from './construction.js';
import { RevenueModel } from './revenue.js';
import { OpexModel } from './opex.js';
import { DepreciationModel } from './depreciation.js';
import { DebtModel } from './debt.js';
import { CashFlowModel } from './cashflow.js';
import { ReturnsModel } from './returns.js';

export class ModelEngine {
    /**
     * Run the complete financial model
     * @param {Object} assumptions - All model assumptions
     * @returns {Object} Complete model results
     */
    static run(assumptions) {
        // Step 1: Construction & CAPEX
        const construction = ConstructionModel.calculate(assumptions);

        // Update assumptions with computed total CAPEX
        const enrichedAssumptions = {
            ...assumptions,
            totalCapex: construction.totalProjectCost
        };

        // Step 2: Revenue projection
        const revenueData = RevenueModel.calculate(enrichedAssumptions);

        // Step 3: Operating expenses
        const opexData = OpexModel.calculate(enrichedAssumptions);

        // Step 4: Build preliminary EBITDA and CFADS for debt sizing
        const prelimCFADS = revenueData.map((rev, i) => ({
            year: rev.year,
            cfads: rev.revenue - (opexData[i]?.totalOpex || 0),
            ebitda: rev.revenue - (opexData[i]?.totalOpex || 0)
        }));

        // Step 5: Debt schedule (needs CFADS for sculpted)
        const debtResults = DebtModel.calculate(
            enrichedAssumptions,
            construction.totalProjectCost,
            prelimCFADS
        );

        // Step 6: Build interest data for tax calculation
        const interestData = debtResults.annualData.map(d => ({
            year: d.year,
            interest: d.interest
        }));

        // Step 7: Depreciation & tax
        const ebitdaData = prelimCFADS.map(d => ({
            year: d.year,
            ebitda: d.ebitda
        }));
        const taxData = DepreciationModel.calculate(
            enrichedAssumptions,
            construction.totalProjectCost,
            ebitdaData,
            interestData
        );

        // Step 8: Assemble cash flow waterfall
        const cashFlowResults = CashFlowModel.calculate(
            revenueData,
            opexData,
            debtResults.annualData,
            taxData,
            construction,
            enrichedAssumptions
        );

        // Step 9: Calculate returns
        const returns = ReturnsModel.calculate(
            cashFlowResults,
            construction,
            debtResults,
            enrichedAssumptions
        );

        // Compile final results
        return {
            assumptions: enrichedAssumptions,
            construction,
            revenueData,
            opexData,
            debtResults,
            taxData,
            cashFlowResults,
            returns,

            // Convenience accessors
            annualData: cashFlowResults.annualData,
            totalCapex: construction.totalProjectCost,
            totalDebt: debtResults.totalDebt,
            equityInvestment: debtResults.equityInvestment,
            projectIRR: returns.projectIRR,
            equityIRR: returns.equityIRR,
            npv: returns.npv,
            moic: returns.moic,
            paybackPeriod: returns.paybackPeriod,
            discountedPayback: returns.discountedPayback,
            minDSCR: debtResults.minDSCR,
            avgDSCR: debtResults.avgDSCR,
            llcr: debtResults.llcr,

            // Totals
            totalRevenue: cashFlowResults.totalRevenue,
            totalOpex: cashFlowResults.totalOpex,
            totalEBITDA: cashFlowResults.totalEBITDA,
            totalDebtService: cashFlowResults.totalDebtService,
            totalTax: cashFlowResults.totalTax,
            totalFCFE: cashFlowResults.totalFCFE
        };
    }
}
