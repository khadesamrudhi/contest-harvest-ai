// src/scrapers/competitors/WebsiteScraper.js

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes the main content and links from a competitor website.
 * @param {string} url - The website URL to scrape.
 * @returns {Promise<Object>} Main text content and all links.
 */
async function scrapeWebsite(url) {
  try {
    const { data: html } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    const links = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#')) links.push(href);
    });
    return { text, links };
  } catch (error) {
    return { error: error.message || 'Failed to scrape website' };
  }
}

module.exports = { scrapeWebsite };
