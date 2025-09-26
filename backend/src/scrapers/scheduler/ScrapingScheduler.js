const cron = require('node-cron');
const { supabase } = require('../../integrations/storage/SupabaseClient');
const ContentScraper = require('../competitors/ContentScraper');
const GoogleTrendsScraper = require('../trends/GoogleTrendsScraper');
const logger = require('../../utils/logger');

class ScrapingScheduler {
  constructor() {
    this.jobs = new Map();
    this.contentScraper = new ContentScraper();
    this.trendsScraper = new GoogleTrendsScraper();
  }

  async initialize() {
    try {
      // Schedule competitor scraping every 6 hours
      this.scheduleCompetitorScraping();
      
      // Schedule trend analysis every hour
      this.scheduleTrendAnalysis();
      
      logger.info('Scraping scheduler initialized');
    } catch (error) {
      logger.error('Failed to initialize scraping scheduler:', error);
      throw error;
    }
  }

  scheduleCompetitorScraping() {
    const job = cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Starting scheduled competitor scraping');
        
        const { data: competitors, error } = await supabase()
          .from('competitors')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;

        for (const competitor of competitors) {
          try {
            const content = await this.contentScraper.scrapeContent(competitor.website);
            
            // Store scraped content
            await supabase()
              .from('scraping_jobs')
              .insert([{
                user_id: competitor.user_id,
                competitor_id: competitor.id,
                type: 'content_scraping',
                status: 'completed',
                target_url: competitor.website,
                results: content,
                completed_at: new Date().toISOString()
              }]);

            logger.info(`Scraped content for ${competitor.name}`);
          } catch (error) {
            logger.error(`Failed to scrape ${competitor.name}:`, error);
          }
        }
      } catch (error) {
        logger.error('Competitor scraping job failed:', error);
      }
    });

    this.jobs.set('competitor_scraping', job);
  }

  scheduleTrendAnalysis() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting scheduled trend analysis');
        
        const keywords = ['AI', 'technology', 'marketing', 'business', 'startup'];
        
        for (const keyword of keywords) {
          try {
            const trendData = await this.trendsScraper.getTrendData(keyword);
            
            await supabase()
              .from('trends')
              .upsert([{
                keyword,
                trend_score: trendData.averageValue,
                growth_rate: trendData.trend,
                source: 'google_trends',
                data: trendData,
                created_at: new Date().toISOString()
              }]);

            logger.info(`Updated trends for ${keyword}`);
          } catch (error) {
            logger.error(`Failed to analyze trends for ${keyword}:`, error);
          }
        }
      } catch (error) {
        logger.error('Trend analysis job failed:', error);
      }
    });

    this.jobs.set('trend_analysis', job);
  }

  stopAll() {
    this.jobs.forEach(job => job.destroy());
    this.jobs.clear();
    logger.info('All scheduled jobs stopped');
  }
}

const scheduler = new ScrapingScheduler();

const initializeScrapingScheduler = async () => {
  return await scheduler.initialize();
};

module.exports = {
  ScrapingScheduler,
  initializeScrapingScheduler
};