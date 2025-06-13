/**
 * @file script.js
 * @description Orchestrator for the advanced analytics dashboard.
 * Handles data fetching based on filters and calls visualization components to render the UI.
 */

// --- HELPER FUNCTIONS ---

/**
 * Formats a date string into a more readable format.
 * @param {string} dateString - The date string to format (e.g., '2023-04-01').
 * @param {string} [format='default'] - The desired format ('default', 'long', 'short', 'iso').
 * @returns {string} The formatted date.
 */
function formatDate(dateString, format = 'default') {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Adjust for timezone offset to prevent date changes
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        const options = {
            long: { year: 'numeric', month: 'long', day: 'numeric' },
            short: { month: 'short', day: 'numeric' },
            default: { year: 'numeric', month: 'short', day: 'numeric' }
        };
        if (format === 'iso') return adjustedDate.toISOString();
        return adjustedDate.toLocaleDateString('en-US', options[format] || options.default);
    } catch (e) {
        return dateString; // Return original string if formatting fails
    }
}

/**
 * Formats a number as a percentage.
 * @param {number} value - The number to format.
 * @param {number} [decimals=2] - The number of decimal places.
 * @returns {string} The formatted percentage string.
 */
function formatPercentage(value, decimals = 2) {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a number with commas and optional decimal places.
 * @param {number} value - The number to format.
 * @param {number} [decimals=0] - The number of decimal places.
 * @returns {string} The formatted number string.
 */
function formatNumber(value, decimals = 0) {
    if (typeof value !== 'number') return 'N/A';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}


// --- GLOBAL STATE ---
let reportFilters = { dates: [], cities: [] }; // Holds the available filter options.
let primaryReportData = []; // Data for the selected primary report
let secondaryReportData = []; // Data for the selected secondary report

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // Check for a user session before doing anything else.
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

    for (const option of secondaryDateSelect.options) {
        option.disabled = false;
        if (option.value === primaryDate) {
            option.disabled = true;
        }
    }

    if (secondaryDateSelect.options[secondaryDateSelect.selectedIndex]?.disabled) {
        secondaryDateSelect.value = 'none';
    }

    if (!city || !primaryDate) return;

    showLoading('Fetching report data...');
    try {
        const selectColumns = 'as_of_date, city, forecast_date, market_segment, current_occupancy, weekly_pickup, stly_variance';

        const [primaryRes, secondaryRes] = await Promise.all([
            supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).select(selectColumns).eq('city', city).eq('as_of_date', primaryDate),
            (secondaryDateSelect.value && secondaryDateSelect.value !== 'none')
                ? supabaseClient.from(AppConstants.DATABASE.TABLE_NAME).select(selectColumns).eq('city', city).eq('as_of_date', secondaryDateSelect.value)
                : Promise.resolve({ data: [], error: null })
        ]);

        if (primaryRes.error) throw primaryRes.error;
        if (secondaryRes.error) throw secondaryRes.error;

        primaryReportData = primaryRes.data;
        secondaryReportData = secondaryRes.data;

        // Wait for the dashboard and all its charts to finish rendering.
        await renderDashboard();

    } catch (error) {
        handleError("Failed to fetch report data", error);
    } finally {
        hideLoading();
    }
}

// --- UI RENDERING ---

/**
 * Renders the entire dashboard by calling the static visualization methods.
 * This function is now async to await the completion of all chart rendering.
 */
async function renderDashboard() {
    if (primaryReportData.length === 0) {
        renderEmptyState();
        return;
    }
    
    // Create metrics (synchronous)
    EnhancedDashboardComponents.createEnhancedMetrics('kpi-container', primaryReportData, secondaryReportData);

    // Wait for all asynchronous chart rendering promises to complete.
    await Promise.all([
        EnhancedDashboardComponents.createForecastComparisonChart('forecast-comparison-chart', primaryReportData, secondaryReportData),
        EnhancedDashboardComponents.createPickupPaceChart('weekly-pickup-chart', primaryReportData),
        EnhancedDashboardComponents.createStlyVarianceHeatmap('stly-variance-heatmap', primaryReportData)
    ]);
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