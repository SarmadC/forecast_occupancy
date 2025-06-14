/**
 * Enhanced Dashboard Script
 * Modern interactions and filter presets
 */

// Global State
let reportFilters = { dates: [], cities: [] };
let primaryReportData = [];
let secondaryReportData = [];
let currentFilters = {};

// Filter Presets
const FILTER_PRESETS = {
    'last_30': { label: 'Last 30 Days', days: 30 },
    'last_60': { label: 'Last 60 Days', days: 60 },
    'last_90': { label: 'Last 90 Days', days: 90 },
    'peak_season': { label: 'Peak Season', custom: true }
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const supabaseClient = window.SupabaseConfig.getClient();
    let session = null;

    if (supabaseClient) {
        const { data } = await supabaseClient.auth.getSession();
        session = data.session;
    }

    if (!session) {
        window.location.replace(window.AppConstants?.ROUTES?.LOGIN || 'login.html');
        return;
    }

    const isConfigured = initializePage('dashboard');
    if (isConfigured) {
        // Add keyboard shortcuts
        initializeKeyboardShortcuts();
        loadInitialData();
    }
});

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + K for quick search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            showQuickSearch();
        }
        
        // Cmd/Ctrl + U for upload
        if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
            e.preventDefault();
            window.location.href = AppConstants.ROUTES.UPLOADER;
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Enhanced filter panel with presets
 */
function renderFilterPanel(distinctCities = [], distinctDates = []) {
    const container = document.getElementById('filter-panel-container');
    const uploaderRoute = window.AppConstants?.ROUTES?.UPLOADER || 'upload.html';

    const filtersHtml = `
        <div class="filter-group">
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
        </div>
        
        <div class="filter-presets">
            ${Object.entries(FILTER_PRESETS).map(([key, preset]) => `
                <button class="preset-btn" data-preset="${key}" onclick="applyPreset('${key}')">
                    ${preset.label}
                </button>
            `).join('')}
        </div>

        <button onclick="location.href='${uploaderRoute}'" class="btn btn-primary">
            <span>📁</span>
            <span>Upload File</span>
        </button>
    `;
    container.innerHTML = filtersHtml;
}

/**
 * Apply filter preset
 */
function applyPreset(presetKey) {
    const preset = FILTER_PRESETS[presetKey];
    if (!preset) return;
    
    // Update active state
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
    
    // Apply preset logic (this would filter the data based on the preset)
    if (preset.custom) {
        // Custom logic for peak season etc.
        showAlert(`Applied "${preset.label}" filter`, 'info');
    } else {
        // Date-based presets
        showAlert(`Showing last ${preset.days} days`, 'info');
    }
}

/**
 * Enhanced data loading with skeleton states
 */
async function loadInitialData() {
    const supabaseClient = window.SupabaseConfig.getClient();
    if (!supabaseClient) {
        handleError("Failed to load initial data", new Error("Supabase client is not available."));
        return;
    }
    
    // Show skeleton loading state
    renderSkeletonState();
    
    try {
        const { data, error } = await supabaseClient.rpc('get_distinct_reports');
        if (error) throw error;
        
        reportFilters = data || { cities: [], dates: [] };
        const cities = reportFilters.cities || [];
        const dates = reportFilters.dates || [];
        
        renderFilterPanel(cities, dates);
        
        if (dates.length > 0 && cities.length > 0) {
            const latestDate = dates[0];
            const city = cities[0];
            
            document.getElementById('filter_city').value = city;
            document.getElementById('filter_primary_as_of_date').value = latestDate;
            
            // Save filters to localStorage
            saveFilters({ city, primaryDate: latestDate });
            
            await handleFilterChange();
        } else {
            renderEmptyState();
        }

    } catch (error) {
        handleError("Failed to load initial data", error);
    }
}

/**
 * Render skeleton loading state
 */
function renderSkeletonState() {
    const kpiContainer = document.getElementById('kpi-container');
    const chartContainers = document.querySelectorAll('.chart-canvas');
    
    // KPI skeletons
    kpiContainer.innerHTML = Array(4).fill(0).map(() => `
        <div class="metric-card">
            <div class="skeleton skeleton-title" style="width: 60%"></div>
            <div class="skeleton skeleton-text" style="height: 48px; width: 80%; margin-top: 16px"></div>
            <div class="skeleton skeleton-text" style="width: 40%; margin-top: 8px"></div>
        </div>
    `).join('');
    
    // Chart skeletons
    chartContainers.forEach(container => {
        container.innerHTML = `<div class="skeleton" style="height: 300px; width: 100%; border-radius: var(--radius-md)"></div>`;
    });
}

/**
 * Save filters to localStorage
 */
function saveFilters(filters) {
    currentFilters = { ...currentFilters, ...filters };
    localStorage.setItem('dashboardFilters', JSON.stringify(currentFilters));
}

/**
 * Load filters from localStorage
 */
function loadFilters() {
    const saved = localStorage.getItem('dashboardFilters');
    if (saved) {
        currentFilters = JSON.parse(saved);
    }
}

/**
 * Show quick search modal
 */
function showQuickSearch() {
    // Implementation for quick search modal
    showAlert('Quick search coming soon! Press Cmd/Ctrl + K', 'info');
}

/**
 * Close all modals
 */
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.add('modal-exit');
        setTimeout(() => modal.remove(), 300);
    });
}

/**
 * Enhanced error handler with retry option
 */
function handleError(message, error, retryCallback = null) {
    console.error(message, error);
    
    const actions = [];
    if (retryCallback) {
        actions.push({
            label: 'Retry',
            type: 'primary',
            onClick: retryCallback
        });
    }
    
    showAlert(`${message}: ${error.message}`, 'error', 0, actions);
    renderEmptyState(true);
}

// Export functions for global use
window.applyPreset = applyPreset;
window.showQuickSearch = showQuickSearch;