/**
 * Chart Configurations
 * Theme-consistent Chart.js configurations for all chart types
 */

export const ChartTheme = {
    colors: {
        primary: '#3b82f6',
        primaryLight: '#60a5fa',
        secondary: '#8b5cf6',
        success: '#10b981',
        successLight: '#34d399',
        warning: '#f59e0b',
        warningLight: '#fbbf24',
        danger: '#ef4444',
        dangerLight: '#f87171',
        info: '#06b6d4',
        neutral: '#6b7280',
        neutralLight: '#9ca3af',
        bg: '#0a0e27',
        cardBg: 'rgba(15, 23, 42, 0.8)',
        gridColor: 'rgba(148, 163, 184, 0.1)',
        textColor: '#e2e8f0',
        textMuted: '#94a3b8',
    },

    // Chart color palette for series
    palette: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
        '#f97316', '#6366f1'
    ],

    gradients: {
        revenue: ['rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.1)'],
        opex: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.1)'],
        ebitda: ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.1)'],
        debt: ['rgba(245, 158, 11, 0.8)', 'rgba(245, 158, 11, 0.1)'],
        equity: ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 0.1)'],
    }
};

/**
 * Create gradient fill for Chart.js
 */
function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

/**
 * Common chart defaults
 */
export const ChartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
        duration: 800,
        easing: 'easeInOutQuart'
    },
    plugins: {
        legend: {
            labels: {
                color: ChartTheme.colors.textColor,
                font: { family: "'Inter', sans-serif", size: 12 },
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 10
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
            bodyFont: { family: "'Inter', sans-serif", size: 12 },
            displayColors: true,
            boxPadding: 4
        }
    },
    scales: {
        x: {
            grid: { color: ChartTheme.colors.gridColor, drawBorder: false },
            ticks: {
                color: ChartTheme.colors.textMuted,
                font: { family: "'Inter', sans-serif", size: 11 }
            }
        },
        y: {
            grid: { color: ChartTheme.colors.gridColor, drawBorder: false },
            ticks: {
                color: ChartTheme.colors.textMuted,
                font: { family: "'Inter', sans-serif", size: 11 }
            }
        }
    }
};

/**
 * Get chart configuration for each chart type
 */
