/**
 * Enhanced Dashboard Components with modern chart styling
 */

class EnhancedDashboardComponents {

    /**
     * Creates enhanced forecast comparison chart with gradients
     */
    static async createForecastComparisonChart(containerId, primaryData, secondaryData) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const categories = [...new Set(primaryData.map(d => d.forecast_date))].sort();
        const series = [];

        // Primary Series with gradient
        series.push({
            name: `As of ${formatDate(primaryData[0].as_of_date)}`,
            data: categories.map(date => {
                const row = primaryData.find(d => d.forecast_date === date && d.market_segment === 'Totals');
                return row ? row.current_occupancy : null;
            }),
            color: AppConstants.COLORS.PRIMARY
        });

        // Secondary Series
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
            chart: {
                type: 'area',
                height: 350,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                },
                zoom: { enabled: true },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            },
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            xaxis: {
                type: 'datetime',
                categories: categories,
                title: { text: 'Forecast Date' },
                labels: {
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            yaxis: {
                title: { text: 'Total Occupancy (%)' },
                labels: {
                    formatter: (val) => formatPercentage(val, 0),
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            tooltip: {
                x: { format: 'dd MMM yyyy' },
                theme: document.documentElement.getAttribute('data-theme') || 'light',
                style: {
                    fontSize: '14px'
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                labels: {
                    colors: 'var(--text-primary)'
                }
            },
            grid: {
                borderColor: 'var(--bg-muted)',
                strokeDashArray: 4
            }
        };
        
        const chart = new ApexCharts(container, options);
        return chart.render();
    }

    /**
     * Creates enhanced pickup pace chart with color coding
     */
    static async createPickupPaceChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const totals = data.filter(d => d.market_segment === 'Totals' && d.weekly_pickup !== 0)
                           .sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date));

        const options = {
            series: [{
                name: 'Weekly Pickup',
                data: totals.map(d => ({
                    x: d.forecast_date,
                    y: d.weekly_pickup,
                    fillColor: d.weekly_pickup >= 0 ? AppConstants.COLORS.SUCCESS : AppConstants.COLORS.ERROR
                }))
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: { show: true },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val) {
                    return val > 0 ? `+${val}` : val;
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ['var(--text-primary)']
                }
            },
            xaxis: {
                type: 'datetime',
                title: { text: 'Forecast Date' },
                labels: {
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            yaxis: {
                title: { text: 'Rooms Picked Up' },
                labels: {
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            tooltip: {
                x: { format: 'dd MMM yyyy' },
                theme: document.documentElement.getAttribute('data-theme') || 'light'
            },
            grid: {
                borderColor: 'var(--bg-muted)',
                strokeDashArray: 4
            }
        };
        
        const chart = new ApexCharts(container, options);
        return chart.render();
    }

    /**
     * Creates enhanced STLY variance heatmap with better colors
     */
    static async createStlyVarianceHeatmap(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const totals = data.filter(d => d.market_segment === 'Totals');
        const seriesData = {};
        
        totals.forEach(d => {
            const month = formatDate(d.forecast_date, 'iso').substring(0, 7);
            if (!seriesData[month]) seriesData[month] = [];
            seriesData[month].push({ x: d.forecast_date, y: d.stly_variance });
        });

        const series = Object.keys(seriesData).sort().map(month => ({
            name: formatDate(month + '-02', 'long').split(' ')[0],
            data: seriesData[month].map(d => ({ 
                x: formatDate(d.x, 'short'), 
                y: Math.round(d.y * 10) / 10 
            }))
        }));

        const options = {
            series: series,
            chart: {
                type: 'heatmap',
                height: 350,
                toolbar: { show: true },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            plotOptions: {
                heatmap: {
                    radius: 4,
                    enableShades: true,
                    shadeIntensity: 0.5,
                    colorScale: {
                        ranges: [
                            { from: -100, to: -10, color: '#ef4444', name: 'Significantly Behind' },
                            { from: -10, to: -5, color: '#f59e0b', name: 'Behind' },
                            { from: -5, to: 5, color: '#10b981', name: 'On Pace' },
                            { from: 5, to: 10, color: '#3b82f6', name: 'Ahead' },
                            { from: 10, to: 100, color: '#8b5cf6', name: 'Significantly Ahead' }
                        ]
                    }
                }
            },
            dataLabels: {
                enabled: true,
                style: {
                    colors: ['#fff']
                }
            },
            xaxis: {
                type: 'category',
                labels: {
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            yaxis: {
                labels: {
                    style: {
                        colors: 'var(--text-secondary)'
                    }
                }
            },
            title: {
                text: 'Variance vs. Same Time Last Year (%)',
                style: {
                    color: 'var(--text-primary)'
                }
            },
            tooltip: {
                theme: document.documentElement.getAttribute('data-theme') || 'light'
            },
            legend: {
                labels: {
                    colors: 'var(--text-primary)'
                }
            }
        };
        
        const chart = new ApexCharts(container, options);
        return chart.render();
    }
    
    /**
     * Creates enhanced metric cards with animations
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
        
        // Generate sparkline data for trends
        const occupancyTrend = totals.slice(-7).map(d => d.current_occupancy);
        
        let highOccupancyTrend = 'vs previous report';
        if(comparisonData && comparisonData.length > 0) {
            const comparisonTotals = comparisonData.filter(d => d.market_segment === 'Totals');
            const oldHighOccupancyDays = comparisonTotals.filter(d => d.current_occupancy >= 80).length;
            const diff = highOccupancyDays - oldHighOccupancyDays;
            if (diff > 0) {
                highOccupancyTrend = `+${diff} days vs last report`;
            } else if (diff < 0) {
                highOccupancyTrend = `${diff} days vs last report`;
            } else {
                highOccupancyTrend = `No change from last report`;
            }
        }

        const cards = [
            SharedComponents.createMetricCard({ 
                title: 'City', 
                value: data[0].city, 
                icon: '🏙️', 
                trend: `Report from ${formatDate(data[0].as_of_date)}`, 
                color: 'blue' 
            }),
            SharedComponents.createMetricCard({ 
                title: 'Peak Forecast', 
                value: formatPercentage(peakOccupancy), 
                icon: '🏆', 
                trend: `Highest projected occupancy`, 
                color: 'purple',
                sparklineData: occupancyTrend
            }),
            SharedComponents.createMetricCard({ 
                title: 'Avg. Weekly Pickup', 
                value: formatNumber(avgWeeklyPickup, 1), 
                icon: '📈', 
                trend: `+${formatNumber(totals.reduce((sum, d) => sum + d.weekly_pickup, 0),0)} rooms total`, 
                color: 'green' 
            }),
            SharedComponents.createMetricCard({ 
                title: 'High Occupancy Days', 
                value: highOccupancyDays, 
                icon: '🔥', 
                trend: highOccupancyTrend, 
                color: 'orange' 
            })
        ];
        
        container.innerHTML = cards.join('');
        
        // Add stagger animation to cards
        container.classList.add('stagger-children');
    }
}