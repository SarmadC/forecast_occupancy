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


// --- NEW UTILITY FUNCTION FOR ROLE-BASED ACCESS ---

/**
 * Fetches the role of the currently authenticated user from the 'profiles' table.
 * @returns {Promise<string|null>} The user's role (e.g., 'admin', 'viewer') or null if not found/error.
 */
async function getUserRole() {
    // Ensure we have a client to work with.
    if (!supabase) {
        console.error("Supabase client not available for getUserRole.");
        return null;
    }

    // First, get the current user from the auth session.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // No user is logged in.
        return null;
    }

    // Then, query the 'profiles' table for that user's role.
    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single(); // .single() is efficient and expects one row.

        if (error && status !== 406) {
            // 406 status code means no row was found, which is not a server error.
            throw error;
        }

        if (data) {
            return data.role;
        }
    } catch (error) {
        console.error('Error fetching user role:', error.message);
        return null;
    }

    // Return null if no profile was found for the user.
    return null;
}