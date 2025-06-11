/**
 * Shared UI Components
 * Reusable components used across all pages
 */
class SharedComponents {
    
    /**
     * Create navigation bar
     */
    static createNavigation(currentPage = 'dashboard') {
        const navItems = [
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊', route: AppConstants.ROUTES.DASHBOARD },
            { id: 'uploader', label: '📁 Upload Data', icon: '📁', route: AppConstants.ROUTES.UPLOADER },
            { id: 'admin', label: '⚙️ Settings', icon: '⚙️', route: AppConstants.ROUTES.ADMIN }
        ];

        const connectionStatus = SupabaseConfig.isConfigured() ? 
            '<span class="connection-status connected">🟢 Connected</span>' : 
            '<span class="connection-status disconnected">🔴 Not Connected</span>';

        return `
            <nav class="nav-bar">
                <div class="nav-container">
                    <div class="nav-brand">
                        <div class="nav-logo">🏨 Occupancy Analytics</div>
                        <div class="nav-subtitle">Forecast Intelligence Platform</div>
                    </div>
                    <div class="nav-links">
                        ${navItems.map(item => `
                            <a href="${item.route}" class="nav-link ${currentPage === item.id ? 'active' : ''}" 
                               data-page="${item.id}">
                                <span class="nav-icon">${item.icon}</span>
                                <span class="nav-text">${item.label}</span>
                            </a>
                        `).join('')}
                    </div>
                    <div class="nav-status">
                        ${connectionStatus}
                        <button onclick="showConfigModal()" class="nav-config-btn" title="Configure Connection">
                            ⚙️
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Create loading overlay
     */
    static createLoadingOverlay(message = 'Loading...', progress = null) {
        const progressBar = progress !== null ? `
            <div class="loading-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${Math.round(progress)}%</div>
            </div>
        ` : '';

        return `
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-backdrop"></div>
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                    ${progressBar}
                </div>
            </div>
        `;
    }

    /**
     * Create alert notification
     */
    static createAlert(message, type = 'info', duration = 5000, actions = []) {
        const alertIcons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const actionButtons = actions.length > 0 ? `
            <div class="alert-actions">
                ${actions.map(action => `
                    <button onclick="${action.onClick}" class="alert-btn alert-btn-${action.type || 'secondary'}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        ` : '';

        const alertId = 'alert_' + Date.now();
        
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.classList.add('alert-exit');
                setTimeout(() => alert.remove(), 300);
            }
        }, duration);

