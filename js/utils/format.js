/**
 * Formatting Utilities
 * Number formatting for Indian numbering system, currency, and percentages
 */

export const Format = {
    /**
     * Format number in Indian numbering system (Lakhs, Crores)
     * @param {number} num - Number to format
     * @param {number} decimals - Decimal places
     * @returns {string}
     */
    indianNumber(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';

        const isNegative = num < 0;
        num = Math.abs(num);

        const parts = num.toFixed(decimals).split('.');
        let intPart = parts[0];
        const decPart = parts[1];

        // Indian numbering: last 3 digits, then groups of 2
        if (intPart.length > 3) {
            const lastThree = intPart.slice(-3);
            const remaining = intPart.slice(0, -3);
            const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
            intPart = formatted + ',' + lastThree;
        }

        const result = decPart ? `${intPart}.${decPart}` : intPart;
        return isNegative ? `(${result})` : result;
    },

    /**
     * Format as Indian Rupees
     * @param {number} num - Amount
     * @param {number} decimals - Decimal places
     * @returns {string}
     */
    rupees(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        return `₹${this.indianNumber(num, decimals)}`;
    },

    /**
     * Format in Crores (÷ 10,000,000)
     * @param {number} num - Amount in absolute value
     * @param {number} decimals - Decimal places
     * @returns {string}
     */
    crores(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';
        const croreVal = num / 10000000;
        const isNegative = croreVal < 0;
        const formatted = Math.abs(croreVal).toFixed(decimals);
        return isNegative ? `(₹${formatted} Cr)` : `₹${formatted} Cr`;
    },

    /**
     * Format in Lakhs (÷ 100,000)
     * @param {number} num - Amount in absolute value
     * @param {number} decimals - Decimal places
     * @returns {string}
     */
    lakhs(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';
        const lakhVal = num / 100000;
        const isNegative = lakhVal < 0;
        const formatted = Math.abs(lakhVal).toFixed(decimals);
        return isNegative ? `(₹${formatted} L)` : `₹${formatted} L`;
    },

    /**
     * Smart currency formatting - auto-selects Cr or L based on magnitude
     * @param {number} num - Amount
     * @returns {string}
     */
    smartCurrency(num) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';
        const abs = Math.abs(num);
        if (abs >= 10000000) return this.crores(num);
        if (abs >= 100000) return this.lakhs(num);
        return this.rupees(num, 0);
    },

    /**
     * Format as percentage
     * @param {number} num - Decimal value (0.15 = 15%)
     * @param {number} decimals - Decimal places
     * @returns {string}
     */
    percent(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';
        return `${(num * 100).toFixed(decimals)}%`;
    },

    /**
     * Format as a multiple (e.g., 2.3x)
     * @param {number} num
     * @param {number} decimals
     * @returns {string}
     */
    multiple(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) return '—';
        if (!isFinite(num)) return '∞';
        return `${num.toFixed(decimals)}x`;
    },

    /**
     * Format years
     * @param {number} years
     * @returns {string}
     */
    years(years) {
        if (years === null || years === undefined || isNaN(years)) return '—';
        if (!isFinite(years)) return 'Never';
        return `${years.toFixed(1)} yrs`;
    },

    /**
     * Format MWh
     * @param {number} mwh
     * @returns {string}
     */
    mwh(mwh) {
        if (mwh === null || mwh === undefined || isNaN(mwh)) return '—';
        return `${this.indianNumber(Math.round(mwh), 0)} MWh`;
    },

    /**
     * Generate year label
     * @param {number} yearIndex - 0-based year index
     * @param {number} startYear - Calendar start year
     * @returns {string}
     */
    yearLabel(yearIndex, startYear = 2025) {
        return `FY${startYear + yearIndex}`;
    },

    /**
     * Compact number formatting for chart axes
     * @param {number} num
     * @returns {string}
     */
    compact(num) {
        if (num === null || num === undefined || isNaN(num)) return '';
        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(0)}Cr`;
        if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(0)}L`;
        if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}K`;
        return `${sign}${abs.toFixed(0)}`;
    }
};
