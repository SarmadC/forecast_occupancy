/**
 * Application Constants
 * Central configuration for the entire application
 */
window.AppConstants = {
    // Database Configuration
    DATABASE: {
        TABLE_NAME: 'occupancy_forecasts',
        BATCH_SIZE: 1000,
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
        TIMEOUT: 30000 // 30 seconds
    },
    
    // Business Logic Constants
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
    
    SEGMENT_COLORS: {
        'Totals': '#1e40af',
        'Transient': '#3b82f6',
        'Group_Sold': '#10b981',
        'Unsold_Block': '#f59e0b',
        'Other': '#8b5cf6'
    },
    
    // Default cities (can be extended dynamically)
    CITIES: ['Edmonton', 'Calgary', 'Vancouver', 'Toronto', 'Montreal'],
    
    // UI Theme Colors
    COLORS: {
        PRIMARY: '#3b82f6',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        PURPLE: '#8b5cf6',
        GRAY: '#6b7280',
        
        // Gradients
        BG_GRADIENT: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        CARD_GRADIENT: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)'
    },

    // Application Routes
    ROUTES: {
        DASHBOARD: './index.html',
        UPLOADER: './upload.html',
        ADMIN: './admin.html'
    },

    // Chart Configuration
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

    // Data Validation Rules
    VALIDATION: {
        OCCUPANCY_MIN: 0,
        OCCUPANCY_MAX: 100,
        VARIANCE_MIN: -50,
        VARIANCE_MAX: 50,
        REQUIRED_COLUMNS: ['as_of_date', 'city', 'forecast_date', 'market_segment', 'current_occupancy']
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        SUPABASE_URL: 'supabase_url',
        SUPABASE_KEY: 'supabase_key',
        USER_PREFERENCES: 'user_preferences',
        LAST_FILTERS: 'last_filters'
    },

    // Error Messages
    ERROR_MESSAGES: {
        CONNECTION_FAILED: 'Failed to connect to database. Please check your configuration.',
        FILE_TOO_LARGE: 'File is too large. Maximum size is 50MB.',
        INVALID_FILE_FORMAT: 'Invalid file format. Please upload Excel (.xlsx) files only.',
        DATA_ALREADY_EXISTS: 'Data for this report already exists in the database.',
        NETWORK_ERROR: 'Network error. Please check your internet connection.',
        VALIDATION_ERROR: 'Data validation failed. Please check your file format.'
    },

    // Success Messages
    SUCCESS_MESSAGES: {
        CONNECTION_SUCCESS: 'Successfully connected to database!',
        FILE_UPLOADED: 'File uploaded successfully!',
        DATA_REFRESHED: 'Dashboard data refreshed!',
        CONFIG_SAVED: 'Configuration saved successfully!'
    }
};

// Utility function to get horizon category from days out
window.getHorizonFromDaysOut = function(daysOut) {
    for (const [key, config] of Object.entries(AppConstants.HORIZON_DEFINITIONS)) {
        if (daysOut >= config.min && daysOut <= config.max) {
            return AppConstants.FORECAST_HORIZONS[key];
        }
    }
    return AppConstants.FORECAST_HORIZONS.LONG_TERM;
};

// Utility function to format numbers
window.formatNumber = function(value, decimals = 1) {
    if (value === null || value === undefined) return 'N/A';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

// Utility function to format percentages
window.formatPercentage = function(value, decimals = 1) {
    if (value === null || value === undefined) return 'N/A';
    return formatNumber(value, decimals) + '%';
};

// Utility function to format dates
window.formatDate = function(dateString, format = 'short') {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    switch (format) {
        case 'short':
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'long':
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        case 'iso':
            return date.toISOString().split('T')[0];
        default:
            return date.toLocaleDateString();
    }
};

console.log('✅ Constants loaded successfully');