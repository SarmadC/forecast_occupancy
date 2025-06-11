// Application constants
window.AppConstants = {
    DATABASE: {
        TABLE_NAME: 'occupancy_forecasts',
        BATCH_SIZE: 1000,
        MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
    },
    
    FORECAST_HORIZONS: {
        HISTORICAL: 'Historical',
        NEAR_TERM: 'Near_Term',
        MEDIUM_TERM: 'Medium_Term',
        LONG_TERM: 'Long_Term'
    },

    MARKET_SEGMENTS: ['Totals', 'Transient', 'Group_Sold', 'Unsold_Block', 'Other'],
    
    CITIES: ['Edmonton', 'Calgary', 'Vancouver'],
    
    CHART_COLORS: {
        PRIMARY: '#3b82f6',
        SUCCESS: '#10b981',
        WARNING: '#f59e0b',
        ERROR: '#ef4444',
        PURPLE: '#8b5cf6'
    },

    ROUTES: {
        DASHBOARD: './index.html',
        UPLOADER: './upload.html',
        ADMIN: './admin.html'
    }
};