        return `
            <div id="${alertId}" class="alert alert-${type}" role="alert">
                <div class="alert-content">
                    <span class="alert-icon">${alertIcons[type]}</span>
                    <span class="alert-message">${message}</span>
                    <button onclick="document.getElementById('${alertId}').remove()" class="alert-close">×</button>
                </div>
                ${actionButtons}
            </div>
        `;
    }

    /**
     * Create configuration modal
     */
    static createConfigModal() {
        const currentConfig = SupabaseConfig.getStatus();
        
        return `
            <div id="configModal" class="modal-overlay">
                <div class="modal-backdrop" onclick="closeConfigModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔧 Database Configuration</h2>
                        <button onclick="closeConfigModal()" class="modal-close">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="config-status">
                            <div class="status-item">
                                <span class="status-label">Current Status:</span>
                                <span class="status-value ${currentConfig.connected ? 'connected' : 'disconnected'}">
                                    ${currentConfig.connected ? '🟢 Connected' : '🔴 Disconnected'}
                                </span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Database URL:</span>
                                <span class="status-value">${currentConfig.url}</span>
                            </div>
                        </div>

                        <form id="configForm" class="config-form">
                            <div class="form-group">
                                <label for="modalSupabaseUrl" class="form-label">
                                    Supabase Project URL
                                    <span class="form-hint">Found in Project Settings → API</span>
                                </label>
                                <input type="url" id="modalSupabaseUrl" name="url" required
                                    placeholder="https://your-project.supabase.co"
                                    value="${SupabaseConfig.url}"
                                    class="form-input">
                            </div>
                            
                            <div class="form-group">
                                <label for="modalSupabaseKey" class="form-label">
                                    Anon/Public Key
                                    <span class="form-hint">Found in Project Settings → API</span>
                                </label>
                                <input type="password" id="modalSupabaseKey" name="key" required
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    value="${SupabaseConfig.key}"
                                    class="form-input">
                                <button type="button" onclick="togglePasswordVisibility('modalSupabaseKey')" 
                                    class="password-toggle">👁️</button>
                            </div>

                            <div class="form-actions">
                                <button type="button" onclick="testConfigConnection()" 
                                    class="btn btn-secondary" id="testConnectionBtn">
                                    🔍 Test Connection
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    💾 Save Configuration
                                </button>
                            </div>
                        </form>

                        <div id="connectionTestResult" class="test-result" style="display: none;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create metric card
     */
    static createMetricCard(config) {
        const {
            title,
            value,
            subtitle = '',
            trend = null,
            icon = '📊',
            color = 'blue',
            size = 'normal',
            onClick = null
        } = config;

        const trendIndicator = trend !== null ? `
            <div class="metric-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}">
                <span class="trend-icon">${trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}</span>
                <span class="trend-value">${trend > 0 ? '+' : ''}${formatNumber(trend, 1)}%</span>
            </div>
        ` : '';

        const clickHandler = onClick ? `onclick="${onClick}"` : '';
        const clickableClass = onClick ? 'metric-card-clickable' : '';

        return `
            <div class="metric-card metric-card-${color} metric-card-${size} ${clickableClass}" ${clickHandler}>
                <div class="metric-header">
                    <div class="metric-info">
                        <h3 class="metric-title">${title}</h3>
                        <div class="metric-value">${value}</div>
                        ${subtitle ? `<div class="metric-subtitle">${subtitle}</div>` : ''}
                        ${trendIndicator}
                    </div>
                    <div class="metric-icon">
                        ${icon}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create filter panel
     */
    static createFilterPanel(filters, onFilterChange) {
        return `
            <div class="filter-panel">
                <div class="filter-header">
                    <h3>🔍 Filters</h3>
                    <button onclick="resetFilters()" class="btn btn-sm btn-secondary">Reset</button>
                </div>
                <div class="filter-grid">
                    ${filters.map(filter => `
                        <div class="filter-group">
                            <label class="filter-label">
                                <span class="filter-icon">${filter.icon}</span>
                                ${filter.label}
                            </label>
                            ${this.createFilterInput(filter, onFilterChange)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create filter input based on type
     */
    static createFilterInput(filter, onFilterChange) {
        const changeHandler = `onchange="${onFilterChange}('${filter.key}', this.value)"`;
        
        switch (filter.type) {
            case 'select':
                return `
                    <select id="filter_${filter.key}" class="filter-select" ${changeHandler}>
                        ${filter.options.map(option => `
                            <option value="${option.value}" ${option.value === filter.defaultValue ? 'selected' : ''}>
                                ${option.label}
                            </option>
                        `).join('')}
                    </select>
                `;
            case 'date':
                return `
                    <input type="date" id="filter_${filter.key}" class="filter-input" 
                        value="${filter.defaultValue || ''}" ${changeHandler}>
                `;
            case 'daterange':
                return `
                    <div class="date-range">
                        <input type="date" id="filter_${filter.key}_start" class="filter-input" 
                            placeholder="Start date" ${changeHandler}>
                        <input type="date" id="filter_${filter.key}_end" class="filter-input" 
                            placeholder="End date" ${changeHandler}>
                    </div>
                `;
            default:
                return `
                    <input type="text" id="filter_${filter.key}" class="filter-input" 
                        placeholder="${filter.placeholder || ''}" 
                        value="${filter.defaultValue || ''}" ${changeHandler}>
                `;
        }
    }

    /**
     * Create data table
     */
    static createDataTable(config) {
        const { data, columns, title, exportable = true, searchable = true } = config;
        
        const tableId = 'table_' + Date.now();
        
        const searchBar = searchable ? `
            <div class="table-search">
                <input type="text" placeholder="Search..." class="search-input" 
                    oninput="filterTable('${tableId}', this.value)">
            </div>
        ` : '';

        const exportButton = exportable ? `
            <button onclick="exportTableToCSV('${tableId}', '${title}')" class="btn btn-sm btn-secondary">
                📊 Export CSV
            </button>
        ` : '';

        return `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>${title}</h3>
                    <div class="table-actions">
                        ${searchBar}
                        ${exportButton}
                    </div>
                </div>
                <div class="table-wrapper">
                    <table id="${tableId}" class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `
                                    <th class="sortable" onclick="sortTable('${tableId}', '${col.key}')">
                                        ${col.label}
                                        <span class="sort-indicator">↕️</span>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    ${columns.map(col => `
                                        <td class="table-cell-${col.type || 'text'}">
                                            ${this.formatCellValue(row[col.key], col.type, col.format)}
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="table-footer">
                    <span class="table-info">Showing ${data.length} records</span>
                </div>
            </div>
        `;
    }

    /**
     * Format cell value based on type
     */
    static formatCellValue(value, type, format) {
        if (value === null || value === undefined) return '-';
        
        switch (type) {
            case 'percentage':
                return formatPercentage(value, format?.decimals || 1);
            case 'number':
                return formatNumber(value, format?.decimals || 0);
            case 'date':
                return formatDate(value, format?.style || 'short');
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: format?.currency || 'USD'
                }).format(value);
            default:
                return String(value);
        }
    }

    /**
     * Create empty state
     */
    static createEmptyState(config) {
        const {
            icon = '📊',
            title = 'No Data Available',
            message = 'There is no data to display at the moment.',
            actions = []
        } = config;

        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-message">${message}</p>
                ${actions.length > 0 ? `
                    <div class="empty-actions">
                        ${actions.map(action => `
                            <button onclick="${action.onClick}" class="btn btn-${action.type || 'primary'}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Global utility functions for shared components

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...', progress = null) {
    hideLoading(); // Remove any existing overlay
    
    const overlay = document.createElement('div');
    overlay.innerHTML = SharedComponents.createLoadingOverlay(message, progress);
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('loading-exit');
        setTimeout(() => overlay.remove(), 300);
    }
}

/**
 * Update loading progress
 */
function updateLoadingProgress(progress, message) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const loadingMessage = document.querySelector('.loading-message');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.round(progress) + '%';
    if (loadingMessage && message) loadingMessage.textContent = message;
}

/**
 * Show alert notification
 */
function showAlert(message, type = 'info', duration = 5000, actions = []) {
    // Create alerts container if it doesn't exist
    let container = document.getElementById('alertsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'alertsContainer';
        container.className = 'alerts-container';
        document.body.appendChild(container);
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = SharedComponents.createAlert(message, type, duration, actions);
    container.appendChild(alertDiv.firstElementChild);
    
    return alertDiv.firstElementChild;
}

/**
 * Show configuration modal
 */
function showConfigModal() {
    // Remove existing modal
    const existing = document.getElementById('configModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.innerHTML = SharedComponents.createConfigModal();
    document.body.appendChild(modal.firstElementChild);
    
    // Setup form handler
    document.getElementById('configForm').onsubmit = handleConfigSubmit;
}

/**
 * Close configuration modal
 */
function closeConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) {
        modal.classList.add('modal-exit');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Handle configuration form submission
 */
async function handleConfigSubmit(e) {
    e.preventDefault();
    
    const url = document.getElementById('modalSupabaseUrl').value.trim();
    const key = document.getElementById('modalSupabaseKey').value.trim();
    
    if (!url || !key) {
        showAlert('Please provide both URL and API key', 'error');
        return;
    }
    
    try {
        showLoading('Configuring connection...');
        
        SupabaseConfig.configure(url, key);
        await SupabaseConfig.testConnection();
        
        hideLoading();
        closeConfigModal();
        showAlert(AppConstants.SUCCESS_MESSAGES.CONFIG_SAVED, 'success');
        
        // Trigger page refresh or data reload
        if (typeof onConfigUpdate === 'function') {
            onConfigUpdate();
        } else {
            location.reload();
        }
        
    } catch (error) {
        hideLoading();
        showAlert(`Configuration failed: ${error.message}`, 'error');
    }
}

/**
 * Test configuration connection
 */
async function testConfigConnection() {
    const url = document.getElementById('modalSupabaseUrl').value.trim();
    const key = document.getElementById('modalSupabaseKey').value.trim();
    
    if (!url || !key) {
        showAlert('Please provide both URL and API key', 'error');
        return;
    }
    
    const testBtn = document.getElementById('testConnectionBtn');
    const resultDiv = document.getElementById('connectionTestResult');
    
    testBtn.textContent = '🔄 Testing...';
    testBtn.disabled = true;
    
    try {
        // Temporarily configure for testing
        const tempConfig = new SupabaseConfig();
        tempConfig.configure(url, key);
        await tempConfig.testConnection();
        
        resultDiv.innerHTML = `
            <div class="test-success">
                ✅ Connection successful! Database is accessible.
            </div>
        `;
        resultDiv.style.display = 'block';
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="test-error">
                ❌ Connection failed: ${error.message}
            </div>
        `;
        resultDiv.style.display = 'block';
    } finally {
        testBtn.textContent = '🔍 Test Connection';
        testBtn.disabled = false;
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

/**
 * Check if Supabase is configured
 */
function checkSupabaseConfig() {
    if (!SupabaseConfig.isConfigured()) {
        showAlert(
            'Database not configured. Please set up your connection.',
            'warning',
            0,
            [{
                label: 'Configure Now',
                type: 'primary',
                onClick: 'showConfigModal()'
            }]
        );
        return false;
    }
    return true;
}

/**
 * Initialize page with navigation
 */
function initializePage(pageName) {
    // Inject navigation
    const navContainer = document.getElementById('navigation');
    if (navContainer) {
        navContainer.innerHTML = SharedComponents.createNavigation(pageName);
    }
    
    // Check configuration
    return checkSupabaseConfig();
}

console.log('✅ Shared components loaded');