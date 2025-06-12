/**
 * @file shared-components.js
 * @description This file contains the SharedComponents class which provides reusable, static UI components
 * used across the entire application, such as navigation, modals, alerts, and data displays.
 * It also includes global helper functions to easily invoke these components.
 */

/**
 * Shared UI Components
 * A static class providing methods to generate HTML for reusable components.
 */
class SharedComponents {
    
    /**
     * Creates the main navigation bar for the application.
     * @param {string} [currentPage='dashboard'] - The identifier for the currently active page.
     * @returns {string} The HTML string for the navigation bar.
     */
    static createNavigation(currentPage = 'dashboard') {
        const navItems = [
            { id: 'dashboard', label: '📊 Dashboard', route: window.AppConstants?.ROUTES?.DASHBOARD || 'index.html' },
            { id: 'uploader', label: '📁 Upload Data', route: window.AppConstants?.ROUTES?.UPLOADER || 'upload.html' }
        ];

        const connectionStatus = window.SupabaseConfig?.isConfigured() ? 
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
                            <a href="${item.route}" class="nav-link ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
                                <span class="nav-icon">${item.label.split(' ')[0]}</span>
                                <span class="nav-text">${item.label.substring(item.label.indexOf(' ') + 1)}</span>
                            </a>
                        `).join('')}
                    </div>
                    <div class="nav-status">
                        ${connectionStatus}
                        <button onclick="showConfigModal()" class="nav-config-btn" title="Configure Connection">⚙️</button>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Creates a full-screen loading overlay.
     * @param {string} [message='Loading...'] - The message to display.
     * @param {number|null} [progress=null] - A value from 0-100 to show a progress bar.
     * @returns {string} The HTML string for the loading overlay.
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
            <div id="loadingOverlay" class="loading-overlay">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-message">${message}</div>
                    ${progressBar}
                </div>
            </div>
        `;
    }

    /**
     * Creates a dismissible alert notification.
     * @param {string} message - The alert message.
     * @param {string} [type='info'] - The alert type ('success', 'error', 'warning', 'info').
     * @param {number} [duration=5000] - Auto-dismiss duration in ms. 0 for permanent.
     * @param {Array<object>} [actions=[]] - Action buttons to add to the alert.
     * @returns {string} The HTML string for the alert.
     */
    static createAlert(message, type = 'info', duration = 5000, actions = []) {
        const alertIcons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const alertId = 'alert_' + Date.now();
        
        if (duration > 0) {
            setTimeout(() => {
                const alertEl = document.getElementById(alertId);
                if (alertEl) {
                    alertEl.classList.add('alert-exit');
                    setTimeout(() => alertEl.remove(), 300);
                }
            }, duration);
        }

        return `
            <div id="${alertId}" class="alert alert-${type}" role="alert">
                <div class="alert-icon">${alertIcons[type]}</div>
                <div class="alert-message">${message}</div>
                <button onclick="this.parentElement.remove()" class="alert-close">×</button>
            </div>
        `;
    }

    /**
     * Creates the configuration modal for Supabase credentials.
     * @returns {string} The HTML string for the configuration modal.
     */
    static createConfigModal() {
        const currentConfig = window.SupabaseConfig?.getStatus() || { connected: false, url: '', key: '' };
        
        return `
            <div id="configModal" class="modal-overlay">
                <div class="modal-backdrop" onclick="closeConfigModal()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔧 Database Configuration</h2>
                        <button onclick="closeConfigModal()" class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="configForm" class="form">
                             <div class="form-group">
                                 <label for="modalSupabaseUrl" class="form-label">Supabase Project URL</label>
                                 <input type="url" id="modalSupabaseUrl" required class="form-input"
                                     placeholder="https://your-project.supabase.co"
                                     value="${currentConfig.url || ''}">
                             </div>
                             <div class="form-group">
                                 <label for="modalSupabaseKey" class="form-label">Anon/Public Key</label>
                                 <input type="password" id="modalSupabaseKey" required class="form-input"
                                     placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                     value="${currentConfig.key || ''}">
                             </div>
                             <div class="form-actions">
                                 <button type="button" onclick="testConfigConnection()" class="btn btn-secondary">Test Connection</button>
                                 <button type="submit" class="btn btn-primary">Save Configuration</button>
                             </div>
                        </form>
                        <div id="connectionTestResult" style="margin-top: 1rem;"></div>
                    </div>
                </div>
            </div>
        `;
    }
     /**
     * Creates a metric card component.
     * @param {object} config - The configuration for the metric card.
     * @returns {string} The HTML for the metric card.
     */
    static createMetricCard(config) {
        const { title, value, icon, color = 'blue' } = config;
        return `
            <div class="metric-card metric-card-${color}">
                <div class="metric-header">
                    <div class="metric-info">
                        <h3 class="metric-title">${title}</h3>
                        <div class="metric-value">${value}</div>
                    </div>
                    <div class="metric-icon">${icon}</div>
                </div>
            </div>
        `;
    }

