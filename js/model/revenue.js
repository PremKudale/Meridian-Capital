/**
 * Revenue Model
 * Energy generation and PPA revenue calculations
 */

export class RevenueModel {
    /**
     * Calculate annual revenue over project life
     * @param {Object} assumptions
     * @returns {Object[]} Annual revenue data
     */
    static calculate(assumptions) {
        const {
            capacity,           // MW
            capacityFactor,     // Decimal (e.g., 0.22)
            degradationRate,    // Annual degradation (e.g., 0.005 = 0.5%)
            ppaTariff,          // ₹/kWh
            ppaEscalation,      // Annual escalation (decimal)
            ppaTenure,          // PPA contract years
            merchantPrice,      // Post-PPA merchant price ₹/kWh
            merchantEscalation, // Post-PPA escalation
            projectLife         // Total project life in years
        } = assumptions;

        const annualData = [];
        const hoursPerYear = 8760;

        // Year 1 generation (P50)
        const baseGeneration = capacity * hoursPerYear * capacityFactor * 1000; // kWh

        for (let year = 1; year <= projectLife; year++) {
            // Apply degradation
            const degradationFactor = Math.pow(1 - degradationRate, year - 1);
            const energy = baseGeneration * degradationFactor; // kWh
            const energyMWh = energy / 1000;

            // Determine tariff
            let tariff;
            if (year <= ppaTenure) {
                // PPA period with escalation
                tariff = ppaTariff * Math.pow(1 + ppaEscalation, year - 1);
            } else {
                // Merchant tail
                const merchantYears = year - ppaTenure;
                tariff = merchantPrice * Math.pow(1 + merchantEscalation, merchantYears - 1);
            }

            const revenue = energy * tariff; // ₹

            annualData.push({
                year,
                energyKWh: energy,
                energyMWh,
                degradationFactor,
                tariff,
                revenue,
                isPPA: year <= ppaTenure
            });
        }

        return annualData;
    }
}
