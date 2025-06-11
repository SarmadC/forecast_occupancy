 // Sample data
        const forecastEvolutionData = {
            labels: ['Nov 15', 'Nov 22', 'Nov 29', 'Dec 6', 'Dec 10'],
            datasets: [{
                label: 'Forecast Occupancy (%)',
                data: [68.5, 70.2, 69.8, 72.1, 72.5],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 6,
                tension: 0.1
            }]
        };

        const accuracyData = {
            labels: ['1-7 Days', '8-14 Days', '15-30 Days', '31-60 Days', '60+ Days'],
            datasets: [{
                label: 'Accuracy (%)',
                data: [95.2, 89.7, 82.4, 75.8, 68.3],
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1
            }]
        };

        const segmentData = [
            { name: 'Transient', current: 58.3, change: 5.2, accuracy: 87.5 },
            { name: 'Group Sold', current: 12.4, change: 2.1, accuracy: 92.1 },
            { name: 'Other', current: 1.8, change: -0.3, accuracy: 89.7 }
        ];

        const alerts = [
            { 
                type: 'error', 
                title: 'Low Occupancy Alert', 
                message: 'Dec 19th showing 45% occupancy (15% below target)',
                icon: '⚠️'
            },
            { 
                type: 'warning', 
                title: 'Forecast Variance', 
                message: 'Dec 31st prediction changed +12% since last week',
                icon: '⏰'
            },
            { 
                type: 'success', 
                title: 'Strong Performance', 
                message: 'Holiday period showing 88%+ occupancy',
                icon: '📈'
            }
        ];

        const insights = [
            {
                type: 'blue',
                title: 'Forecast Accuracy Trending',
                message: '7-day forecasts maintaining 95%+ accuracy. Consider increasing reliance on near-term predictions for pricing decisions.'
            },
            {
                type: 'green',
                title: 'Strong Holiday Demand',
                message: 'Dec 25-31 period showing consistent 85%+ occupancy across all forecast horizons. Pricing optimization opportunity.'
            },
            {
                type: 'orange',
                title: 'Mid-Week Opportunity',
                message: 'Tuesday-Wednesday showing 15% lower occupancy. Consider targeted promotions or group sales initiatives.'
            },
            {
                type: 'purple',
                title: 'Forecast Volatility',
                message: '30+ day forecasts showing higher variance. Implement more frequent forecast updates for long-term periods.'
            }
        ];

        // Chart initialization
        let evolutionChart, accuracyChart;

        function initializeCharts() {
            // Evolution Chart
            const evolutionCtx = document.getElementById('evolutionChart').getContext('2d');
            evolutionChart = new Chart(evolutionCtx, {
                type: 'line',
                data: forecastEvolutionData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderColor: '#e5e7eb',
                            borderWidth: 1,
                            titleColor: '#1f2937',
                            bodyColor: '#1f2937',
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 65,
                            max: 75,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });

            // Accuracy Chart
            const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
            accuracyChart = new Chart(accuracyCtx, {
                type: 'bar',
                data: accuracyData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderColor: '#e5e7eb',
                            borderWidth: 1,
                            titleColor: '#1f2937',
                            bodyColor: '#1f2937',
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            min: 60,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        function generateCalendar() {
            const calendarGrid = document.getElementById('calendarGrid');
            calendarGrid.innerHTML = '';

            for (let i = 0; i < 30; i++) {
                const day = document.createElement('div');
                day.className = 'calendar-day';
                
                const occupancy = 60 + Math.random() * 30;
                const isWeekend = (i + 1) % 7 === 0 || (i + 1) % 7 === 1;
                
                if (occupancy > 80) {
                    day.classList.add('high');
                } else if (occupancy > 60) {
                    day.classList.add('medium');
                } else {
                    day.classList.add('low');
                }
                
                if (isWeekend) {
                    day.classList.add('weekend');
                }
                
                day.innerHTML = `
                    <div style="font-weight: 600;">${i + 11}</div>
                    <div style="font-size: 9px;">${Math.round(occupancy)}%</div>
                `;
                
                day.title = `Dec ${i + 11}: ${Math.round(occupancy)}% occupancy`;
                calendarGrid.appendChild(day);
            }
        }

        function generateSegmentList() {
            const segmentList = document.getElementById('segmentList');
            segmentList.innerHTML = '';

            segmentData.forEach(segment => {
                const segmentItem = document.createElement('div');
                segmentItem.className = 'segment-item';
                
                const changeClass = segment.change > 0 ? 'positive' : segment.change < 0 ? 'negative' : 'neutral';
                
                segmentItem.innerHTML = `
                    <div class="segment-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="segment-name">${segment.name}</span>
                        <span class="segment-change ${changeClass}">
                            ${segment.change > 0 ? '+' : ''}${segment.change}%
                        </span>
                    </div>
                    <div class="segment-details">
                        <span>Current: ${segment.current}%</span>
                        <span>Accuracy: ${segment.accuracy}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${segment.current}%"></div>
                    </div>
                `;
                
                segmentList.appendChild(segmentItem);
            });
        }

        function generateAlerts() {
            const alertsList = document.getElementById('alertsList');
            alertsList.innerHTML = '';

            alerts.forEach(alert => {
                const alertItem = document.createElement('div');
                alertItem.className = `alert-item ${alert.type}`;
                
                alertItem.innerHTML = `
                    <div class="alert-icon">${alert.icon}</div>
                    <div class="alert-content">
                        <h4 style="color: ${alert.type === 'error' ? '#dc2626' : alert.type === 'warning' ? '#d97706' : '#059669'};">
                            ${alert.title}
                        </h4>
                        <p style="color: ${alert.type === 'error' ? '#991b1b' : alert.type === 'warning' ? '#92400e' : '#047857'};">
                            ${alert.message}
                        </p>
                    </div>
                `;
                
                alertsList.appendChild(alertItem);
            });
        }

        function generateInsights() {
            const insightsList = document.getElementById('insightsList');
            insightsList.innerHTML = '';

            insights.forEach(insight => {
                const insightCard = document.createElement('div');
                insightCard.className = `insight-card ${insight.type}`;
                
                const colors = {
                    blue: '#1e40af',
                    green: '#059669',
                    orange: '#d97706',
                    purple: '#7c3aed'
                };
                
                insightCard.innerHTML = `
                    <h4 style="color: ${colors[insight.type]};">${insight.title}</h4>
                    <p style="color: ${colors[insight.type]}; opacity: 0.8;">${insight.message}</p>
                `;
                
                insightsList.appendChild(insightCard);
            });
        }

        // Filter event handlers
        function setupFilters() {
            const asOfDateFilter = document.getElementById('asOfDateFilter');
            const cityFilter = document.getElementById('cityFilter');
            const horizonFilter = document.getElementById('horizonFilter');

            asOfDateFilter.addEventListener('change', function() {
                updateDashboard();
                document.getElementById('footerDate').textContent = this.value;
            });

            cityFilter.addEventListener('change', function() {
                updateDashboard();
            });

            horizonFilter.addEventListener('change', function() {
                updateDashboard();
            });
        }

        function updateDashboard() {
            const asOfDate = document.getElementById('asOfDateFilter').value;
            const city = document.getElementById('cityFilter').value;
            const horizon = document.getElementById('horizonFilter').value;

            // Simulate data update based on filters
            const variation = Math.random() * 10 - 5; // -5% to +5% variation
            
            // Update metrics
            document.getElementById('avgOccupancy').textContent = (72.5 + variation).toFixed(1) + '%';
            document.getElementById('forecastAccuracy').textContent = (89.7 + Math.random() * 5).toFixed(1) + '%';
            document.getElementById('nextWeekForecast').textContent = (75.8 + variation).toFixed(1) + '%';
            
            // Update charts with slight variations
            forecastEvolutionData.datasets[0].data = forecastEvolutionData.datasets[0].data.map(val => val + (Math.random() * 2 - 1));
            accuracyData.datasets[0].data = accuracyData.datasets[0].data.map(val => Math.max(60, Math.min(100, val + (Math.random() * 4 - 2))));
            
            evolutionChart.update();
            accuracyChart.update();
            
            // Regenerate dynamic content
            generateCalendar();
            generateSegmentList();
        }

        // Real-time data simulation
        function simulateRealTimeUpdates() {
            setInterval(() => {
                // Subtle updates to simulate real-time data
                const currentOccupancy = document.getElementById('avgOccupancy');
                const currentValue = parseFloat(currentOccupancy.textContent);
                const newValue = currentValue + (Math.random() * 0.2 - 0.1); // Small random change
                currentOccupancy.textContent = newValue.toFixed(1) + '%';
            }, 30000); // Update every 30 seconds
        }

        // API integration placeholder
        async function loadDataFromAPI() {
            try {
                // Replace with your actual SharePoint/API endpoint
                // const response = await fetch('/api/occupancy-forecast');
                // const data = await response.json();
                
                // For now, use sample data
                console.log('API integration ready - replace with actual SharePoint endpoint');
                
                // Example of how to structure API call:
                /*
                const apiUrl = 'https://eedc.sharepoint.com/sites/BusinessSystemsTeam/_api/web/lists/getbytitle(\'Market Reports\')/items';
                const response = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Authorization': 'Bearer ' + accessToken
                    }
                });
                const data = await response.json();
                return data.d.results;
                */
                
                return null;
            } catch (error) {
                console.error('Error loading data:', error);
                return null;
            }
        }

        // File upload handler for local Excel files
        function setupFileUpload() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xlsx,.csv';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            // Add upload button to header
            const uploadButton = document.createElement('button');
            uploadButton.textContent = 'Upload Data';
            uploadButton.style.cssText = `
                padding: 8px 16px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-left: 16px;
            `;
            
            uploadButton.addEventListener('click', () => fileInput.click());
            document.querySelector('.filters').appendChild(uploadButton);

            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    console.log('File selected:', file.name);
                    // Process the uploaded file here
                    // You can use libraries like SheetJS to parse Excel files
                }
            });
        }

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            generateCalendar();
            generateSegmentList();
            generateAlerts();
            generateInsights();
            setupFilters();
            setupFileUpload();
            simulateRealTimeUpdates();
            
            // Initial data load
            loadDataFromAPI();
            
            console.log('Occupancy Forecasting Dashboard initialized successfully!');
        });

        // Export functionality
        function exportToPDF() {
            window.print();
        }

        function exportToExcel() {
            // Placeholder for Excel export functionality
            console.log('Excel export functionality can be implemented here');
        }

        // Add export buttons
        document.addEventListener('DOMContentLoaded', function() {
            const exportContainer = document.createElement('div');
            exportContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 8px;
                z-index: 1000;
            `;
            
            const pdfButton = document.createElement('button');
            pdfButton.textContent = '📄 Export PDF';
            pdfButton.onclick = exportToPDF;
            pdfButton.style.cssText = `
                padding: 8px 12px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            const excelButton = document.createElement('button');
            excelButton.textContent = '📊 Export Excel';
            excelButton.onclick = exportToExcel;
            excelButton.style.cssText = `
                padding: 8px 12px;
                background: #10b981;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            exportContainer.appendChild(pdfButton);
            exportContainer.appendChild(excelButton);
            document.body.appendChild(exportContainer);
        });