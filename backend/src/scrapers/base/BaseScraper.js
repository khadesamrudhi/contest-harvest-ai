// src/scrapers/base/BaseScraper.js

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('../../utils/logger');

class BaseScraper {
  constructor(options = {}) {
    this.options = {
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      headless: true,
      waitUntil: 'networkidle2',
      ...options
    };
    
    this.browser = null;
    this.page = null;
  }

  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.options.userAgent);
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Block unnecessary resources to speed up scraping
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'image'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async scrapeWithPuppeteer(url, options = {}) {
    if (!this.browser) {
      await this.initBrowser();
    }

    try {
      const response = await this.page.goto(url, {
        waitUntil: this.options.waitUntil,
        timeout: this.options.timeout
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response ? response.status() : 'No response'}`);
      }

      // Wait for custom selector if provided
      if (options.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Execute custom script if provided
      if (options.script) {
        await this.page.evaluate(options.script);
      }

      const html = await this.page.content();
      return cheerio.load(html);

    } catch (error) {
      logger.error(`Puppeteer scraping failed for ${url}:`, error);
      throw error;
    }
  }

  async scrapeWithAxios(url, options = {}) {
    try {
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent,
          ...options.headers
        },
        ...options.axiosOptions
      });

      return cheerio.load(response.data);
    } catch (error) {
      logger.error(`Axios scraping failed for ${url}:`, error);
      throw error;
    }
  }

  extractText($, selector) {
    return $(selector).text().trim();
  }

  extractAttribute($, selector, attribute) {
    return $(selector).attr(attribute);
  }

  extractArray($, selector, extractor = 'text') {
    const results = [];
    $(selector).each((i, el) => {
      if (extractor === 'text') {
        results.push($(el).text().trim());
      } else if (typeof extractor === 'string') {
        results.push($(el).attr(extractor));
      } else if (typeof extractor === 'function') {
        results.push(extractor($(el)));
      }
    });
    return results.filter(Boolean);
  }

  extractLinks($, baseUrl = '') {
    const links = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        links.push({
          url: fullUrl,
          text: $(el).text().trim(),
          title: $(el).attr('title') || ''
        });
      }
    });
    return links;
  }

  extractImages($, baseUrl = '') {
    const images = [];
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
        images.push({
          url: fullUrl,
          alt: $(el).attr('alt') || '',
          title: $(el).attr('title') || '',
          width: $(el).attr('width'),
          height: $(el).attr('height')
        });
      }
    });
    return images;
  }

  extractMetadata($) {
    const metadata = {};
    
    // Title
    metadata.title = $('title').text().trim() || 
                    $('meta[property="og:title"]').attr('content') ||
                    $('meta[name="twitter:title"]').attr('content') || '';

    // Description
    metadata.description = $('meta[name="description"]').attr('content') ||
                          $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="twitter:description"]').attr('content') || '';

    // Keywords
    metadata.keywords = $('meta[name="keywords"]').attr('content') || '';

    // Open Graph data
    metadata.ogImage = $('meta[property="og:image"]').attr('content') || '';
    metadata.ogUrl = $('meta[property="og:url"]').attr('content') || '';
    metadata.ogType = $('meta[property="og:type"]').attr('content') || '';

    // Author
    metadata.author = $('meta[name="author"]').attr('content') || '';

    // Canonical URL
    metadata.canonical = $('link[rel="canonical"]').attr('href') || '';

    return metadata;
  }

  async closeBrowser() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error('Error closing browser:', error);
    }
  }

  // Utility methods
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  sanitizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = BaseScraper;

// src/scrapers/competitors/WebsiteScraper.js

const BaseScraper = require('../base/BaseScraper');
const logger = require('../../utils/logger');

class WebsiteScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
  }

  async scrapeWebsite(url) {
    try {
      logger.info(`Starting website scrape for: ${url}`);
      
      const $ = await this.scrapeWithPuppeteer(url);
      
      const result = {
        url,
        metadata: this.extractMetadata($),
        content: this.extractMainContent($),
        links: this.extractLinks($, url),
        images: this.extractImages($, url),
        headings: this.extractHeadings($),
        socialLinks: this.extractSocialLinks($),
        contactInfo: this.extractContactInfo($),
        technologies: await this.detectTechnologies($),
        scrapedAt: new Date().toISOString()
      };

      logger.info(`Website scrape completed for: ${url}`);
      return result;

    } catch (error) {
      logger.error(`Website scraping failed for ${url}:`, error);
      throw error;
    }
  }

  extractMainContent($) {
    // Try common content selectors
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content',
      'article',
      '.post-content',
      '.entry-content'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      const text = $(selector).text().trim();
      if (text.length > content.length) {
        content = text;
      }
    }

    // If no specific content area found, get body text
    if (!content) {
      content = $('body').text().trim();
    }

    return this.sanitizeText(content);
  }

  extractHeadings($) {
    const headings = [];
    for (let i = 1; i <= 6; i++) {
      $(`h${i}`).each((index, el) => {
        const text = $(el).text().trim();
        if (text) {
          headings.push({
            level: i,
            text,
            id: $(el).attr('id') || ''
          });
        }
      });
    }
    return headings;
  }

  extractSocialLinks($) {
    const socialPlatforms = [
      'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
      'youtube.com', 'tiktok.com', 'pinterest.com', 'github.com'
    ];

    const socialLinks = {};
    
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        for (const platform of socialPlatforms) {
          if (href.includes(platform)) {
            const platformName = platform.split('.')[0];
            socialLinks[platformName] = href;
          }
        }
      }
    });

    return socialLinks;
  }

  extractContactInfo($) {
    const contactInfo = {};

    // Email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const bodyText = $('body').text();
    const emails = bodyText.match(emailRegex) || [];
    if (emails.length > 0) {
      contactInfo.emails = [...new Set(emails)];
    }

    // Phone numbers
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const phones = bodyText.match(phoneRegex) || [];
    if (phones.length > 0) {
      contactInfo.phones = [...new Set(phones)];
    }

    // Address (simple extraction)
    const addressSelectors = [
      '[itemprop="address"]',
      '.address',
      '#address',
      '.contact-address'
    ];

    for (const selector of addressSelectors) {
      const address = $(selector).text().trim();
      if (address) {
        contactInfo.address = address;
        break;
      }
    }

    return contactInfo;
  }

  async detectTechnologies($) {
    const technologies = [];

    // Check for common frameworks and libraries
    const techIndicators = {
      'React': () => $('script').text().includes('React') || $('[data-reactroot]').length > 0,
      'Vue.js': () => $('script').text().includes('Vue') || $('[data-v-]').length > 0,
      'Angular': () => $('script').text().includes('ng-') || $('[ng-]').length > 0,
      'jQuery': () => $('script').text().includes('jquery') || typeof $ !== 'undefined',
      'Bootstrap': () => $('link[href*="bootstrap"]').length > 0 || $('.container, .row, .col-').length > 0,
      'WordPress': () => $('meta[name="generator"][content*="WordPress"]').length > 0,
      'Shopify': () => $('script').text().includes('Shopify') || $('.shopify').length > 0,
      'Google Analytics': () => $('script').text().includes('gtag') || $('script').text().includes('ga(')
    };

    for (const [tech, detector] of Object.entries(techIndicators)) {
      try {
        if (detector()) {
          technologies.push(tech);
        }
      } catch (error) {
        // Ignore detection errors
      }
    }

    return technologies;
  }
}

// src/scrapers/competitors/ContentScraper.js

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
    
    // Filter for content images (exclude nav, footer, sidebar images)
    return images.filter(img => {
      const imgElement = $(`img[src="${img.url}"]`);
      const parent = imgElement.parent();
      
      // Exclude images in navigation, footer, sidebar
      if (parent.closest('nav, footer, aside, .sidebar, .navigation').length > 0) {
        return false;
      }
      
      return true;
    });
  }

  extractContentLinks($, baseUrl) {
    const links = this.extractLinks($, baseUrl);
    
    // Filter for content links
    return links.filter(link => {
      const linkElement = $(`a[href="${link.url}"]`);
      const parent = linkElement.parent();
      
      // Exclude navigation and footer links
      if (parent.closest('nav, footer, .navigation, .menu').length > 0) {
        return false;
      }
      
      return true;
    });
  }
}

module.exports = {
  BaseScraper,
  WebsiteScraper,
  ContentScraper
};