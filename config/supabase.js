// Centralized Supabase configuration
class SupabaseConfig {
    constructor() {
        this.url = process.env.SUPABASE_URL || localStorage.getItem('supabase_url') || '';
        this.key = process.env.SUPABASE_ANON_KEY || localStorage.getItem('supabase_key') || '';
        this.client = null;
    }

    initialize(url, key) {
        this.url = url;
        this.key = key;
        
        // Store for future use
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);
        
        this.client = window.supabase.createClient(this.url, this.key);
        return this.client;
    }

    getClient() {
        if (!this.client && this.url && this.key) {
            this.client = window.supabase.createClient(this.url, this.key);
        }
        return this.client;
    }

    isConfigured() {
        return !!(this.url && this.key);
    }
}

window.SupabaseConfig = new SupabaseConfig();