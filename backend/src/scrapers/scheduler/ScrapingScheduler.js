// src/scrapers/scheduler/ScrapingScheduler.js

const cron = require('node-cron');
const { ScraperQueue } = require('../base/ScraperQueue');
const { supabaseClient } = require('../../integrations/storage/SupabaseClient');
const logger = require('../../utils/logger');
const { SCRAPING_STATUS } = require('../../utils/constants');

class ScrapingScheduler {
  constructor() {
    this.scraperQueue = null;
    this.scheduledTasks = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.scraperQueue = new ScraperQueue();
      await this.scraperQueue.initialize();

      // Setup periodic tasks
      this.setupPeriodicTasks();
      
      // Setup queue processor
      this.setupQueueProcessor();
      
      this.isInitialized = true;
      logger.info('Scraping scheduler initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize scraping scheduler:', error);
      throw error;
    }
  }

  setupPeriodicTasks() {
    // Daily competitor scraping (every day at 2 AM)
    const dailyTask = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting daily competitor scraping');
      await this.scheduleCompetitorScraping('daily');
    }, { scheduled: false });

    // Weekly deep scraping (every Sunday at 3 AM)
    const weeklyTask = cron.schedule('0 3 * * 0', async () => {
      logger.info('Starting weekly deep scraping');
      await this.scheduleCompetitorScraping('weekly');
    }, { scheduled: false });

    // Hourly trend monitoring (every hour)
    const hourlyTrendTask = cron.schedule('0 * * * *', async () => {
      logger.info('Starting hourly trend monitoring');
      await this.scheduleTrendMonitoring();
    }, { scheduled: false });

    // Daily cleanup (every day at 1 AM)
    const cleanupTask = cron.schedule('0 1 * * *', async () => {
      logger.info('Starting daily cleanup');
      await this.performDailyCleanup();
    }, { scheduled: false });

    // Store tasks
    this.scheduledTasks.set('daily', dailyTask);
    this.scheduledTasks.set('weekly', weeklyTask);
    this.scheduledTasks.set('hourly_trends', hourlyTrendTask);
    this.scheduledTasks.set('cleanup', cleanupTask);

    // Start all tasks
    this.startAllTasks();
  }

  setupQueueProcessor() {
    this.scraperQueue.scrapingQueue.process('scrape', 5, async (job) => {
      return await this.processScrapingJob(job);
    });
  }

  async processScrapingJob(job) {
    const { id: jobId, type, url, userId, competitorId, options = {} } = job.data;
    
    try {
      // Update job status to running
      await supabaseClient.updateScrapingJob(jobId, {
        status: SCRAPING_STATUS.RUNNING,
        started_at: new Date().toISOString(),
        progress: 0
      });

      job.progress(10);

      let result;
      switch (type) {
        case 'competitor_website':
          result = await this.scrapeCompetitorWebsite(url, options, job);
          break;
        case 'content_analysis':
          result = await this.scrapeContentForAnalysis(url, options, job);
          break;
        case 'asset_discovery':
          result = await this.scrapeAssetsFromWebsite(url, options, job);
          break;
        case 'trend_monitoring':
          result = await this.scrapeTrendData(options, job);
          break;
        default:
          throw new Error(`Unknown scraping type: ${type}`);
      }

      job.progress(90);

      // Update job status to completed
      await supabaseClient.updateScrapingJob(jobId, {
        status: SCRAPING_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        progress: 100,
        results: result
      });

      job.progress(100);

      // Notify via WebSocket if available
      if (global.socketHandlers) {
        global.socketHandlers.broadcastScrapingUpdate(
          jobId,
          userId,
          SCRAPING_STATUS.COMPLETED,
          100,
          'Scraping completed successfully'
        );
      }

      logger.info(`Scraping job ${jobId} completed successfully`);
      return result;

    } catch (error) {
      // Update job status to failed
      await supabaseClient.updateScrapingJob(jobId, {
        status: SCRAPING_STATUS.FAILED,
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

      // Notify via WebSocket
      if (global.socketHandlers) {
        global.socketHandlers.broadcastScrapingUpdate(
          jobId,
          userId,
          SCRAPING_STATUS.FAILED,
          0,
          `Scraping failed: ${error.message}`
        );
      }

      logger.error(`Scraping job ${jobId} failed:`, error);
      throw error;
    }
  }

  async scrapeCompetitorWebsite(url, options, job) {
    const { WebsiteScraper } = require('../competitors/WebsiteScraper');
    const scraper = new WebsiteScraper();
    
    try {
      job.progress(20);
      const result = await scraper.scrapeWebsite(url);
      job.progress(80);
      
      return result;
    } finally {
      await scraper.closeBrowser();
    }
  }

  async scrapeContentForAnalysis(url, options, job) {
    const { ContentScraper } = require('../competitors/ContentScraper');
    const scraper = new ContentScraper();
    
    try {
      job.progress(20);
      const result = await scraper.scrapeContent(url, options.contentType);
      job.progress(80);
      
      return result;
    } finally {
      await scraper.closeBrowser();
    }
  }

  async scrapeAssetsFromWebsite(url, options, job) {
    const { AssetScraper } = require('../assets/AssetScraper');
    const scraper = new AssetScraper();
    
    try {
      job.progress(20);
      const result = await scraper.scrapeAssets(url, options);
      job.progress(80);
      
      return result;
    } finally {
      await scraper.closeBrowser();
    }
  }

  async scrapeTrendData(options, job) {
    const { TrendScraper } = require('../trends/TrendScraper');
    const scraper = new TrendScraper();
    
    try {
      job.progress(20);
      const result = await scraper.scrapeTrends(options);
      job.progress(80);
      
      return result;
    } finally {
      // Trend scraping might not use browser
    }
  }

  async scheduleCompetitorScraping(frequency = 'daily') {
    try {
      // Get all competitors that need scraping
      const competitors = await supabaseClient.query('competitors', {
        filters: { 
          status: 'active',
          scraping_frequency: frequency
        },
        order: { column: 'last_scraped', ascending: true }
      });

      logger.info(`Scheduling ${frequency} scraping for ${competitors.length} competitors`);

      for (const competitor of competitors) {
        // Check if there's already a pending/running job
        const existingJobs = await supabaseClient.query('scraping_jobs', {
          filters: {
            competitor_id: competitor.id,
            status: ['pending', 'running']
          },
          limit: 1
        });

        if (existingJobs.length === 0) {
          await this.scheduleScrapingJob({
            type: 'competitor_website',
            url: competitor.website,
            userId: competitor.user_id,
            competitorId: competitor.id,
            options: { frequency }
          });
        }
      }

    } catch (error) {
      logger.error('Failed to schedule competitor scraping:', error);
    }
  }

  async scheduleTrendMonitoring() {
    try {
      // Schedule trend monitoring jobs
      const trendKeywords = await this.getActiveTrendKeywords();
      
      for (const keyword of trendKeywords) {
        await this.scheduleScrapingJob({
          type: 'trend_monitoring',
          url: null,
          userId: null, // System job
          competitorId: null,
          options: { 
            keyword,
            sources: ['google_trends', 'twitter', 'reddit']
          }
        });
      }

    } catch (error) {
      logger.error('Failed to schedule trend monitoring:', error);
    }
  }

  async getActiveTrendKeywords() {
    try {
      // Get trending keywords from the last 24 hours
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const trends = await supabaseClient.query('trends', {
        filters: { 
          created_at: `gte.${cutoffTime.toISOString()}`
        },
        order: { column: 'trend_score', ascending: false },
        limit: 20
      });

      return trends.map(trend => trend.keyword);
    } catch (error) {
      logger.error('Failed to get active trend keywords:', error);
      return [];
    }
  }

  async scheduleScrapingJob(jobData, options = {}) {
    try {
      // Create database record first
      const scrapingJobData = {
        id: require('uuid').v4(),
        user_id: jobData.userId,
        competitor_id: jobData.competitorId,
        type: jobData.type,
        status: SCRAPING_STATUS.PENDING,
        target_url: jobData.url,
        priority: options.priority || 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dbJob = await supabaseClient.createScrapingJob(scrapingJobData);

      // Add to queue
      const queueJob = await this.scraperQueue.addScrapingJob({
        id: dbJob.id,
        ...jobData
      }, {
        priority: options.priority || 5,
        delay: options.delay || 0,
        attempts: options.attempts || 3
      });

      logger.info(`Scheduled scraping job ${dbJob.id} for ${jobData.url}`);
      return { dbJob, queueJob };

    } catch (error) {
      logger.error('Failed to schedule scraping job:', error);
      throw error;
    }
  }

  async performDailyCleanup() {
    try {
      logger.info('Starting daily cleanup');

      // Clean old completed jobs (older than 30 days)
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const { error } = await supabaseClient.getClient()
        .from('scraping_jobs')
        .delete()
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate.toISOString());

      if (error) {
        logger.error('Failed to clean old jobs:', error);
      } else {
        logger.info('Cleaned old completed jobs');
      }

      // Clean queue
      await this.scraperQueue.cleanQueue(24 * 60 * 60 * 1000); // 24 hours

      // Clean old scraped files
      const { ScraperUtils } = require('../base/ScraperUtils');
      await ScraperUtils.cleanOldFiles(7); // 7 days

      logger.info('Daily cleanup completed');

    } catch (error) {
      logger.error('Failed to perform daily cleanup:', error);
    }
  }

  startAllTasks() {
    this.scheduledTasks.forEach((task, name) => {
      task.start();
      logger.info(`Started scheduled task: ${name}`);
    });
  }

  stopAllTasks() {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped scheduled task: ${name}`);
    });
  }

  async getSchedulerStats() {
    try {
      const queueStats = await this.scraperQueue.getQueueStats();
      
      const activeJobs = await supabaseClient.query('scraping_jobs', {
        filters: { status: 'running' }
      });

      const pendingJobs = await supabaseClient.query('scraping_jobs', {
        filters: { status: 'pending' }
      });

      const completedToday = await supabaseClient.query('scraping_jobs', {
        filters: { 
          status: 'completed',
          completed_at: `gte.${new Date().toISOString().split('T')[0]}T00:00:00.000Z`
        }
      });

      return {
        queue: queueStats,
        database: {
          active: activeJobs.length,
          pending: pendingJobs.length,
          completedToday: completedToday.length
        },
        scheduledTasks: Array.from(this.scheduledTasks.keys()).map(name => ({
          name,
          running: this.scheduledTasks.get(name).running
        }))
      };

    } catch (error) {
      logger.error('Failed to get scheduler stats:', error);
      throw error;
    }
  }

  async shutdown() {
    try {
      this.stopAllTasks();
      
      if (this.scraperQueue) {
        await this.scraperQueue.close();
      }
      
      logger.info('Scraping scheduler shut down gracefully');
    } catch (error) {
      logger.error('Error during scheduler shutdown:', error);
    }
  }
}

// src/scrapers/scheduler/JobQueue.js

const { ScraperQueue } = require('../base/ScraperQueue');
const { supabaseClient } = require('../../integrations/storage/SupabaseClient');
const logger = require('../../utils/logger');

class JobQueue {
  constructor() {
    this.scraperQueue = new ScraperQueue();
  }

  async initialize() {
    await this.scraperQueue.initialize();
    logger.info('Job queue initialized');
  }

  async addJob(jobType, jobData, options = {}) {
    try {
      const job = await this.scraperQueue.addScrapingJob({
        type: jobType,
        ...jobData
      }, options);

      return {
        id: job.id,
        type: jobType,
        status: 'queued',
        data: jobData
      };

    } catch (error) {
      logger.error('Failed to add job to queue:', error);
      throw error;
    }
  }

  async getJobStatus(jobId) {
    try {
      return await this.scraperQueue.getJobStatus(jobId);
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  async cancelJob(jobId) {
    try {
      const success = await this.scraperQueue.removeJob(jobId);
      
      if (success) {
        // Update database status
        await supabaseClient.updateScrapingJob(jobId, {
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      throw error;
    }
  }

  async getQueueInfo() {
    try {
      return await this.scraperQueue.getQueueStats();
    } catch (error) {
      logger.error('Failed to get queue info:', error);
      throw error;
    }
  }

  async pauseQueue() {
    await this.scraperQueue.pauseQueue();
  }

  async resumeQueue() {
    await this.scraperQueue.resumeQueue();
  }

  async close() {
    await this.scraperQueue.close();
  }
}

// src/scrapers/scheduler/CronJobs.js

const cron = require('node-cron');
const logger = require('../../utils/logger');

class CronJobs {
  constructor() {
    this.jobs = new Map();
  }

  // Schedule a competitor scraping job
  scheduleCompetitorScraping(competitorId, schedule, scrapingFunction) {
    const jobName = `competitor_${competitorId}`;
    
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName).stop();
    }

    const task = cron.schedule(schedule, async () => {
      try {
        logger.info(`Running scheduled scraping for competitor ${competitorId}`);
        await scrapingFunction(competitorId);
      } catch (error) {
        logger.error(`Scheduled scraping failed for competitor ${competitorId}:`, error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(jobName, task);
    task.start();
    
    logger.info(`Scheduled competitor scraping: ${jobName} with schedule: ${schedule}`);
  }

  // Schedule trend monitoring
  scheduleTrendMonitoring(schedule, monitoringFunction) {
    const jobName = 'trend_monitoring';
    
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName).stop();
    }

    const task = cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled trend monitoring');
        await monitoringFunction();
      } catch (error) {
        logger.error('Scheduled trend monitoring failed:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(jobName, task);
    task.start();
    
    logger.info(`Scheduled trend monitoring with schedule: ${schedule}`);
  }

  // Schedule data cleanup
  scheduleCleanup(schedule, cleanupFunction) {
    const jobName = 'data_cleanup';
    
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName).stop();
    }

    const task = cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled data cleanup');
        await cleanupFunction();
      } catch (error) {
        logger.error('Scheduled cleanup failed:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(jobName, task);
    task.start();
    
    logger.info(`Scheduled data cleanup with schedule: ${schedule}`);
  }

  // Stop a specific job
  stopJob(jobName) {
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName).stop();
      this.jobs.delete(jobName);
      logger.info(`Stopped scheduled job: ${jobName}`);
      return true;
    }
    return false;
  }

  // Stop all jobs
  stopAllJobs() {
    this.jobs.forEach((task, jobName) => {
      task.stop();
      logger.info(`Stopped scheduled job: ${jobName}`);
    });
    this.jobs.clear();
  }

  // Get job status
  getJobStatus(jobName) {
    if (this.jobs.has(jobName)) {
      const task = this.jobs.get(jobName);
      return {
        name: jobName,
        running: task.running || false
      };
    }
    return null;
  }

  // Get all jobs status
  getAllJobsStatus() {
    const status = [];
    this.jobs.forEach((task, jobName) => {
      status.push({
        name: jobName,
        running: task.running || false
      });
    });
    return status;
  }

  // Validate cron expression
  static isValidCronExpression(expression) {
    try {
      cron.validate(expression);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Common cron patterns
  static getCommonPatterns() {
    return {
      EVERY_MINUTE: '* * * * *',
      EVERY_5_MINUTES: '*/5 * * * *',
      EVERY_15_MINUTES: '*/15 * * * *',
      EVERY_30_MINUTES: '*/30 * * * *',
      EVERY_HOUR: '0 * * * *',
      EVERY_2_HOURS: '0 */2 * * *',
      EVERY_6_HOURS: '0 */6 * * *',
      EVERY_12_HOURS: '0 */12 * * *',
      DAILY_AT_MIDNIGHT: '0 0 * * *',
      DAILY_AT_2AM: '0 2 * * *',
      WEEKLY_SUNDAY_3AM: '0 3 * * 0',
      MONTHLY_1ST_2AM: '0 2 1 * *'
    };
  }
}

// Initialize the scheduler
async function initializeScrapingScheduler() {
  try {
    const scheduler = new ScrapingScheduler();
    await scheduler.initialize();
    
    // Make scheduler available globally
    global.scrapingScheduler = scheduler;
    
    return scheduler;
  } catch (error) {
    logger.error('Failed to initialize scraping scheduler:', error);
    throw error;
  }
}

module.exports = {
  ScrapingScheduler,
  JobQueue,
  CronJobs,
  initializeScrapingScheduler
};