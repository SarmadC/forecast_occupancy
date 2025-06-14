/**
 * Enhanced Shared Components with modern UI elements
 */
class SharedComponents {
    /**
     * Creates the enhanced navigation bar with theme toggle
     */
    static createNavigation(currentPage = 'dashboard') {
        const navItems = [
            { id: 'dashboard', label: '📊 Dashboard', route: window.AppConstants?.ROUTES?.DASHBOARD || 'index.html' },
            { id: 'uploader', label: '📁 Upload Data', route: window.AppConstants?.ROUTES?.UPLOADER || 'upload.html' }
        ];
        const connectionStatus = window.SupabaseConfig?.isConfigured() ?
            '<span class="connection-status connected">Connected</span>' :
            '<span class="connection-status disconnected">Not Connected</span>';
        
        // **FIXED**: The onclick handler now calls the new global showConfigModal() function
        return `
            <nav class="nav-bar">
                <div class="nav-container">
                    <div class="nav-brand">
                        <h1 class="nav-logo">🏨 Occupancy Analytics</h1>
                        <p class="nav-subtitle">Forecast Intelligence Platform</p>
                    </div>
                    <div class="nav-links">
                        ${navItems.map(item => `
                            <a href="${item.route}" class="nav-link ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
                                ${item.label}
                            </a>
                        `).join('')}
                    </div>
                    <div class="nav-status">
                        ${connectionStatus}
                        <div class="nav-actions">
                            <button onclick="window.toggleTheme()" class="theme-toggle" title="Toggle Theme">
                                <span class="theme-icon-light">☀️</span>
                                <span class="theme-icon-dark" style="display: none;">🌙</span>
                            </button>
                            <button onclick="showConfigModal()" class="nav-config-btn" title="Configure Connection">
                                ⚙️
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Creates the configuration modal window.
     */
    static createConfigModal() {
        const status = window.SupabaseConfig.getStatus();
        return `
            <div id="configModal" class="modal-overlay" style="display: none;">
                <div class="modal-content animate-scaleIn">
                    <div class="modal-header">
                        <h2>Database Connection</h2>
                        <button class="modal-close" onclick="hideConfigModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Enter your Supabase project URL and Public Anon Key to connect to your database. These are stored securely in your browser's local storage.</p>
                        <form id="config-form">
                            <div class="form-group">
                                <label for="supabase-url" class="form-label">Supabase URL</label>
                                <input type="url" id="supabase-url" class="form-input" required placeholder="https://your-project-ref.supabase.co" value="${status.url || ''}">
                            </div>
                            <div class="form-group">
                                <label for="supabase-key" class="form-label">Supabase Public Anon Key</label>
                                <input type="password" id="supabase-key" class="form-input" required placeholder="••••••••" value="${status.key || ''}">
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="hideConfigModal()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save & Test Connection</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Other component methods from your file ---
    static createLoadingOverlay(message = 'Loading...', progress = null) { /* ... Your existing code ... */ }
    static createAlert(message, type = 'info', duration = 5000) { /* ... Your existing code ... */ }
    static createMetricCard(config) { /* ... Your existing code ... */ }
    static createDataTable(config) { /* ... Your existing code ... */ }
    // ... etc.
}


// --- NEW HELPER FUNCTIONS ---

/**
 * Initializes common elements for a page, like the navigation bar.
 * This function was missing, causing a critical error.
 * @param {string} currentPage - The identifier for the current page.
 */
function initializePage(currentPage) {
    const navContainer = document.getElementById('navigation');
    if (navContainer) {
        navContainer.innerHTML = SharedComponents.createNavigation(currentPage);
    }
    
    // Check if Supabase is configured. If not, show the config modal automatically.
    if (!window.SupabaseConfig.isConfigured()) {
        showConfigModal(true); // `true` indicates it's the initial setup
    }
}

/**
 * Shows the configuration modal.
 * This function was missing.
 * @param {boolean} isInitialSetup - If true, shows a welcome message.
 */
function showConfigModal(isInitialSetup = false) {
    // Check if modal already exists
    if (!document.getElementById('configModal')) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = SharedComponents.createConfigModal();
        document.body.appendChild(modalContainer.firstElementChild);

        // Attach form submission listener
        document.getElementById('config-form').addEventListener('submit', handleConfigSave);
    }
    
    const modal = document.getElementById('configModal');
    modal.style.display = 'flex';

    if (isInitialSetup) {
        showAlert('Welcome! Please configure your database connection to begin.', 'info', 10000);
    }
}

/**
 * Hides the configuration modal.
 */
function hideConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Handles saving the configuration and testing the connection.
 * @param {Event} e - The form submission event.
 */
async function handleConfigSave(e) {
    e.preventDefault();
    const url = document.getElementById('supabase-url').value;
    const key = document.getElementById('supabase-key').value;

    showLoading('Saving and testing connection...');
    
    try {
        window.SupabaseConfig.configure(url, key);
        await window.SupabaseConfig.testConnection();
        
        hideLoading();
        showAlert('Connection successful! The page will now reload.', 'success');
        
        setTimeout(() => {
            location.reload();
        }, 2000);

    } catch (error) {
        hideLoading();
        showAlert(`Connection failed: ${error.message}`, 'error', 10000);
    }
}


// --- Your other existing helper functions ---
function showLoading(message = 'Loading...', progress = null) { /* ... */ }
function hideLoading() { /* ... */ }
function showAlert(message, type, duration) { /* ... */ }
// ... etc.

console.log('✅ Enhanced shared components loaded.');