export const ChartConfigs = {
    /**
     * Cash Flow Waterfall — Stacked bar chart
     */
    cashFlowWaterfall(data) {
        const labels = data.map(d => `Y${d.year}`);
        return {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: data.map(d => d.revenue / 1e7),
                        backgroundColor: ChartTheme.colors.primary,
                        borderRadius: 3
                    },
                    {
                        label: 'OPEX',
                        data: data.map(d => -d.totalOpex / 1e7),
                        backgroundColor: ChartTheme.colors.danger,
                        borderRadius: 3
                    },
                    {
                        label: 'Debt Service',
                        data: data.map(d => -d.debtService / 1e7),
                        backgroundColor: ChartTheme.colors.warning,
                        borderRadius: 3
                    },
                    {
                        label: 'Tax',
                        data: data.map(d => -d.tax / 1e7),
                        backgroundColor: ChartTheme.colors.secondary,
                        borderRadius: 3
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: 'Cash Flow Waterfall (₹ Cr)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ₹${Math.abs(ctx.parsed.y).toFixed(1)} Cr`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    x: { ...ChartDefaults.scales.x, stacked: true },
                    y: {
                        ...ChartDefaults.scales.y,
                        stacked: true,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => `₹${v}Cr`
                        }
                    }
                }
            }
        };
    },

    /**
     * Debt Service Profile — Area chart
     */
    debtProfile(debtData) {
        const debtYears = debtData.filter(d => d.isDebtYear);
        const labels = debtYears.map(d => `Y${d.year}`);
        return {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Principal',
                        data: debtYears.map(d => d.principalRepayment / 1e7),
                        backgroundColor: ChartTheme.colors.primary,
                        borderRadius: 3
                    },
                    {
                        label: 'Interest',
                        data: debtYears.map(d => d.interest / 1e7),
                        backgroundColor: ChartTheme.colors.warning,
                        borderRadius: 3
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: 'Debt Service Profile (₹ Cr)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)} Cr`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    x: { ...ChartDefaults.scales.x, stacked: true },
                    y: {
                        ...ChartDefaults.scales.y,
                        stacked: true,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => `₹${v}Cr`
                        }
                    }
                }
            }
        };
    },

    /**
     * DSCR Timeline — Line chart with threshold
     */
    dscrTimeline(debtData) {
        const debtYears = debtData.filter(d => d.isDebtYear);
        const labels = debtYears.map(d => `Y${d.year}`);
        return {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'DSCR',
                        data: debtYears.map(d => Math.min(d.dscr, 5)), // Cap at 5 for display
                        borderColor: ChartTheme.colors.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: ChartTheme.colors.success,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5
                    },
                    {
                        label: 'Min Threshold (1.2x)',
                        data: debtYears.map(() => 1.2),
                        borderColor: ChartTheme.colors.danger,
                        borderWidth: 2,
                        borderDash: [8, 4],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: 'Debt Service Coverage Ratio (DSCR)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}x`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    y: {
                        ...ChartDefaults.scales.y,
                        min: 0,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => `${v.toFixed(1)}x`
                        }
                    }
                }
            }
        };
    },

    /**
     * Cumulative Cash Flow — Line chart showing breakeven
     */
    cumulativeCashFlow(data) {
        const labels = data.map(d => `Y${d.year}`);
        return {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cumulative FCFE',
                        data: data.map(d => d.cumulativeFCFE / 1e7),
                        borderColor: ChartTheme.colors.success,
                        backgroundColor: (ctx) => {
                            const chart = ctx.chart;
                            const { ctx: canvasCtx } = chart;
                            const gradient = canvasCtx.createLinearGradient(0, 0, 0, chart.height);
                            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
                            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
                            return gradient;
                        },
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: ChartTheme.colors.success,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1
                    },
                    {
                        label: 'Breakeven',
                        data: data.map(() => 0),
                        borderColor: ChartTheme.colors.textMuted,
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: 'Cumulative Free Cash Flow to Equity (₹ Cr)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(1)} Cr`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    y: {
                        ...ChartDefaults.scales.y,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => `₹${v}Cr`
                        }
                    }
                }
            }
        };
    },

    /**
     * Tornado chart — Horizontal bar
     */
    tornado(sensitivityData) {
        const results = sensitivityData.results.slice(0, 8); // Top 8
        const baseIRR = sensitivityData.baseIRR;

        return {
            type: 'bar',
            data: {
                labels: results.map(r => r.label),
                datasets: [
                    {
                        label: 'Downside',
                        data: results.map(r => (Math.min(r.irrAtLowInput, r.irrAtHighInput) - baseIRR) * 100),
                        backgroundColor: ChartTheme.colors.danger,
                        borderRadius: 3
                    },
                    {
                        label: 'Upside',
                        data: results.map(r => (Math.max(r.irrAtLowInput, r.irrAtHighInput) - baseIRR) * 100),
                        backgroundColor: ChartTheme.colors.success,
                        borderRadius: 3
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                indexAxis: 'y',
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: `Sensitivity of Equity IRR (Base: ${(baseIRR * 100).toFixed(1)}%)`,
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x > 0 ? '+' : ''}${ctx.parsed.x.toFixed(2)}% impact`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    x: {
                        ...ChartDefaults.scales.x,
                        ticks: {
                            ...ChartDefaults.scales.x.ticks,
                            callback: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
                        }
                    },
                    y: {
                        ...ChartDefaults.scales.y,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            font: { family: "'Inter', sans-serif", size: 12 }
                        }
                    }
                }
            }
        };
    },

    /**
     * Monte Carlo Histogram
     */
    monteCarloHistogram(histogramData, stats) {
        return {
            type: 'bar',
            data: {
                labels: histogramData.map(b => `${(b.binMid * 100).toFixed(1)}%`),
                datasets: [
                    {
                        label: 'Frequency',
                        data: histogramData.map(b => b.count),
                        backgroundColor: histogramData.map(b => {
                            if (b.binMid >= 0.14) return 'rgba(16, 185, 129, 0.7)';
                            if (b.binMid >= 0.10) return 'rgba(245, 158, 11, 0.7)';
                            return 'rgba(239, 68, 68, 0.7)';
                        }),
                        borderColor: histogramData.map(b => {
                            if (b.binMid >= 0.14) return '#10b981';
                            if (b.binMid >= 0.10) return '#f59e0b';
                            return '#ef4444';
                        }),
                        borderWidth: 1,
                        borderRadius: 2
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: `Monte Carlo: Equity IRR Distribution (n=${stats.iterations})`,
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    legend: { display: false },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            title: (items) => `IRR: ${items[0].label}`,
                            label: (ctx) => `Count: ${ctx.parsed.y} (${((ctx.parsed.y / stats.iterations) * 100).toFixed(1)}%)`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    x: {
                        ...ChartDefaults.scales.x,
                        ticks: {
                            ...ChartDefaults.scales.x.ticks,
                            maxTicksLimit: 10,
                            maxRotation: 45
                        }
                    },
                    y: {
                        ...ChartDefaults.scales.y,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => v
                        }
                    }
                }
            }
        };
    },

    /**
     * Revenue & EBITDA trend — Dual line chart
     */
    revenueEBITDA(data) {
        const labels = data.map(d => `Y${d.year}`);
        return {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: data.map(d => d.revenue / 1e7),
                        borderColor: ChartTheme.colors.primary,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2
                    },
                    {
                        label: 'EBITDA',
                        data: data.map(d => d.ebitda / 1e7),
                        borderColor: ChartTheme.colors.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2
                    },
                    {
                        label: 'FCFE',
                        data: data.map(d => d.fcfe / 1e7),
                        borderColor: ChartTheme.colors.secondary,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 2,
                        borderDash: [5, 3]
                    }
                ]
            },
            options: {
                ...ChartDefaults,
                plugins: {
                    ...ChartDefaults.plugins,
                    title: {
                        display: true,
                        text: 'Revenue, EBITDA & FCFE Trend (₹ Cr)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)} Cr`
                        }
                    }
                },
                scales: {
                    ...ChartDefaults.scales,
                    y: {
                        ...ChartDefaults.scales.y,
                        ticks: {
                            ...ChartDefaults.scales.y.ticks,
                            callback: (v) => `₹${v}Cr`
                        }
                    }
                }
            }
        };
    },

    /**
     * CAPEX Breakdown — Doughnut chart
     */
    capexBreakdown(breakdown) {
        return {
            type: 'doughnut',
            data: {
                labels: breakdown.map(b => b.label),
                datasets: [{
                    data: breakdown.map(b => b.value / 1e7),
                    backgroundColor: ChartTheme.palette.slice(0, breakdown.length),
                    borderColor: ChartTheme.colors.bg,
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                animation: { duration: 800, easing: 'easeInOutQuart' },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: ChartTheme.colors.textColor,
                            font: { family: "'Inter', sans-serif", size: 11 },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    title: {
                        display: true,
                        text: 'CAPEX Breakdown (₹ Cr)',
                        color: ChartTheme.colors.textColor,
                        font: { family: "'Inter', sans-serif", size: 14, weight: '600' },
                        padding: { bottom: 16 }
                    },
                    tooltip: {
                        ...ChartDefaults.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toFixed(1)} Cr (${((ctx.parsed / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`
                        }
                    }
                }
            }
        };
    }
};
