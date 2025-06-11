/**
 * Supabase Configuration Manager
 * Handles connection, authentication, and client initialization
 */
class SupabaseConfig {
    constructor() {
        this.url = '';
        this.key = '';
        this.client = null;
        this.isConnected = false;
        this.connectionPromise = null;
        
        // Load from localStorage on initialization
        this.loadFromStorage();
    }

    /**
     * Load configuration from localStorage
     */
    loadFromStorage() {
        this.url = localStorage.getItem(AppConstants.STORAGE_KEYS.SUPABASE_URL) || '';
        this.key = localStorage.getItem(AppConstants.STORAGE_KEYS.SUPABASE_KEY) || '';
        
        if (this.url && this.key) {
            this.initializeClient();
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveToStorage() {
        localStorage.setItem(AppConstants.STORAGE_KEYS.SUPABASE_URL, this.url);
        localStorage.setItem(AppConstants.STORAGE_KEYS.SUPABASE_KEY, this.key);
    }

    /**
     * Initialize Supabase client
     */
    initializeClient() {
        try {
            if (!this.url || !this.key) {
                throw new Error('Missing Supabase URL or API key');
            }

            this.client = window.supabase.createClient(this.url, this.key, {
                auth: {
                    persistSession: false // We're not using auth for this app
                }
            });

            console.log('✅ Supabase client initialized');
            return this.client;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error);
            throw error;
        }
    }

    /**
     * Configure Supabase with new credentials
     */
    configure(url, key) {
        this.url = url.trim();
        this.key = key.trim();
        
        this.saveToStorage();
        this.initializeClient();
        
        return this.client;
    }

    /**
     * Get the Supabase client (lazy initialization)
     */
    getClient() {
        if (!this.client && this.url && this.key) {
            this.initializeClient();
        }
        return this.client;
    }

    /**
     * Test the connection to Supabase
     */
    async testConnection() {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = this._performConnectionTest();
        
        try {
            const result = await this.connectionPromise;
            this.isConnected = true;
            return result;
        } catch (error) {
            this.isConnected = false;
            throw error;
        } finally {
            this.connectionPromise = null;
        }
    }

    /**
     * Internal connection test
     */
    async _performConnectionTest() {
        const client = this.getClient();
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            // Test basic connectivity
            const { data, error } = await client
                .from(AppConstants.DATABASE.TABLE_NAME)
                .select('count')
                .limit(1);

            if (error) {
                // Check if it's a table not found error (acceptable for new setups)
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    console.warn('⚠️ Table does not exist yet - this is normal for new setups');
                    return { status: 'table_missing', message: 'Connection successful, but table needs to be created' };
                }
                throw error;
            }

            console.log('✅ Supabase connection test successful');
            return { status: 'success', message: 'Connection successful' };
            
        } catch (error) {
            console.error('❌ Supabase connection test failed:', error);
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    /**
     * Check if Supabase is properly configured
     */
    isConfigured() {
        return !!(this.url && this.key);
    }

    /**
     * Reset configuration
     */
    reset() {
        this.url = '';
        this.key = '';
        this.client = null;
        this.isConnected = false;
        
        localStorage.removeItem(AppConstants.STORAGE_KEYS.SUPABASE_URL);
        localStorage.removeItem(AppConstants.STORAGE_KEYS.SUPABASE_KEY);
        
        console.log('🔄 Supabase configuration reset');
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            configured: this.isConfigured(),
            connected: this.isConnected,
            hasClient: !!this.client,
            url: this.url ? `${this.url.substring(0, 20)}...` : 'Not set',
            keySet: !!this.key
        };
    }
}

// Create global instance
window.SupabaseConfig = new SupabaseConfig();

// Auto-test connection if configured
if (window.SupabaseConfig.isConfigured()) {
    window.SupabaseConfig.testConnection()
        .then(() => console.log('✅ Auto-connection test passed'))
        .catch(() => console.warn('⚠️ Auto-connection test failed - manual configuration may be needed'));
}

console.log('✅ Supabase configuration manager loaded');