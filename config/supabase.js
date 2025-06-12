/**
 * @file supabase.js
 * @description Manages the Supabase client instance and its configuration.
 * It handles loading credentials from localStorage, initializing the client,
 * and providing utility functions to check the connection status.
 */

// Create a global object to manage Supabase configuration and the client instance.
window.SupabaseConfig = (() => {
    // --- PRIVATE STATE ---
    let supabaseUrl = localStorage.getItem(window.AppConstants.STORAGE_KEYS.SUPABASE_URL) || '';
    let supabaseKey = localStorage.getItem(window.AppConstants.STORAGE_KEYS.SUPABASE_KEY) || '';
    let supabaseClient = null;
    let isConnected = false;

    // --- PRIVATE METHODS ---

    /**
     * Initializes the Supabase client if credentials are available.
     */
    function initializeClient() {
        if (supabaseUrl && supabaseKey) {
            try {
                // Use the global supabase object from the Supabase CDN script.
                supabaseClient = supabase.createClient(supabaseUrl, supabaseKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true
                    }
                });
                console.log('✅ Supabase client initialized.');
            } catch (error) {
                console.error('❌ Failed to initialize Supabase client:', error);
                supabaseClient = null;
            }
        }
    }

    // --- PUBLIC API ---
    const publicApi = {
        /**
         * Configures the Supabase credentials and re-initializes the client.
         * @param {string} url - The Supabase project URL.
         * @param {string} key - The Supabase anon/public key.
         */
        configure: (url, key) => {
            supabaseUrl = url.trim();
            supabaseKey = key.trim();
            localStorage.setItem(window.AppConstants.STORAGE_KEYS.SUPABASE_URL, supabaseUrl);
            localStorage.setItem(window.AppConstants.STORAGE_KEYS.SUPABASE_KEY, supabaseKey);
            initializeClient();
        },

        /**
         * Returns the current Supabase client instance.
         * @returns {object|null} The initialized Supabase client or null.
         */
        getClient: () => {
            if (!supabaseClient) {
                initializeClient();
            }
            return supabaseClient;
        },

        /**
         * Checks if the Supabase URL and key have been set.
         * @returns {boolean} True if configured, false otherwise.
         */
        isConfigured: () => {
            return !!(supabaseUrl && supabaseKey);
        },

        /**
         * Tests the connection to the Supabase database.
         * @returns {Promise<void>} A promise that resolves on success and rejects on failure.
         */
        testConnection: async () => {
            const client = publicApi.getClient();
            if (!client) {
                isConnected = false;
                throw new Error('Supabase client is not initialized.');
            }
            try {
                // A lightweight query to check if the connection and credentials are valid.
                const { error } = await client.from(AppConstants.DATABASE.TABLE_NAME).select('id').limit(1);

                // Ignore "relation does not exist" error, as it's common on first setup.
                if (error && error.code !== '42P01') {
                    throw error;
                }
                isConnected = true;
                console.log('✅ Supabase connection test successful.');
            } catch (error) {
                isConnected = false;
                console.error('❌ Supabase connection test failed:', error);
                throw new Error(error.message);
            }
        },

        /**
         * Gets the current configuration and connection status.
         * @returns {object} An object with status details.
         */
        getStatus: () => ({
            configured: publicApi.isConfigured(),
            connected: isConnected,
            url: supabaseUrl,
            key: supabaseKey,
        }),
    };

    // Initialize on script load.
    initializeClient();

    return publicApi;
})();

// Create a global `supabase` variable for easier access elsewhere in the app.
const supabase = window.SupabaseConfig.getClient();

console.log('✅ Supabase configuration manager loaded.');
