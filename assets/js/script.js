/**
 * @file script.js
 * @description Orchestrator for the advanced analytics dashboard.
 * Handles data fetching based on filters and calls visualization components to render the UI.
 */

// --- GLOBAL STATE ---
let allReports = []; // Stores metadata for all available reports (city, as_of_date)
let primaryReportData = []; // Data for the selected primary report
let secondaryReportData = []; // Data for the selected secondary report

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const isConfigured = initializePage('dashboard');
    if (isConfigured) {
        loadInitialData();
    }
});

/**
 * Loads the initial data needed for the dashboard filters.
 */
async function loadInitialData() {
    showLoading('Fetching available reports...');
    try {
        // This assumes a 'get_distinct_reports' RPC function exists in Supabase
        // that returns distinct combinations of as_of_date and city.
        const { data, error } = await supabase.rpc('get_distinct_reports');
        if (error) throw error;
        
        allReports = data;
        renderFilterPanel();
        
        if (allReports.length > 0) {
            // Automatically select and load the latest report
            const latestDate = allReports[0].as_of_date;
            const city = allReports[0].city;
            document.getElementById('filter_city').value = city;
            document.getElementById('filter_primary_as_of_date').value = latestDate;
            await handleFilterChange();
        } else {
            renderEmptyState();
        }

    } catch (error) {
        handleError("Failed to load initial data", error);
    } finally {
        hideLoading();
    }
}

/**
 * Fetches report data when a filter is changed.
 */
async function handleFilterChange() {
    const city = document.getElementById('filter_city').value;
    const primaryDate = document.getElementById('filter_primary_as_of_date').value;
    const secondaryDate = document.getElementById('filter_secondary_as_of_date').value;

    if (!city || !primaryDate) return;

    showLoading('Fetching report data...');
    try {
        // Use Promise.all to fetch primary and secondary reports concurrently
        const [primaryRes, secondaryRes] = await Promise.all([
            supabase.from(AppConstants.DATABASE.TABLE_NAME).select('*').eq('city', city).eq('as_of_date', primaryDate),
            (secondaryDate && secondaryDate !== 'none')
                ? supabase.from(AppConstants.DATABASE.TABLE_NAME).select('*').eq('city', city).eq('as_of_date', secondaryDate)
                : Promise.resolve({ data: [], error: null })
        ]);

        if (primaryRes.error) throw primaryRes.error;
        if (secondaryRes.error) throw secondaryRes.error;

        primaryReportData = primaryRes.data;
        secondaryReportData = secondaryRes.data;

        renderDashboard();

    } catch (error) {
        handleError("Failed to fetch report data", error);
    } finally {
        hideLoading();
    }
}

// --- UI RENDERING ---

/**
 * Renders the entire dashboard by calling the static visualization methods.
 */
function renderDashboard() {
    if (primaryReportData.length === 0) {
        renderEmptyState();
        return;
    }
    // These are the clean, one-line calls to the new static methods
    EnhancedDashboardComponents.createEnhancedMetrics('kpi-container', primaryReportData);
    EnhancedDashboardComponents.createForecastComparisonChart('forecast-comparison-chart', primaryReportData, secondaryReportData);
    EnhancedDashboardComponents.createPickupPaceChart('weekly-pickup-chart', primaryReportData);
    EnhancedDashboardComponents.createStlyVarianceHeatmap('stly-variance-heatmap', primaryReportData);
}

/**
 * Renders the filter panel with dynamic options from the fetched report list.
 */
function renderFilterPanel() {
    const container = document.getElementById('filter-panel-container');
    const distinctCities = [...new Set(allReports.map(r => r.city))];
    const distinctDates = [...new Set(allReports.map(r => r.as_of_date))].sort((a, b) => new Date(b) - new Date(a));

    const filtersHtml = `
        <div class="filter-grid">
            <div class="filter-group">
                <label for="filter_city" class="form-label">City</label>
                <select id="filter_city" class="form-select" onchange="handleFilterChange()">
                    ${distinctCities.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="filter_primary_as_of_date" class="form-label">Primary Report Date</label>
                <select id="filter_primary_as_of_date" class="form-select" onchange="handleFilterChange()">
                    ${distinctDates.map(d => `<option value="${d}">${formatDate(d, 'long')}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="filter_secondary_as_of_date" class="form-label">Comparison Report</label>
                <select id="filter_secondary_as_of_date" class="form-select" onchange="handleFilterChange()">
                    <option value="none">-- No Comparison --</option>
                    ${distinctDates.map(d => `<option value="${d}">${formatDate(d, 'long')}</option>`).join('')}
                </select>
            </div>
        </div>
    `;
    container.innerHTML = filtersHtml;
}

/**
 * Renders an empty state message when no data is available or an error occurs.
 */
function renderEmptyState(isError = false) {
    const mainContainer = document.getElementById('dashboard-main');
    mainContainer.innerHTML = ''; // Clear existing content

    const config = isError 
        ? { icon: '❌', title: 'Failed to Load Data', message: 'An error occurred while fetching data. Please try again or check the configuration.' }
        : { icon: '📂', title: 'No Data Found', message: 'Upload a file to get started.', actions: [{ label: 'Upload Now', onClick: `location.href='${AppConstants.ROUTES.UPLOADER}'` }] };

    mainContainer.innerHTML = SharedComponents.createEmptyState(config);
}

/**
 * Centralized error handler to show alerts and log to console.
 */
function handleError(message, error) {
    console.error(message, error);
    showAlert(`${message}: ${error.message}`, 'error');
    renderEmptyState(true);
}
