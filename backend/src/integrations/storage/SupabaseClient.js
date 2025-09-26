const { createClient } = require('@supabase/supabase-js');
const logger = require('../../utils/logger');

class SupabaseClient {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      // Demo mode for development
      if (!supabaseUrl || supabaseUrl === 'https://demo.supabase.co') {
        logger.info('Running in demo mode - using mock database');
        this.supabase = this.createMockClient();
        return this.supabase;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      logger.info('Supabase client initialized');
      return this.supabase;
    } catch (error) {
      logger.error('Failed to initialize Supabase:', error);
      throw error;
    }
  }

  createMockClient() {
    const mockData = {
      users: [],
      competitors: [],
      trends: [
        { id: 1, keyword: 'AI', trend_score: 95, growth_rate: 15, source: 'google_trends' },
        { id: 2, keyword: 'Remote Work', trend_score: 87, growth_rate: 8, source: 'google_trends' }
      ]
    };

    return {
      from: (table) => ({
        select: () => ({ data: mockData[table] || [], error: null }),
        insert: (data) => ({ data: data[0], error: null }),
        eq: () => ({ single: () => ({ data: mockData[table]?.[0], error: null }) })
      })
    };
  }

  getClient() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }
}

const supabaseClient = new SupabaseClient();

const initializeDatabase = async () => {
  return await supabaseClient.initialize();
};

module.exports = {
  SupabaseClient,
  initializeDatabase,
  supabase: () => supabaseClient.getClient()
};