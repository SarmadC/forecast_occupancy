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
                            <button onclick="toggleTheme()" class="theme-toggle" title="Toggle Theme">
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
     * Creates an enhanced loading overlay with progress ring
     */
    static createLoadingOverlay(message = 'Loading...', progress = null) {
        const progressElement = progress !== null ? `
            <svg class="progress-ring" viewBox="0 0 120 120">
                <circle class="progress-ring-circle" cx="60" cy="60" r="54"></circle>
                <circle class="progress-ring-progress" cx="60" cy="60" r="54"
                    stroke-dasharray="${339.292}"
                    stroke-dashoffset="${339.292 - (progress / 100) * 339.292}">
                </circle>
            </svg>
            <div class="progress-text">${Math.round(progress)}%</div>
        ` : '<div class="loading-spinner"></div>';

        return `
            <div id="loadingOverlay" class="loading-overlay">
                <div class="loading-content animate-scaleIn">
                    ${progressElement}
                    <div class="loading-message">${message}</div>
                </div>
            </div>
        `;
    }

    /**
     * Creates enhanced alert with better animations
     */
    static createAlert(message, type = 'info', duration = 5000, actions = []) {
        const alertIcons = { 
            success: '✅', 
            error: '❌', 
            warning: '⚠️', 
            info: 'ℹ️' 
        };
        const alertId = 'alert_' + Date.now();
        
        if (duration > 0) {
            setTimeout(() => {
                const alertEl = document.getElementById(alertId);
                if (alertEl) {
                    alertEl.style.animation = 'slideOutRight 0.3s ease forwards';
                    setTimeout(() => alertEl.remove(), 300);
                }
            }, duration);
        }

        return `
            <div id="${alertId}" class="alert alert-${type}" role="alert">
                <div class="alert-icon animate-bounce">${alertIcons[type]}</div>
                <div class="alert-message">${message}</div>
                <button onclick="this.parentElement.style.animation='slideOutRight 0.3s ease forwards'; setTimeout(() => this.parentElement.remove(), 300)" class="alert-close">×</button>
            </div>
        `;
    }

    /**
     * Creates enhanced metric card with sparkline support
     */
    static createMetricCard(config) {
        const { title, value, icon, trend, color = 'blue', sparklineData = null } = config;
        const sparkline = sparklineData ? `
            <div class="metric-sparkline">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        points="${sparklineData.map((v, i) => `${i * (100 / (sparklineData.length - 1))},${40 - (v * 40 / Math.max(...sparklineData))}`).join(' ')}"
                    />
                </svg>
            </div>
        ` : '';

        return `
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-info">
                        <h3 class="metric-title">${title}</h3>
                        <div class="metric-value">${value}</div>
                        ${trend ? `<div class="metric-trend ${trend.includes('+') ? 'positive' : trend.includes('-') ? 'negative' : ''}">${trend}</div>` : ''}
                    </div>
                    <div class="metric-icon-wrapper bg-${color}">
                        ${icon}
                    </div>
                </div>
                ${sparkline}
            </div>
        `;
    }

    /**
     * Creates skeleton loading states
     */
    static createSkeleton(type = 'text', customClass = '') {
        const types = {
            text: 'skeleton skeleton-text',
            title: 'skeleton skeleton-title',
            card: 'skeleton skeleton-card',
            chart: 'skeleton skeleton-chart'
        };
        
        return `<div class="${types[type] || types.text} ${customClass}"></div>`;
    }

    /**
     * Creates enhanced data table with search and sort
     */
    static createDataTable(config) {
        const { data, columns, title, searchable = true, sortable = true } = config;
        const tableId = 'table_' + Date.now();
        
        return `
            <div class="data-table-container">
                <div class="table-header">
                    <h3>${title}</h3>
                    <div class="table-actions">
                        ${searchable ? `<input type="text" class="table-search" placeholder="Search..." onkeyup="filterTable('${tableId}', this.value)">` : ''}
                    </div>
                </div>
                <div class="table-wrapper">
                    <table class="data-table" id="${tableId}">
                        <thead>
                            <tr>
                                ${columns.map((col, index) => `
                                    <th ${sortable ? `class="sortable" onclick="sortTable('${tableId}', ${index})"` : ''}>
                                        ${col.label}
                                    </th>
                                `).join('')}
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

    /**
     * Creates a floating action button
     */
    static createFAB(icon, onClick) {
        return `
            <button class="fab" onclick="${onClick}">
                ${icon}
            </button>
        `;
    }

    /**
     * Creates tooltip wrapper
     */
    static createTooltip(content, tooltipText) {
        return `
            <div class="tooltip">
                ${content}
                <span class="tooltip-content">${tooltipText}</span>
            </div>
        `;
    }

    /**
     * Creates breadcrumb navigation
     */
    static createBreadcrumb(items) {
        return `
            <nav class="breadcrumb">
                ${items.map((item, index) => `
                    ${index > 0 ? '<span class="breadcrumb-separator">›</span>' : ''}
                    ${item.link ? 
                        `<a href="${item.link}" class="breadcrumb-item">${item.label}</a>` : 
                        `<span class="breadcrumb-item breadcrumb-current">${item.label}</span>`
                    }
                `).join('')}
            </nav>
        `;
    }
}

// Enhanced helper functions
function showLoading(message = 'Loading...', progress = null) {
    if (loadingOverlayInstance) {
        const msgElement = loadingOverlayInstance.querySelector('.loading-message');
        if (msgElement) msgElement.textContent = message;

        if (progress !== null) {
            const progressCircle = loadingOverlayInstance.querySelector('.progress-ring-progress');
            if (progressCircle) {
                const circumference = 339.292;
                progressCircle.style.strokeDashoffset = circumference - (progress / 100) * circumference;
            }
            const progressText = loadingOverlayInstance.querySelector('.progress-text');
            if (progressText) progressText.textContent = `${Math.round(progress)}%`;
        }
    } else {
        const overlayContainer = document.createElement('div');
        overlayContainer.innerHTML = SharedComponents.createLoadingOverlay(message, progress);
        loadingOverlayInstance = overlayContainer.firstElementChild;
        document.body.appendChild(loadingOverlayInstance);
    }
}

// Table sorting function
function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const th = table.querySelectorAll('th')[columnIndex];
    
    const isAsc = th.classList.contains('asc');
    table.querySelectorAll('th').forEach(header => header.classList.remove('asc', 'desc'));
    
    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent;
        const bValue = b.cells[columnIndex].textContent;
        
        if (!isNaN(aValue) && !isNaN(bValue)) {
            return isAsc ? bValue - aValue : aValue - bValue;
        }
        return isAsc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    });
    
    th.classList.add(isAsc ? 'desc' : 'asc');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// Table filtering function
function filterTable(tableId, searchTerm) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Theme toggle function
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle icon
    document.querySelector('.theme-icon-light').style.display = newTheme === 'light' ? 'inline' : 'none';
    document.querySelector('.theme-icon-dark').style.display = newTheme === 'dark' ? 'inline' : 'none';
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

console.log('✅ Enhanced shared components loaded.');