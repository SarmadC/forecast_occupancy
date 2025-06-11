// Centralized Supabase operations
class SupabaseDataManager {
    constructor() {
        this.client = null;
    }

    initialize() {
        this.client = SupabaseConfig.getClient();
        if (!this.client) {
            throw new Error('Supabase not configured');
        }
        return this.client;
    }

    async testConnection() {
        if (!this.client) this.initialize();
        
        const { data, error } = await this.client
            .from(AppConstants.DATABASE.TABLE_NAME)
            .select('count')
            .limit(1);

        if (error) throw error;
        return true;
    }

    async getForecastData(filters = {}) {
        if (!this.client) this.initialize();
        
        let query = this.client
            .from(AppConstants.DATABASE.TABLE_NAME)
            .select('*')
            .order('forecast_date', { ascending: true });

        if (filters.asOfDate) {
            query = query.eq('as_of_date', filters.asOfDate);
        }
        if (filters.city && filters.city !== 'All') {
            query = query.eq('city', filters.city);
        }
        if (filters.horizon && filters.horizon !== 'All') {
            query = query.eq('forecast_horizon', filters.horizon);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async uploadForecastData(transformedData) {
        if (!this.client) this.initialize();
        
        // Check for existing data
        const reportId = transformedData[0].report_id;
        const { data: existing } = await this.client
            .from(AppConstants.DATABASE.TABLE_NAME)
            .select('id')
            .eq('report_id', reportId)
            .limit(1);

        if (existing && existing.length > 0) {
            throw new Error('Data already exists for this report');
        }

        // Upload in batches
        const batchSize = AppConstants.DATABASE.BATCH_SIZE;
        for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize);
            const { error } = await this.client
                .from(AppConstants.DATABASE.TABLE_NAME)
                .insert(batch);

            if (error) throw error;
        }

        return transformedData.length;
    }

    async getUniqueValues(column) {
        if (!this.client) this.initialize();
        
        const { data, error } = await this.client
            .from(AppConstants.DATABASE.TABLE_NAME)
            .select(column);

        if (error) throw error;
        return [...new Set(data.map(item => item[column]))];
    }

    setupRealTimeUpdates(callback) {
        if (!this.client) this.initialize();
        
        return this.client
            .channel('forecast_updates')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: AppConstants.DATABASE.TABLE_NAME },
                callback
            )
            .subscribe();
    }
}

// Global instance
window.dataManager = new SupabaseDataManager();