const googleTrends = require('google-trends-api');
const logger = require('../../utils/logger');

class GoogleTrendsScraper {
  constructor() {
    this.defaultOptions = {
      geo: 'US',
      hl: 'en-US',
      category: 0,
      granularTimeUnit: 'day'
    };
  }

  async getTrendData(keyword, options = {}) {
    try {
      const searchOptions = { ...this.defaultOptions, ...options };
      
      const results = await googleTrends.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endTime: new Date(),
        ...searchOptions
      });

      const data = JSON.parse(results);
      
      return {
        keyword,
        timelineData: data.default.timelineData,
        averageValue: this.calculateAverage(data.default.timelineData),
        trend: this.calculateTrend(data.default.timelineData)
      };
    } catch (error) {
      logger.error('Google Trends scraping failed:', error);
      throw error;
    }
  }

  async getRelatedQueries(keyword, options = {}) {
    try {
      const results = await googleTrends.relatedQueries({
        keyword,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endTime: new Date(),
        ...this.defaultOptions,
        ...options
      });

      return JSON.parse(results);
    } catch (error) {
      logger.error('Related queries fetch failed:', error);
      throw error;
    }
  }

  calculateAverage(timelineData) {
    if (!timelineData || timelineData.length === 0) return 0;
    
    const sum = timelineData.reduce((acc, item) => acc + (item.value?.[0] || 0), 0);
    return Math.round(sum / timelineData.length);
  }

  calculateTrend(timelineData) {
    if (!timelineData || timelineData.length < 2) return 0;
    
    const recent = timelineData.slice(-7); // Last 7 days
    const previous = timelineData.slice(-14, -7); // Previous 7 days
    
    const recentAvg = this.calculateAverage(recent);
    const previousAvg = this.calculateAverage(previous);
    
    if (previousAvg === 0) return 0;
    return Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
  }
}

module.exports = GoogleTrendsScraper;