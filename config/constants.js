/**
 * @file constants.js
 * @description Central configuration and constants for the entire application.
 * This includes database settings, business logic, UI definitions, and utility functions.
 */

window.AppConstants = {
    // --- DATABASE & STORAGE ---
    DATABASE: {
        TABLE_NAME: 'occupancy_forecasts',
        BATCH_SIZE: 1000,
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        TIMEOUT: 30000 // 30 seconds
    },
    STORAGE_KEYS: {
        SUPABASE_URL: 'forecast_app_supabase_url', // Using a more specific key
        SUPABASE_KEY: 'forecast_app_supabase_key',
        THEME: 'forecast_app_theme', // Added for theme persistence
        USER_PREFERENCES: 'forecast_app_user_preferences',
        LAST_FILTERS: 'forecast_app_last_filters'
    },

    // --- NAVIGATION ---
    ROUTES: {
        DASHBOARD: './index.html',
        UPLOADER: './upload.html',
        LOGIN: './login.html', // Added login route
        ADMIN: './admin.html'
    },

    // --- BUSINESS LOGIC ---
    FORECAST_HORIZONS: {
        HISTORICAL: 'Historical',
        NEAR_TERM: 'Near_Term',
        MEDIUM_TERM: 'Medium_Term',
        LONG_TERM: 'Long_Term'
    },
    HORIZON_DEFINITIONS: {
        HISTORICAL: { min: -Infinity, max: -1, label: 'Historical', color: '#6b7280' },
        NEAR_TERM: { min: 0, max: 30, label: 'Near Term (0-30 days)', color: '#3b82f6' },
        MEDIUM_TERM: { min: 31, max: 90, label: 'Medium Term (31-90 days)', color: '#8b5cf6' },
        LONG_TERM: { min: 91, max: Infinity, label: 'Long Term (90+ days)', color: '#f59e0b' }
    },
    MARKET_SEGMENTS: ['Totals', 'Transient', 'Group_Sold', 'Unsold_Block', 'Other'],
    CITIES: ['Edmonton', 'Calgary', 'Vancouver', 'Toronto', 'Montreal'],

    // --- UI & THEME ---
    COLORS: {
        PRIMARY: '#3b82f6',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        PURPLE: '#8b5cf6',
        GRAY: '#6b7280',
        BG_GRADIENT: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        CARD_GRADIENT: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
    },
    SEGMENT_COLORS: {
        'Totals': '#1e40af',
        'Transient': '#3b82f6',
        'Group_Sold': '#10b981',
        'Unsold_Block': '#f59e0b',
        'Other': '#8b5cf6'
    },
    CHART_DEFAULTS: {
        ANIMATION_DURATION: 750,
        RESPONSIVE: true,
        MAINTAIN_ASPECT_RATIO: false,
        POINT_RADIUS: 4,
        LINE_WIDTH: 3,
        GRID_COLOR: 'rgba(0, 0, 0, 0.1)',
        TOOLTIP_BACKGROUND: 'rgba(255, 255, 255, 0.95)',
        TOOLTIP_BORDER: '#e5e7eb'
    },

    // --- DATA VALIDATION ---
    VALIDATION: {
        OCCUPANCY_MIN: 0,
        OCCUPANCY_MAX: 100,
        VARIANCE_MIN: -50,
        VARIANCE_MAX: 50,
        REQUIRED_COLUMNS: ['as_of_date', 'city', 'forecast_date', 'market_segment', 'current_occupancy']
    },

    // --- MESSAGES ---
    ERROR_MESSAGES: {
        CONNECTION_FAILED: 'Failed to connect to database. Please check your configuration.',
        FILE_TOO_LARGE: 'File is too large. Maximum size is 50MB.',
        INVALID_FILE_FORMAT: 'Invalid file format. Please upload Excel (.xlsx) files only.',
        DATA_ALREADY_EXISTS: 'Data for this report already exists in the database.',
        NETWORK_ERROR: 'Network error. Please check your internet connection.',
        VALIDATION_ERROR: 'Data validation failed. Please check your file format.'
    },
    SUCCESS_MESSAGES: {
        CONNECTION_SUCCESS: 'Successfully connected to database!',
        FILE_UPLOADED: 'File uploaded successfully!',
        DATA_REFRESHED: 'Dashboard data refreshed!',
        CONFIG_SAVED: 'Configuration saved successfully!'
    },

    // Enhanced UI Configuration
    UI: {
        ANIMATIONS: {
            DURATION: {
                FAST: 150,
                BASE: 200,
                SLOW: 300,
                SPRING: 500
            },
            EASING: {
                DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
                SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        },
        BREAKPOINTS: {
            MOBILE: 640,
            TABLET: 768,
            DESKTOP: 1024,
            WIDE: 1280
        },
        Z_INDEX: {
            DROPDOWN: 50,
            STICKY: 100,
            FIXED: 200,
            MODAL_BACKDROP: 1000,
            MODAL: 1100,
            NOTIFICATION: 1200,
            TOOLTIP: 1300
        }
    },
    
    // Keyboard Shortcuts
    SHORTCUTS: {
        SEARCH: { key: 'k', modifiers: ['cmd', 'ctrl'] },
        UPLOAD: { key: 'u', modifiers: ['cmd', 'ctrl'] },
        HELP: { key: '?', modifiers: ['shift'] },
        ESCAPE: { key: 'Escape' }
    }
};

// --- GLOBAL UTILITY FUNCTIONS ---

/**
 * Determines the forecast horizon category based on the number of days out.
 * @param {number} daysOut - The number of days from the 'as of' date.
 * @returns {string} The name of the forecast horizon.
 */
window.getHorizonFromDaysOut = function(daysOut) {
    for (const [key, config] of Object.entries(AppConstants.HORIZON_DEFINITIONS)) {
        if (daysOut >= config.min && daysOut <= config.max) {
            return AppConstants.FORECAST_HORIZONS[key];
        }
    }
    return AppConstants.FORECAST_HORIZONS.LONG_TERM;
};

/**
 * Formats a number with a specified number of decimal places.
 * @param {number|null|undefined} value - The number to format.
 * @param {number} [decimals=1] - The number of decimal places.
 * @returns {string} The formatted number as a string, or 'N/A'.
 */
window.formatNumber = function(value, decimals = 1) {
    if (value === null || value === undefined) return 'N/A';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Formats a number as a percentage string.
 * @param {number|null|undefined} value - The number to format.
 * @param {number} [decimals=1] - The number of decimal places.
 * @returns {string} The formatted percentage string, or 'N/A'.
 */
window.formatPercentage = function(value, decimals = 1) {
    if (value === null || value === undefined) return 'N/A';
    return window.formatNumber(value, decimals) + '%';
};

/**
 * Formats a date string into a more readable format, handling timezone issues.
 * @param {string|Date|null|undefined} dateString - The date to format.
 * @param {string} [format='short'] - The desired format ('short', 'long', 'iso').
 * @returns {string} The formatted date string, or 'N/A'.
 */
window.formatDate = function(dateString, format = 'short') {
    if (!dateString) return 'N/A';
    
    // To prevent timezone issues, parse YYYY-MM-DD by replacing hyphens,
    // which helps browsers interpret it in the local timezone consistently.
    const date = dateString instanceof Date ? dateString : new Date(dateString.replace(/-/g, '/'));
    
    // Check for invalid date
    if (isNaN(date.getTime())) return 'N/A';
    
    switch (format) {
        case 'long':
            return date.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'iso':
            // To get the correct YYYY-MM-DD in the local timezone
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        case 'short':
        default:
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

console.log('✅ Application constants and utilities loaded.');