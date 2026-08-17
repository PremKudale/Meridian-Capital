/**
 * Construction Schedule Module
 * Models CAPEX drawdown and Interest During Construction (IDC)
 */

export class ConstructionModel {
    /**
     * Calculate construction schedule with S-curve drawdown
     * @param {Object} assumptions
     * @returns {Object} Construction results
     */
    static calculate(assumptions) {
        const {
            capacity,           // MW
            capexPerMW,         // ₹ per MW
            epcPercent,         // EPC cost as % of total CAPEX
            landPercent,        // Land cost as %
            interconnectionPercent, // Grid interconnection as %
            devCostPercent,     // Development costs as %
            contingencyPercent, // Contingency as %
            constructionMonths, // Months of construction
            interestRate,       // Annual interest rate for IDC
            debtRatio           // Debt proportion
        } = assumptions;

        // Total CAPEX breakdown
        const grossCapex = capacity * capexPerMW;
        const epcCost = grossCapex * epcPercent;
        const landCost = grossCapex * landPercent;
        const interconnectionCost = grossCapex * interconnectionPercent;
        const devCost = grossCapex * devCostPercent;
        const contingency = grossCapex * contingencyPercent;
        const totalHardCost = epcCost + landCost + interconnectionCost + devCost + contingency;

        // S-curve drawdown (cumulative % at each quarter)
        const quarters = Math.ceil(constructionMonths / 3);
        const drawdownSchedule = this._generateSCurve(quarters);

        // Calculate IDC (Interest During Construction)
        const monthlyRate = interestRate / 12;
        const debtPortion = totalHardCost * debtRatio;
        let idc = 0;
        let cumulativeDrawn = 0;

        for (let q = 0; q < quarters; q++) {
            const quarterlyDraw = debtPortion * (drawdownSchedule[q] - (q > 0 ? drawdownSchedule[q - 1] : 0));
            // Interest on average outstanding during quarter
            const avgOutstanding = cumulativeDrawn + quarterlyDraw / 2;
            idc += avgOutstanding * monthlyRate * 3; // 3 months per quarter
            cumulativeDrawn += quarterlyDraw;
        }

        const totalProjectCost = totalHardCost + idc;

        return {
            grossCapex,
            epcCost,
            landCost,
            interconnectionCost,
            devCost,
            contingency,
            totalHardCost,
            idc,
            totalProjectCost,
            drawdownSchedule,
            quarters,
            capexBreakdown: [
                { label: 'EPC / Module + BOS', value: epcCost, percent: epcPercent },
                { label: 'Land Acquisition', value: landCost, percent: landPercent },
                { label: 'Grid Interconnection', value: interconnectionCost, percent: interconnectionPercent },
                { label: 'Development Costs', value: devCost, percent: devCostPercent },
                { label: 'Contingency', value: contingency, percent: contingencyPercent },
                { label: 'IDC', value: idc, percent: idc / totalProjectCost }
            ]
        };
    }

    /**
     * Generate S-curve cumulative drawdown percentages
     * @param {number} quarters - Number of quarters
     * @returns {number[]} Cumulative percentages (0 to 1)
     */
    static _generateSCurve(quarters) {
        const schedule = [];
        for (let q = 1; q <= quarters; q++) {
            // Logistic S-curve
            const t = q / quarters;
            const sCurve = 1 / (1 + Math.exp(-12 * (t - 0.5)));
            // Normalize so it starts near 0 and ends at 1
            const startVal = 1 / (1 + Math.exp(-12 * (0 - 0.5)));
            const endVal = 1 / (1 + Math.exp(-12 * (1 - 0.5)));
            const normalized = (sCurve - startVal) / (endVal - startVal);
            schedule.push(Math.min(normalized, 1));
        }
        // Ensure last value is exactly 1
        schedule[schedule.length - 1] = 1;
        return schedule;
    }
}
