/**
 * Export Utilities
 * CSV export and print-ready PDF generation
 */

export const ExportUtils = {
    /**
     * Export data to CSV file
     * @param {Object} modelResults - Complete model results
     * @param {string} filename - Output filename
     */
    exportToCSV(modelResults, filename = 'meridian_capital_cashflows.csv') {
        const { assumptions, annualData } = modelResults;

        // Build CSV rows
        const rows = [];

        // Header
        rows.push(['Meridian Capital - Project Finance Model Export']);
        rows.push([`Project: ${assumptions.projectName || '100 MW Solar Power Plant'}`]);
        rows.push([`Exported: ${new Date().toLocaleDateString('en-IN')}`]);
        rows.push([]);

        // Key Metrics
        rows.push(['KEY METRICS']);
        rows.push(['Metric', 'Value']);
        rows.push(['Total CAPEX (₹ Cr)', (modelResults.totalCapex / 1e7).toFixed(2)]);
        rows.push(['Equity Investment (₹ Cr)', (modelResults.equityInvestment / 1e7).toFixed(2)]);
        rows.push(['Project IRR', (modelResults.projectIRR * 100).toFixed(2) + '%']);
        rows.push(['Equity IRR', (modelResults.equityIRR * 100).toFixed(2) + '%']);
        rows.push(['NPV (₹ Cr)', (modelResults.npv / 1e7).toFixed(2)]);
        rows.push(['MOIC', modelResults.moic.toFixed(2) + 'x']);
        rows.push(['Payback Period', modelResults.paybackPeriod.toFixed(1) + ' years']);
        rows.push(['Min DSCR', modelResults.minDSCR.toFixed(2) + 'x']);
        rows.push(['Avg DSCR', modelResults.avgDSCR.toFixed(2) + 'x']);
        rows.push([]);

        // Annual Cash Flow Table
        rows.push(['ANNUAL CASH FLOW STATEMENT (₹ Lakhs)']);
        rows.push([
            'Year',
            'Energy (MWh)',
            'Revenue',
            'O&M Costs',
            'Insurance',
            'Land Lease',
            'Admin',
            'Total OPEX',
            'EBITDA',
            'Depreciation',
            'Interest',
            'PBT',
            'Tax',
            'PAT',
            'Principal Repayment',
            'Debt Service',
            'CFADS',
            'DSCR',
            'FCFE',
            'Cumulative FCFE'
        ]);

        let cumulativeFCFE = 0;
        for (const year of annualData) {
            cumulativeFCFE += year.fcfe;
            rows.push([
                year.year,
                Math.round(year.energy),
                (year.revenue / 1e5).toFixed(2),
                (year.omCost / 1e5).toFixed(2),
                (year.insurance / 1e5).toFixed(2),
                (year.landLease / 1e5).toFixed(2),
                (year.admin / 1e5).toFixed(2),
                (year.totalOpex / 1e5).toFixed(2),
                (year.ebitda / 1e5).toFixed(2),
                (year.depreciation / 1e5).toFixed(2),
                (year.interest / 1e5).toFixed(2),
                (year.pbt / 1e5).toFixed(2),
                (year.tax / 1e5).toFixed(2),
                (year.pat / 1e5).toFixed(2),
                (year.principalRepayment / 1e5).toFixed(2),
                (year.debtService / 1e5).toFixed(2),
                (year.cfads / 1e5).toFixed(2),
                year.dscr.toFixed(2),
                (year.fcfe / 1e5).toFixed(2),
                (cumulativeFCFE / 1e5).toFixed(2)
            ]);
        }

        // Convert to CSV string
        const csvContent = rows.map(row =>
            row.map(cell => {
                const str = String(cell);
                // Escape cells containing commas or quotes
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        ).join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Generate print-ready view and trigger print dialog
     */
    printReport() {
        window.print();
    },

    /**
     * Generate executive summary HTML for the summary tab
     * @param {Object} modelResults - Complete model results
     * @param {Object} assumptions - Model assumptions
     * @returns {string} HTML content
     */
    generateExecutiveSummary(modelResults, assumptions) {
        const r = modelResults;
        const a = assumptions;

        const irrClass = r.equityIRR >= 0.14 ? 'positive' : r.equityIRR >= 0.10 ? 'neutral' : 'negative';
        const dscrClass = r.minDSCR >= 1.3 ? 'positive' : r.minDSCR >= 1.1 ? 'neutral' : 'negative';

        return `
        <div class="executive-summary">
            <div class="memo-header">
                <h2>Investment Memorandum</h2>
                <p class="memo-subtitle">${a.projectName || '100 MW Solar Power Plant'} — Project Finance Analysis</p>
                <p class="memo-date">Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div class="memo-section">
                <h3>1. Project Overview</h3>
                <p>This memorandum presents the financial analysis of a <strong>${a.capacity} MW</strong> solar photovoltaic power plant 
                with a total project cost of <strong>₹${(r.totalCapex / 1e7).toFixed(1)} Crores</strong>. 
                The project has a useful life of <strong>${a.projectLife} years</strong> and is expected to achieve a 
                P50 capacity factor of <strong>${(a.capacityFactor * 100).toFixed(1)}%</strong>.</p>
                
                <table class="memo-table">
                    <tr><td>Project Capacity</td><td>${a.capacity} MW</td></tr>
                    <tr><td>Total CAPEX</td><td>₹${(r.totalCapex / 1e7).toFixed(1)} Cr</td></tr>
                    <tr><td>CAPEX per MW</td><td>₹${(r.totalCapex / a.capacity / 1e7).toFixed(2)} Cr/MW</td></tr>
                    <tr><td>Construction Period</td><td>${a.constructionMonths} months</td></tr>
                    <tr><td>PPA Tariff</td><td>₹${a.ppaTariff.toFixed(2)}/kWh</td></tr>
                    <tr><td>PPA Tenure</td><td>${a.ppaTenure} years</td></tr>
                </table>
            </div>

            <div class="memo-section">
                <h3>2. Capital Structure</h3>
                <table class="memo-table">
                    <tr><td>Debt</td><td>₹${(r.totalDebt / 1e7).toFixed(1)} Cr (${(a.debtRatio * 100).toFixed(0)}%)</td></tr>
                    <tr><td>Equity</td><td>₹${(r.equityInvestment / 1e7).toFixed(1)} Cr (${((1 - a.debtRatio) * 100).toFixed(0)}%)</td></tr>
                    <tr><td>Interest Rate</td><td>${(a.interestRate * 100).toFixed(1)}%</td></tr>
                    <tr><td>Loan Tenor</td><td>${a.loanTenor} years</td></tr>
                </table>
            </div>

            <div class="memo-section">
                <h3>3. Returns Analysis</h3>
                <table class="memo-table highlight">
                    <tr class="${irrClass}"><td>Project IRR (Pre-tax)</td><td><strong>${(r.projectIRR * 100).toFixed(2)}%</strong></td></tr>
                    <tr class="${irrClass}"><td>Equity IRR (Post-tax)</td><td><strong>${(r.equityIRR * 100).toFixed(2)}%</strong></td></tr>
                    <tr><td>NPV @ ${(a.discountRate * 100).toFixed(1)}%</td><td><strong>₹${(r.npv / 1e7).toFixed(1)} Cr</strong></td></tr>
                    <tr><td>MOIC</td><td><strong>${r.moic.toFixed(2)}x</strong></td></tr>
                    <tr><td>Payback Period</td><td><strong>${r.paybackPeriod.toFixed(1)} years</strong></td></tr>
                    <tr><td>Discounted Payback</td><td><strong>${r.discountedPayback.toFixed(1)} years</strong></td></tr>
                </table>
            </div>

            <div class="memo-section">
                <h3>4. Debt Coverage</h3>
                <table class="memo-table">
                    <tr class="${dscrClass}"><td>Minimum DSCR</td><td><strong>${r.minDSCR.toFixed(2)}x</strong></td></tr>
                    <tr><td>Average DSCR</td><td>${r.avgDSCR.toFixed(2)}x</td></tr>
                    <tr><td>LLCR</td><td>${r.llcr.toFixed(2)}x</td></tr>
                </table>
                <p class="memo-note ${dscrClass}">
                    ${r.minDSCR >= 1.3 
                        ? '✅ The project maintains healthy debt coverage ratios throughout the loan tenor, indicating strong debt servicing capacity.' 
                        : r.minDSCR >= 1.1 
                            ? '⚠️ Debt coverage ratios are adequate but leave limited headroom. Sensitivity to downside scenarios should be carefully assessed.'
                            : '🚨 Debt coverage ratios are below recommended thresholds. The project may face difficulty servicing debt under stress scenarios.'}
                </p>
            </div>

            <div class="memo-section">
                <h3>5. Investment Recommendation</h3>
                <p>${r.equityIRR >= 0.14 && r.minDSCR >= 1.2
                    ? `The project delivers attractive risk-adjusted returns with an Equity IRR of ${(r.equityIRR * 100).toFixed(1)}% and robust debt coverage. The positive NPV of ₹${(r.npv / 1e7).toFixed(1)} Cr confirms value creation. <strong>Recommendation: PROCEED with investment.</strong>`
                    : r.equityIRR >= 0.10
                        ? `The project delivers moderate returns with an Equity IRR of ${(r.equityIRR * 100).toFixed(1)}%. While the project is viable, returns are sensitive to key assumptions. <strong>Recommendation: PROCEED with caution, subject to further due diligence.</strong>`
                        : `The project delivers sub-optimal returns with an Equity IRR of ${(r.equityIRR * 100).toFixed(1)}%. Key assumptions may need to be revisited. <strong>Recommendation: REVIEW assumptions and consider restructuring.</strong>`
                }</p>
            </div>

            <div class="memo-footer">
                <p><em>This analysis was generated by Meridian Capital — Project Finance Modeling & Advisory Platform</em></p>
                <p><em>Disclaimer: This model is for analytical purposes. Actual returns may vary based on market conditions, regulatory changes, and project execution.</em></p>
            </div>
        </div>`;
    }
};
