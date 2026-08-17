/**
 * Assumptions Manager
 * Manages model input values, defaults, validation, and read/write
 */

export class Assumptions {
    /**
     * Get default assumptions for a 100 MW Solar Power Plant
     * @returns {Object} Default assumptions
     */
    static getDefaults() {
        return {
            // Project Details
            projectName: '100 MW Solar Power Plant',
            capacity: 100,              // MW
            projectLife: 25,             // Years
            constructionMonths: 18,      // Months

            // CAPEX
            capexPerMW: 45000000,        // ₹4.5 Cr per MW
            epcPercent: 0.75,            // 75% EPC
            landPercent: 0.05,           // 5% Land
            interconnectionPercent: 0.08, // 8% Grid
            devCostPercent: 0.05,        // 5% Development
            contingencyPercent: 0.07,    // 7% Contingency

            // Revenue
            capacityFactor: 0.22,        // 22% CUF
            degradationRate: 0.005,      // 0.5% annual degradation
            ppaTariff: 3.50,             // ₹3.50/kWh
            ppaEscalation: 0.00,         // 0% (fixed tariff)
            ppaTenure: 25,               // 25 year PPA
            merchantPrice: 4.00,         // ₹/kWh post-PPA
            merchantEscalation: 0.02,    // 2% merchant escalation

            // OPEX
            omCostPerMW: 600000,         // ₹6 L/MW/year
            insurancePercent: 0.0025,    // 0.25% of CAPEX
            landLeasePerMW: 200000,      // ₹2 L/MW/year
            adminCostPercent: 0.003,     // 0.3% of CAPEX
            inflationRate: 0.05,         // 5% inflation

            // Financing
            debtRatio: 0.70,             // 70:30 D:E
            interestRate: 0.095,         // 9.5%
            loanTenor: 15,               // 15 years
            dsraMonths: 6,               // 6 months DSRA
            repaymentType: 'annuity',    // 'annuity' or 'sculpted'

            // Tax
            taxRate: 0.252,              // 25.2% (incl surcharge)
            matRate: 0.1742,             // 17.42% MAT
            acceleratedDepRate: 0.40,    // 40% accelerated dep
            useAcceleratedDep: true,     // Enable accelerated dep

            // Discount Rate
            discountRate: 0.10,          // 10% WACC
            costOfEquity: 0.14           // 14% cost of equity
        };
    }

    /**
     * Read assumptions from the sidebar inputs
     * @returns {Object} Current assumptions
     */
    static readFromUI() {
        const defaults = this.getDefaults();
        const assumptions = { ...defaults };

        // Read each input, falling back to default if not found or invalid
        const inputs = {
            'capacity': { key: 'capacity', type: 'number' },
            'project-life': { key: 'projectLife', type: 'number' },
            'construction-months': { key: 'constructionMonths', type: 'number' },
            'capex-per-mw': { key: 'capexPerMW', type: 'number', multiplier: 10000000 },
            'capacity-factor': { key: 'capacityFactor', type: 'number', divisor: 100 },
            'degradation-rate': { key: 'degradationRate', type: 'number', divisor: 100 },
            'ppa-tariff': { key: 'ppaTariff', type: 'number' },
            'ppa-escalation': { key: 'ppaEscalation', type: 'number', divisor: 100 },
            'ppa-tenure': { key: 'ppaTenure', type: 'number' },
            'om-cost': { key: 'omCostPerMW', type: 'number', multiplier: 100000 },
            'insurance-pct': { key: 'insurancePercent', type: 'number', divisor: 100 },
            'land-lease': { key: 'landLeasePerMW', type: 'number', multiplier: 100000 },
            'inflation-rate': { key: 'inflationRate', type: 'number', divisor: 100 },
            'debt-ratio': { key: 'debtRatio', type: 'number', divisor: 100 },
            'interest-rate': { key: 'interestRate', type: 'number', divisor: 100 },
            'loan-tenor': { key: 'loanTenor', type: 'number' },
            'dsra-months': { key: 'dsraMonths', type: 'number' },
            'repayment-type': { key: 'repaymentType', type: 'select' },
            'tax-rate': { key: 'taxRate', type: 'number', divisor: 100 },
            'discount-rate': { key: 'discountRate', type: 'number', divisor: 100 },
            'use-accel-dep': { key: 'useAcceleratedDep', type: 'checkbox' }
        };

        for (const [inputId, config] of Object.entries(inputs)) {
            const el = document.getElementById(inputId);
            if (!el) continue;

            let value;
            if (config.type === 'checkbox') {
                value = el.checked;
            } else if (config.type === 'select') {
                value = el.value;
            } else {
                value = parseFloat(el.value);
                if (isNaN(value)) continue;
                if (config.multiplier) value *= config.multiplier;
                if (config.divisor) value /= config.divisor;
            }

            assumptions[config.key] = value;
        }

        return assumptions;
    }

