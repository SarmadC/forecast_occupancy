/**
 * Theme Manager
 * Handles dark mode toggling and system preference detection
 */

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    init() {
        // On initial load, just set the theme attribute without trying to update charts
        this.applyTheme(this.theme, true);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only follow system preference if user hasn't made a manual choice
            if (!this.getStoredTheme()) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.theme, true);
            }
        });
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    /**
     * Applies the theme to the document and updates charts if necessary.
     * @param {string} theme - The theme to apply ('light' or 'dark').
     * @param {boolean} [isInitialLoad=false] - Flag to prevent updating non-existent charts on page load.
     */
    applyTheme(theme, isInitialLoad = false) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
        
        // **FIX**: Only try to update charts if it's a manual toggle and charts exist.
        // On initial load, charts will automatically adopt the theme when they are created.
        if (!isInitialLoad && window.ApexCharts) {
            document.querySelectorAll('.chart-canvas').forEach(chartEl => {
                const chartId = chartEl.id;
                if(chartId && ApexCharts.getChartByID(chartId)) {
                    ApexCharts.exec(chartId, 'updateOptions', {
                        theme: { mode: theme }
                    });
                }
            });
        }
    }

    updateThemeIcon(theme) {
        // Defer icon updates until the DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._updateIcons(theme));
        } else {
            this._updateIcons(theme);
        }
    }

    _updateIcons(theme) {
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        
        if (lightIcon && darkIcon) {
            lightIcon.style.display = theme === 'light' ? 'inline' : 'none';
            darkIcon.style.display = theme === 'dark' ? 'inline' : 'none';
        }
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        // Call applyTheme for a manual toggle
        this.applyTheme(this.theme, false);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// **FIX**: Ensure this line runs by attaching the function after the DOM is loaded,
// preventing race conditions with script execution.
document.addEventListener('DOMContentLoaded', () => {
    window.toggleTheme = () => themeManager.toggle();
});