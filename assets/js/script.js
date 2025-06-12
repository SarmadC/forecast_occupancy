/**
 * @file script.js
 * @description This is the main script file that orchestrates the dashboard page.
 * It handles the initialization of components, data fetching, and rendering of the dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INSTANTIATION ---
    // Initialize shared UI components like theme toggles, spinners, and modals.
    const sharedComponents = new SharedComponents();
    // Initialize components specific to the dashboard, like charts.
    const dashboardComponents = new DashboardComponents();
    // Initialize the Supabase data manager to interact with the backend.
    const supabaseDataManager = new SupabaseDataManager(supabase);

    // --- UI SETUP ---
    // Setup the theme toggle (dark/light mode).
    sharedComponents.initializeTheme();
    // Get references to DOM elements for manipulation.
    const loadingSpinnerContainer = document.getElementById('loading-spinner');
    const errorMessageContainer = document.getElementById('error-message');
    const dashboardContent = document.getElementById('dashboard-content');
    const chartContainerId = 'chart-container';
    const asOfDateElementId = 'as-of-date-display';


    /**
     * Main function to load and display the dashboard.
     * It fetches the latest forecast data and renders the chart.
     */
    async function loadDashboard() {
        // 1. Show a loading spinner to indicate that data is being fetched.
        sharedComponents.showLoadingSpinner(loadingSpinnerContainer);
        dashboardContent.classList.add('hidden'); // Hide content while loading
        errorMessageContainer.classList.add('hidden'); // Hide previous errors

        try {
            // 2. Fetch the latest forecast data from the Supabase backend.
            const latestForecast = await supabaseDataManager.getLatestForecast();

            // 3. Hide the loading spinner once the data fetch is complete.
            sharedComponents.hideLoadingSpinner(loadingSpinnerContainer);

            // 4. Check if data was returned.
            if (latestForecast) {
                // If data exists, show the main dashboard content area.
                dashboardContent.classList.remove('hidden');

                // Update the "As of Date" display on the dashboard.
                dashboardComponents.updateAsOfDate(asOfDateElementId, latestForecast.as_of_date);

                // Render the main forecast chart with the fetched data.
                dashboardComponents.createForecastChart(chartContainerId, latestForecast);

            } else {
                // If no data is found, display a "No Data" message.
                 sharedComponents.displayMessage(errorMessageContainer, 'No forecast data could be found in the database. Please upload a report.', 'info');
                 // Also render an empty state for the chart
                 dashboardComponents.createForecastChart(chartContainerId, null);
                 dashboardContent.classList.remove('hidden');
            }
        } catch (error) {
            // 5. If an error occurs during the fetch, hide the spinner and show an error message.
            sharedComponents.hideLoadingSpinner(loadingSpinnerContainer);
            console.error('Failed to load dashboard:', error);
            // Use the shared component to display a user-friendly error message.
            sharedComponents.displayMessage(errorMessageContainer, 'Failed to load forecast data. Please try again later.', 'error');
        }
    }

    // --- INITIALIZATION ---
    // Load the dashboard as soon as the DOM is ready.
    loadDashboard();
});
