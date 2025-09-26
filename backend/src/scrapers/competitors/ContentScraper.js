const BaseScraper = require('../base/BaseScraper');
const logger = require('../../utils/logger');

class ContentScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
  }

  async scrapeContent(url, contentType = 'blog') {
    try {
      logger.info(`Starting content scrape for: ${url}`);
      
      const $ = await this.scrapeWithPuppeteer(url);
      
      const result = {
        url,
        type: contentType,
        title: this.extractTitle($),
        content: this.extractArticleContent($),
        author: this.extractAuthor($),
        publishDate: this.extractPublishDate($),
        tags: this.extractTags($),
        category: this.extractCategory($),
        readingTime: this.calculateReadingTime($),
        wordCount: this.calculateWordCount($),
        images: this.extractContentImages($, url),
        links: this.extractContentLinks($, url),
        metadata: this.extractMetadata($),
        scrapedAt: new Date().toISOString()
      };

      logger.info(`Content scrape completed for: ${url}`);
      return result;

    } catch (error) {
      logger.error(`Content scraping failed for ${url}:`, error);
      throw error;
    }
  }

  extractTitle($) {
    return this.extractText($, 'h1') ||
           this.extractText($, '.entry-title') ||
           this.extractText($, '.post-title') ||
           this.extractText($, 'title');
  }

  extractArticleContent($) {
    const contentSelectors = [
      'article',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      '[role="main"]'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const text = this.extractText($, selector);
      if (text.length > content.length) {
        content = text;
      }
    }

    return this.sanitizeText(content);
  }

  extractAuthor($) {
    return this.extractText($, '.author') ||
           this.extractText($, '.by-author') ||
           this.extractText($, '[rel="author"]') ||
           this.extractAttribute($, 'meta[name="author"]', 'content');
  }

  extractPublishDate($) {
    const dateSelectors = [
      'time[datetime]',
      '.published',
      '.post-date',
      '.entry-date',
      '[itemprop="datePublished"]'
    ];

    for (const selector of dateSelectors) {
      const dateValue = this.extractAttribute($, selector, 'datetime') ||
                       this.extractText($, selector);
      if (dateValue) {
        try {
          return new Date(dateValue).toISOString();
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  extractTags($) {
    return this.extractArray($, '.tags a, .tag a, .post-tags a, [rel="tag"]');
  }

  extractCategory($) {
    return this.extractText($, '.category') ||
           this.extractText($, '.post-category') ||
           this.extractText($, '[rel="category"]');
  }

  calculateReadingTime($) {
    const content = this.extractArticleContent($);
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  calculateWordCount($) {
    const content = this.extractArticleContent($);
    return content.split(/\s+/).length;
  }

  extractContentImages($, baseUrl) {
    const images = this.extractImages($, baseUrl);
    
    return images.filter(img => {
      const imgElement = $(`img[src="${img.url}"]`);
      const parent = imgElement.parent();
      
      if (parent.closest('nav, footer, aside, .sidebar, .navigation').length > 0) {
        return false;
      }
      
      return true;
    });
  }

  extractContentLinks($, baseUrl) {
    const links = this.extractLinks($, baseUrl);
    
    return links.filter(link => {
      const linkElement = $(`a[href="${link.url}"]`);
      const parent = linkElement.parent();
      
      if (parent.closest('nav, footer, .navigation, .menu').length > 0) {
        return false;
      }
      
      return true;
    });
  }
}

module.exports = ContentScraper;