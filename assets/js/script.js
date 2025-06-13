/**
 * @file script.js
 * @description Orchestrator for the advanced analytics dashboard.
 * Handles data fetching based on filters and calls visualization components to render the UI.
 */

// --- GLOBAL STATE ---
let reportFilters = { dates: [], cities: [] }; // Holds the available filter options.
let primaryReportData = []; // Data for the selected primary report
let secondaryReportData = []; // Data for the selected secondary report

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // **NEW**: Check for a user session before doing anything else.
    const supabaseClient = window.SupabaseConfig.getClient();
    let session = null;

    if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        session = data.session;
    }

    if (!session) {
        // If no user is logged in, redirect to the login page.
        window.location.replace(window.AppConstants?.ROUTES?.LOGIN || 'login.html');
        return; // Stop further script execution
    }

    // If a session exists, proceed with initializing the dashboard.
    const isConfigured = initializePage('dashboard');
    if (isConfigured) {
        loadInitialData();
    }
});

/**
 * Loads the initial data needed for the dashboard filters.
 */
async function loadInitialData() {
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        handleError("Failed to load initial data", new Error("Supabase client is not available."));
        return;
    }
    
    showLoading('Fetching available reports...');
    try {
        const { data, error } = await supabaseClient.rpc('get_distinct_reports');
        if (error) throw error;
        
        // Safely handle null responses from the RPC call.
        reportFilters = data || { cities: [], dates: [] };
        const cities = reportFilters.cities || [];
        const dates = reportFilters.dates || [];
        
        renderFilterPanel(cities, dates);
        
        if (dates.length > 0 && cities.length > 0) {
            // Automatically select and load the latest report.
            const latestDate = dates[0]; // Dates are sorted descending in the SQL function.
            const city = cities[0];
            
            document.getElementById('filter_city').value = city;
            document.getElementById('filter_primary_as_of_date').value = latestDate;
            await handleFilterChange();
        } else {
            // If there are no dates or cities, there's no data to show.
            renderEmptyState();
        }

    } catch (error) {
        handleError("Failed to load initial data", error);
    } finally {
        hideLoading();
    }
}

/**
 * Fetches report data when a filter is changed and updates the UI.
 * Also synchronizes the filter states to prevent comparing a report to itself.
 */
async function handleFilterChange() {
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        handleError("Failed to load initial data", new Error("Supabase client is not available."));
        return;
    }

    const citySelect = document.getElementById('filter_city');
    const primaryDateSelect = document.getElementById('filter_primary_as_of_date');
    const secondaryDateSelect = document.getElementById('filter_secondary_as_of_date');

    const city = citySelect.value;
    const primaryDate = primaryDateSelect.value;
    const secondaryDate = secondaryDateSelect.value;

    // --- New logic to disable the selected primary date in the secondary dropdown ---
    // Iterate over the options in the secondary date dropdown
    for (const option of secondaryDateSelect.options) {
        // Enable all options first to reset the state from previous changes
        option.disabled = false;
        // If an option's value matches the selected primary date, disable it
        if (option.value === primaryDate) {
            option.disabled = true;
        }
    }

    // If the currently selected secondary date is now disabled, reset it to "none"
    if (secondaryDateSelect.options[secondaryDateSelect.selectedIndex]?.disabled) {
        secondaryDateSelect.value = 'none';
    }
    // --- End of new logic ---

    if (!city || !primaryDate) return;

    showLoading('Fetching report data...');
    try {
        const [primaryRes, secondaryRes] = await Promise.all([
            supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).select('*').eq('city', city).eq('as_of_date', primaryDate),
            (secondaryDateSelect.value && secondaryDateSelect.value !== 'none')
                ? supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).select('*').eq('city', city).eq('as_of_date', secondaryDateSelect.value)
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
    EnhancedDashboardComponents.createEnhancedMetrics('kpi-container', primaryReportData, secondaryReportData);
    EnhancedDashboardComponents.createForecastComparisonChart('forecast-comparison-chart', primaryReportData, secondaryReportData);
    EnhancedDashboardComponents.createPickupPaceChart('weekly-pickup-chart', primaryReportData);
    EnhancedDashboardComponents.createStlyVarianceHeatmap('stly-variance-heatmap', primaryReportData);
}

/**
 * Renders the filter panel with dynamic options from the fetched report list.
 * @param {string[]} distinctCities - An array of unique city names.
 * @param {string[]} distinctDates - An array of unique, sorted report dates.
 */
function renderFilterPanel(distinctCities = [], distinctDates = []) {
    const container = document.getElementById('filter-panel-container');
    const uploaderRoute = window.AppConstants?.ROUTES?.UPLOADER || 'upload.html';

    const filtersHtml = `
        <select id="filter_city" class="form-select" onchange="handleFilterChange()">
            ${distinctCities.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select id="filter_primary_as_of_date" class="form-select" onchange="handleFilterChange()">
            <option value="">As of Date</option>
            ${distinctDates.map(d => `<option value="${d}">${formatDate(d, 'long')}</option>`).join('')}
        </select>
        <select id="filter_secondary_as_of_date" class="form-select" onchange="handleFilterChange()">
            <option value="none">-- Compare to --</option>
            ${distinctDates.map(d => `<option value="${d}">${formatDate(d, 'long')}</option>`).join('')}
        </select>
        <select class="form-select" disabled>
            <option>Date Range</option>
        </select>

        <button onclick="location.href='${uploaderRoute}'" class="btn btn-primary">
            📁 Upload File
        </button>
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
        : { icon: '📂', title: 'No Data Found', message: 'Upload a file to get started.', actions: [{ label: 'Upload Now', onClick: `location.href='${window.AppConstants?.ROUTES?.UPLOADER || 'upload.html'}'` }] };

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