    /**
     * Write assumptions to sidebar inputs
     * @param {Object} assumptions
     */
    static writeToUI(assumptions) {
        const mappings = {
            'capacity': { value: assumptions.capacity },
            'project-life': { value: assumptions.projectLife },
            'construction-months': { value: assumptions.constructionMonths },
            'capex-per-mw': { value: assumptions.capexPerMW / 10000000 },
            'capacity-factor': { value: assumptions.capacityFactor * 100 },
            'degradation-rate': { value: assumptions.degradationRate * 100 },
            'ppa-tariff': { value: assumptions.ppaTariff },
            'ppa-escalation': { value: assumptions.ppaEscalation * 100 },
            'ppa-tenure': { value: assumptions.ppaTenure },
            'om-cost': { value: assumptions.omCostPerMW / 100000 },
            'insurance-pct': { value: assumptions.insurancePercent * 100 },
            'land-lease': { value: assumptions.landLeasePerMW / 100000 },
            'inflation-rate': { value: assumptions.inflationRate * 100 },
            'debt-ratio': { value: assumptions.debtRatio * 100 },
            'interest-rate': { value: assumptions.interestRate * 100 },
            'loan-tenor': { value: assumptions.loanTenor },
            'dsra-months': { value: assumptions.dsraMonths },
            'repayment-type': { value: assumptions.repaymentType },
            'tax-rate': { value: assumptions.taxRate * 100 },
            'discount-rate': { value: assumptions.discountRate * 100 }
        };

        for (const [inputId, config] of Object.entries(mappings)) {
            const el = document.getElementById(inputId);
            if (!el) continue;
            el.value = typeof config.value === 'number' ? config.value.toFixed(2) : config.value;
        }

        // Checkbox
        const accelDep = document.getElementById('use-accel-dep');
        if (accelDep) accelDep.checked = assumptions.useAcceleratedDep;
    }

    /**
     * Validate assumptions
     * @param {Object} assumptions
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    static validate(assumptions) {
        const errors = [];
        const a = assumptions;

        if (a.capacity <= 0) errors.push('Capacity must be positive');
        if (a.projectLife < 1 || a.projectLife > 40) errors.push('Project life must be 1-40 years');
        if (a.capacityFactor <= 0 || a.capacityFactor > 1) errors.push('Capacity factor must be 0-100%');
        if (a.ppaTariff <= 0) errors.push('PPA tariff must be positive');
        if (a.debtRatio < 0 || a.debtRatio > 0.95) errors.push('Debt ratio must be 0-95%');
        if (a.interestRate <= 0 || a.interestRate > 0.30) errors.push('Interest rate must be 0-30%');
        if (a.loanTenor < 1 || a.loanTenor > a.projectLife) errors.push('Loan tenor must be ≤ project life');
        if (a.taxRate < 0 || a.taxRate > 0.50) errors.push('Tax rate must be 0-50%');

        return { valid: errors.length === 0, errors };
    }
}
