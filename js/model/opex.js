/**
 * Operating Expenditure Model
 * O&M, insurance, land lease, and admin costs with inflation indexation
 */

export class OpexModel {
    /**
     * Calculate annual operating expenses
     * @param {Object} assumptions
     * @returns {Object[]} Annual OPEX data
     */
    static calculate(assumptions) {
        const {
            capacity,           // MW
            omCostPerMW,        // ₹/MW/year (Year 1)
            insurancePercent,   // % of CAPEX per year
            landLeasePerMW,     // ₹/MW/year
            adminCostPercent,   // % of revenue
            inflationRate,      // Annual inflation rate
            projectLife,        // Years
            totalCapex          // Total project cost (for insurance calc)
        } = assumptions;

        const annualData = [];

        for (let year = 1; year <= projectLife; year++) {
            const escalation = Math.pow(1 + inflationRate, year - 1);

            // O&M costs escalate with inflation
            const omCost = capacity * omCostPerMW * escalation;

            // Insurance as % of CAPEX (reducing balance approximation)
            const depreciatedCapex = totalCapex * Math.max(0.3, 1 - (year - 1) * 0.03); // rough depreciation
            const insurance = depreciatedCapex * insurancePercent;

            // Land lease escalates with inflation
            const landLease = capacity * landLeasePerMW * escalation;

            // Admin is a fixed amount that escalates
            const admin = totalCapex * adminCostPercent * escalation;

            const totalOpex = omCost + insurance + landLease + admin;

            annualData.push({
                year,
                omCost,
                insurance,
                landLease,
                admin,
                totalOpex,
                escalation
            });
        }

        return annualData;
    }
}
