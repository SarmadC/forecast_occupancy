/**
 * @file dashboard-visuals.js
 * @description Contains the EnhancedDashboardComponents class, a static utility for creating
 * all specialized charts and visualizations for the analytics dashboard.
 */

class EnhancedDashboardComponents {

    /**
     * Creates the main forecast comparison chart.
     * @param {string} containerId The ID of the container element.
     * @param {Array} primaryData Data for the primary report.
     * @param {Array} secondaryData Data for the comparison report.
     */
    static createForecastComparisonChart(containerId, primaryData, secondaryData) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = ''; // Clear previous chart

        const categories = [...new Set(primaryData.map(d => d.forecast_date))].sort();
        const series = [];

        // Primary Series
        series.push({
            name: `As of ${formatDate(primaryData[0].as_of_date)}`,
            data: categories.map(date => {
                const row = primaryData.find(d => d.forecast_date === date && d.market_segment === 'Totals');
                return row ? row.current_occupancy : null;
            }),
            color: AppConstants.COLORS.PRIMARY
        });

        // Secondary (Comparison) Series
        if (secondaryData.length > 0) {
            series.push({
                name: `As of ${formatDate(secondaryData[0].as_of_date)} (Comparison)`,
                data: categories.map(date => {
                    const row = secondaryData.find(d => d.forecast_date === date && d.market_segment === 'Totals');
                    return row ? row.current_occupancy : null;
                }),
                color: AppConstants.COLORS.WARNING
            });
        }

        const options = {
            series: series,
            chart: { type: 'area', height: 350, toolbar: { show: true }, zoom: { enabled: true } },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            xaxis: { type: 'datetime', categories: categories, title: { text: 'Forecast Date' } },
            yaxis: { title: { text: 'Total Occupancy (%)' }, labels: { formatter: (val) => formatPercentage(val, 0) } },
            tooltip: { x: { format: 'dd MMM yyyy' } },
            legend: { position: 'top', horizontalAlign: 'left' }
        };
        new ApexCharts(container, options).render();
    }

    /**
     * Creates a pickup pace chart showing weekly changes.
     * @param {string} containerId - The ID of the container element.
     * @param {Array} data - Array of forecast data for the primary report.
     */
    static createPickupPaceChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const totals = data.filter(d => d.market_segment === 'Totals' && d.weekly_pickup !== 0)
                           .sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date));

        const options = {
            series: [{ name: 'Weekly Pickup', data: totals.map(d => d.weekly_pickup) }],
            chart: { type: 'bar', height: 350, toolbar: { show: true } },
            plotOptions: { bar: { colors: { ranges: [{ from: -Infinity, to: -0.01, color: AppConstants.COLORS.ERROR }, { from: 0, to: Infinity, color: AppConstants.COLORS.SUCCESS }] } } },
            xaxis: { type: 'datetime', categories: totals.map(d => d.forecast_date), title: { text: 'Forecast Date' } },
            yaxis: { title: { text: 'Rooms Picked Up' } },
            tooltip: { x: { format: 'dd MMM yyyy' } }
        };
        new ApexCharts(container, options).render();
    }

    /**
     * Creates a STLY (Same Time Last Year) variance heatmap.
     * @param {string} containerId - The ID of the container element.
     * @param {Array} data - Array of forecast data.
     */
    static createStlyVarianceHeatmap(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const totals = data.filter(d => d.market_segment === 'Totals');
        const seriesData = {};
        
        totals.forEach(d => {
            const month = formatDate(d.forecast_date, 'iso').substring(0, 7); // yyyy-MM
            if (!seriesData[month]) seriesData[month] = [];
            seriesData[month].push({ x: d.forecast_date, y: d.stly_variance });
        });

        const series = Object.keys(seriesData).sort().map(month => ({
            name: formatDate(month + '-02', 'long').split(' ')[0], // Get Month name
            data: seriesData[month].map(d => ({ x: formatDate(d.x, 'short'), y: d.y }))
        }));

        const options = {
            series: series,
            chart: { type: 'heatmap', height: 350 },
            plotOptions: {
                heatmap: {
                    colorScale: {
                        ranges: [
                            { from: -100, to: -5, color: AppConstants.COLORS.ERROR, name: 'Behind' },
                            { from: -5, to: 5, color: AppConstants.COLORS.GRAY, name: 'On Pace' },
                            { from: 5, to: 100, color: AppConstants.COLORS.SUCCESS, name: 'Ahead' }
                        ]
                    }
                }
            },
            dataLabels: { enabled: false },
            title: { text: 'Variance vs. Same Time Last Year (%)' }
        };
        new ApexCharts(container, options).render();
    }
    
   /**
     * Creates enhanced metric cards with trend indicators
     * @param {string} containerId - The ID of the container element
     * @param {Array} data - Latest forecast data for the primary report
     * @param {Array} comparisonData - Data for the comparison report
     */
    static createEnhancedMetrics(containerId, data, comparisonData) {
        const container = document.getElementById(containerId);
        if (!container || !data || data.length === 0) {
            container.innerHTML = '';
            return;
        }

        const totals = data.filter(d => d.market_segment === 'Totals');
        if (totals.length === 0) return;

        const peakOccupancy = Math.max(...totals.map(d => d.current_occupancy));
        const avgWeeklyPickup = totals.reduce((sum, d) => sum + d.weekly_pickup, 0) / totals.length;
        const highOccupancyDays = totals.filter(d => d.current_occupancy >= 80).length;
        
        // Calculate trend for high occupancy days if comparison data is available
        let highOccupancyTrend = 'vs previous report';
        if(comparisonData && comparisonData.length > 0) {
            const comparisonTotals = comparisonData.filter(d => d.market_segment === 'Totals');
            const oldHighOccupancyDays = comparisonTotals.filter(d => d.current_occupancy >= 80).length;
            const diff = highOccupancyDays - oldHighOccupancyDays;
            if (diff > 0) {
                highOccupancyTrend = `+${diff} days`;
            } else if (diff < 0) {
                highOccupancyTrend = `${diff} days`;
            } else {
                 highOccupancyTrend = `No change`;
            }
        }


        const cards = [
            SharedComponents.createMetricCard({ title: 'City', value: data[0].city, icon: '🏙️', trend: `Report from ${formatDate(data[0].as_of_date)}`, color: 'blue' }),
            SharedComponents.createMetricCard({ title: 'Peak Forecast Occupancy', value: formatPercentage(peakOccupancy), icon: '🏆', trend: `Highest projected date`, color: 'purple' }),
            SharedComponents.createMetricCard({ title: 'Avg. Weekly Pickup', value: formatNumber(avgWeeklyPickup, 1), icon: '📈', trend: `+${formatNumber(totals.reduce((sum, d) => sum + d.weekly_pickup, 0),0)} rooms total`, color: 'green' }),
            SharedComponents.createMetricCard({ title: 'High Occupancy Days (>80%)', value: highOccupancyDays, icon: '🔥', trend: highOccupancyTrend, color: 'orange' })
        ];
        container.innerHTML = cards.join('');
    }
}