// CronJobs.js
// Centralized cron job scheduler using node-cron

const cron = require('node-cron');
const { processAssets } = require('../../jobs/assetOptimization');
const { processData } = require('../../jobs/dataProcessing');
const { generateReports } = require('../../jobs/reportGeneration');
const { scheduledScraping } = require('../../jobs/scheduledScraping');
const { analyzeTrends } = require('../../jobs/trendAnalysis');

// Asset Optimization - every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('[CRON] Running asset optimization...');
  processAssets();
});

// Data Processing - every hour
cron.schedule('0 * * * *', () => {
  console.log('[CRON] Running data processing...');
  processData();
});

// Report Generation - every Monday at 6:00 AM
cron.schedule('0 6 * * 1', () => {
  console.log('[CRON] Generating weekly reports...');
  generateReports();
});

// Scheduled Scraping - every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log('[CRON] Running scheduled scraping...');
  scheduledScraping();
});

// Trend Analysis - every day at 3:00 AM
cron.schedule('0 3 * * *', () => {
  console.log('[CRON] Running trend analysis...');
  analyzeTrends();
});

module.exports = cron;
