// Shared UI components used across pages
class SharedComponents {
    static createNavigation(currentPage = 'dashboard') {
        return `
            <nav class="nav-bar">
                <div class="nav-container">
                    <div class="nav-logo">🏨 Occupancy Analytics</div>
                    <div class="nav-links">
                        <a href="${AppConstants.ROUTES.DASHBOARD}" class="nav-link ${currentPage === 'dashboard' ? 'active' : ''}">
                            📊 Dashboard
                        </a>
                        <a href="${AppConstants.ROUTES.UPLOADER}" class="nav-link ${currentPage === 'uploader' ? 'active' : ''}">
                            📁 Upload Data
                        </a>
                        <a href="${AppConstants.ROUTES.ADMIN}" class="nav-link ${currentPage === 'admin' ? 'active' : ''}">
                            ⚙️ Admin
                        </a>
                    </div>
                </div>
            </nav>
        `;
    }

    static createLoadingOverlay(message = 'Loading...') {
        return `
            <div class="loading-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.5); display: flex; align-items: center;
                justify-content: center; z-index: 9999;">
                <div class="loading-content" style="
                    background: white; padding: 32px; border-radius: 12px; text-align: center;">
                    <div class="loading-spinner"></div>
                    <div style="margin-top: 16px; color: var(--text-primary);">${message}</div>
                </div>
            </div>
        `;
    }

    static createAlert(message, type = 'info', duration = 5000) {
        const alertColors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${alertColors[type]}; color: white; padding: 16px 24px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        alert.textContent = message;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, duration);

        return alert;
    }

    static createConfigModal() {
        return `
            <div id="configModal" class="modal-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7); display: flex; align-items: center;
                justify-content: center; z-index: 10000;">
                <div class="modal-content card" style="max-width: 500px; width: 90%;">
                    <h3 style="margin-bottom: 24px; color: var(--primary-color);">
                        🔧 Configure Supabase Connection
                    </h3>
                    <form id="configForm">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                                Supabase URL:
                            </label>
                            <input type="url" id="modalSupabaseUrl" required
                                placeholder="https://your-project.supabase.co"
                                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; 
                                       border-radius: 8px; font-size: 14px;">
                        </div>
                        <div style="margin-bottom: 24px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                                Anon Key:
                            </label>
                            <input type="password" id="modalSupabaseKey" required
                                placeholder="Your anon key"
                                style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; 
                                       border-radius: 8px; font-size: 14px;">
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" onclick="closeConfigModal()" 
                                style="background: #6b7280; color: white; border: none; 
                                       padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                                Cancel
                            </button>
                            <button type="submit" class="btn">
                                Save & Connect
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}

// Global utility functions
function showLoading(message) {
    const existing = document.getElementById('loadingOverlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = SharedComponents.createLoadingOverlay(message);
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
}

function showAlert(message, type = 'info') {
    return SharedComponents.createAlert(message, type);
}

function checkSupabaseConfig() {
    if (!SupabaseConfig.isConfigured()) {
        showConfigModal();
        return false;
    }
    return true;
}

function showConfigModal() {
    const existing = document.getElementById('configModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.innerHTML = SharedComponents.createConfigModal();
    document.body.appendChild(modal);
    
    // Pre-fill existing values
    document.getElementById('modalSupabaseUrl').value = SupabaseConfig.url;
    document.getElementById('modalSupabaseKey').value = SupabaseConfig.key;
    
    // Handle form submission
    document.getElementById('configForm').onsubmit = function(e) {
        e.preventDefault();
        const url = document.getElementById('modalSupabaseUrl').value;
        const key = document.getElementById('modalSupabaseKey').value;
        
        try {
            SupabaseConfig.initialize(url, key);
            closeConfigModal();
            showAlert('Supabase configuration saved!', 'success');
            
            // Trigger page refresh or data reload
            if (typeof onConfigUpdate === 'function') {
                onConfigUpdate();
            }
        } catch (error) {
            showAlert('Invalid configuration: ' + error.message, 'error');
        }
    };
}

function closeConfigModal() {
    const modal = document.getElementById('configModal');
    if (modal) modal.remove();
}