    /**
     * Creates an empty state component.
     * @param {object} config - Configuration for the empty state.
     * @returns {string} The HTML for the empty state.
     */
    static createEmptyState(config) {
        const { icon, title, message, actions = [] } = config;
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3 class="empty-title">${title}</h3>
                <p class="empty-message">${message}</p>
                <div class="empty-actions">
                    ${actions.map(action => `<button onclick="${action.onClick}" class="btn btn-${action.type || 'primary'}">${action.label}</button>`).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Creates a data table.
     * @param {object} config - Configuration for the data table.
     * @returns {string} The HTML for the data table.
     */
    static createDataTable(config) {
        const { data, columns, title } = config;
        return `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>${title}</h3>
                </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    ${columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}


// --- GLOBAL HELPER FUNCTIONS ---

/**
 * Initializes the current page by rendering the navigation, checking for configuration,
 * and verifying user permissions. This is the entry point for all page scripts.
 * @param {string} pageName - A name for the page being initialized (e.g., 'dashboard', 'uploader').
 * @returns {boolean} True if initialization can proceed, false otherwise.
 */
function initializePage(pageName) {
    console.log(`Initializing ${pageName} page...`);

    // Render the main navigation on every page.
    const navContainer = document.getElementById('navigation');
    if (navContainer) {
        navContainer.innerHTML = SharedComponents.createNavigation(pageName);
    }

    // Check if Supabase is configured. If not, show a permanent alert and stop.
    if (!window.SupabaseConfig.isConfigured()) {
        showAlert('Database not configured. Please set up your connection.', 'warning', 0, [{
            label: 'Configure Now',
            type: 'primary',
            onClick: 'showConfigModal()'
        }]);
        return false;
    }

    // If configured, proceed with checking permissions.
    checkPagePermissions();
    
    return true;
}

/**
 * Checks if the current user has the required role to view the current page.
 * This is called automatically by initializePage.
 */
async function checkPagePermissions() {
    const isUploadPage = window.location.pathname.includes('upload.html');
    
    // Only protect the upload page for now. Other pages are public.
    if (isUploadPage) {
        const role = await getUserRole(); // Uses the function from supabase.js
        const authorizedRoles = ['admin', 'uploader'];

        if (!authorizedRoles.includes(role)) {
            // Block the main content and show an access denied message.
            const mainContent = document.querySelector('main');
            if (mainContent) {
                mainContent.innerHTML = SharedComponents.createEmptyState({
                    icon: '🚫',
                    title: 'Access Denied',
                    message: 'You do not have permission to view this page. Redirecting to the dashboard...',
                });
            }
            
            // Redirect after a short delay so the user can read the message.
            setTimeout(() => {
                window.location.href = AppConstants.ROUTES.DASHBOARD; 
            }, 3000);
        }
    }
}

function showLoading(message = 'Loading...', progress = null) {
    hideLoading();
    const overlay = document.createElement('div');
    overlay.innerHTML = SharedComponents.createLoadingOverlay(message, progress);
    document.body.appendChild(overlay.firstElementChild);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('loading-exit');
        setTimeout(() => overlay.remove(), 300);
    }
}

function updateLoadingProgress(progress, message) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const loadingMessage = document.querySelector('.loading-message');
    
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = Math.round(progress) + '%';
    if (loadingMessage && message) loadingMessage.textContent = message;
}

function showAlert(message, type = 'info', duration = 5000, actions = []) {
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
}

function showConfigModal() {
    const existing = document.getElementById('configModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.innerHTML = SharedComponents.createConfigModal();
    document.body.appendChild(modal.firstElementChild);
    
    document.getElementById('configForm').onsubmit = handleConfigSubmit;
}

function closeConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) {
        modal.classList.add('modal-exit');
        setTimeout(() => modal.remove(), 300);
    }
}

async function handleConfigSubmit(e) {
    e.preventDefault();
    const url = document.getElementById('modalSupabaseUrl').value.trim();
    const key = document.getElementById('modalSupabaseKey').value.trim();
    
    if (!url || !key) {
        showAlert('Please provide both URL and API key', 'error');
        return;
    }
    
    showLoading('Saving and verifying connection...');
    try {
        window.SupabaseConfig.configure(url, key);
        await window.SupabaseConfig.testConnection();
        hideLoading();
        closeConfigModal();
        showAlert(window.AppConstants.SUCCESS_MESSAGES.CONFIG_SAVED, 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        hideLoading();
        showAlert(`Configuration failed: ${error.message}`, 'error');
    }
}

async function testConfigConnection() {
    const url = document.getElementById('modalSupabaseUrl').value.trim();
    const key = document.getElementById('modalSupabaseKey').value.trim();
    const resultDiv = document.getElementById('connectionTestResult');
    
    if (!url || !key) {
        showAlert('Please provide both URL and API key to test.', 'error');
        return;
    }

    resultDiv.textContent = 'Testing...';
    try {
        const tempClient = supabase.createClient(url, key);
        const { error } = await tempClient.from(AppConstants.DATABASE.TABLE_NAME).select('id').limit(1);
        if (error && error.code !== '42P01') throw error;
        resultDiv.textContent = '✅ Connection successful!';
        resultDiv.style.color = 'var(--success-color)';
    } catch (error) {
        resultDiv.textContent = `❌ Connection failed: ${error.message}`;
        resultDiv.style.color = 'var(--error-color)';
    }
}

console.log('✅ Shared components (v4) loaded.');
