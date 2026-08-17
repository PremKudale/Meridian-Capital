/**
 * Depreciation & Tax Model
 * Accelerated depreciation for solar projects in India
 * MAT vs Normal tax computation with loss carry-forward
 */

export class DepreciationModel {
    /**
     * Calculate depreciation schedule and tax
     * @param {Object} assumptions
     * @param {number} totalCapex - Total depreciable cost
     * @param {Object[]} ebitdaData - Array of {year, ebitda} for each year
     * @param {Object[]} interestData - Array of {year, interest} for each year
     * @returns {Object[]} Annual depreciation and tax data
     */
    static calculate(assumptions, totalCapex, ebitdaData, interestData) {
        const {
            taxRate,            // Corporate tax rate (decimal)
            matRate,            // MAT rate (decimal)
            acceleratedDepRate, // Accelerated depreciation rate (e.g., 0.40 for 40%)
            useAcceleratedDep,  // Whether to use accelerated depreciation
            projectLife         // Years
        } = assumptions;

        const annualData = [];
        let wdvBalance = totalCapex; // Written Down Value
        let carryForwardLoss = 0;    // Carried forward losses
        let matCreditBalance = 0;    // MAT credit carry forward

        for (let year = 1; year <= projectLife; year++) {
            const ebitda = ebitdaData[year - 1]?.ebitda || 0;
            const interest = interestData[year - 1]?.interest || 0;

            // Depreciation calculation
            let depreciation;
            if (useAcceleratedDep && year === 1) {
                // 40% accelerated depreciation in Year 1 for solar
                depreciation = totalCapex * acceleratedDepRate;
            } else {
                // WDV method at 15% for remaining years
                const wdvRate = 0.15;
                depreciation = wdvBalance * wdvRate;
            }

            // Ensure depreciation doesn't exceed WDV
            depreciation = Math.min(depreciation, wdvBalance);
            wdvBalance -= depreciation;

            // Profit Before Tax
            const pbt = ebitda - depreciation - interest;

            // Taxable income after carry-forward losses
            let taxableIncome = pbt;
            let lossUtilized = 0;

            if (taxableIncome > 0 && carryForwardLoss > 0) {
                lossUtilized = Math.min(taxableIncome, carryForwardLoss);
                taxableIncome -= lossUtilized;
                carryForwardLoss -= lossUtilized;
            } else if (taxableIncome < 0) {
                carryForwardLoss += Math.abs(taxableIncome);
                taxableIncome = 0;
            }

            // Normal tax
            const normalTax = Math.max(0, taxableIncome * taxRate);

            // MAT (Minimum Alternate Tax) on book profit
            const bookProfit = Math.max(0, ebitda - depreciation - interest);
            const matTax = bookProfit * matRate;

            // Actual tax = higher of normal or MAT
            let actualTax;
            let isMAT = false;
            let matCredit = 0;

            if (matTax > normalTax) {
                actualTax = matTax;
                isMAT = true;
                matCredit = matTax - normalTax;
                matCreditBalance += matCredit;
            } else {
                actualTax = normalTax;
                // Can utilize MAT credit if normal tax > MAT
                if (matCreditBalance > 0 && normalTax > matTax) {
                    const creditUtilized = Math.min(matCreditBalance, normalTax - matTax);
                    actualTax -= creditUtilized;
                    matCreditBalance -= creditUtilized;
                }
            }

            const pat = pbt - actualTax; // Profit After Tax

            annualData.push({
                year,
                depreciation,
                wdvBalance,
                pbt,
                taxableIncome,
                carryForwardLoss,
                lossUtilized,
                normalTax,
                matTax,
                actualTax,
                isMAT,
                matCredit,
                matCreditBalance,
                pat
            });
        }

        return annualData;
    }
}
