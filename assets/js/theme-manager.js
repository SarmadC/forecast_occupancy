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
        // Apply initial theme
        this.applyTheme(this.theme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.theme);
            }
        });
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
        
        // Update chart themes if they exist
        if (window.ApexCharts) {
            window.ApexCharts.exec(undefined, 'updateOptions', {
                theme: {
                    mode: theme
                }
            });
        }
    }

    updateThemeIcon(theme) {
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
        this.applyTheme(this.theme);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Global toggle function
window.toggleTheme = () => themeManager.toggle();