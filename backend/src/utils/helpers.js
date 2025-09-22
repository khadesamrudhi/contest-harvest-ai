// src/utils/helpers.js

const crypto = require('crypto');
const { URL } = require('url');

class Helpers {
  // Generate random string
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash string
  static hashString(string, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(string).digest('hex');
  }

  // Validate URL
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Normalize URL
  static normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash
      urlObj.pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
      // Sort query parameters
      urlObj.searchParams.sort();
      return urlObj.href;
    } catch (error) {
      return url;
    }
  }

  // Extract domain from URL
  static extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  }

  // Sanitize string for database
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/\s+/g, ' ');
  }

  // Format date to ISO string
  static formatDate(date) {
    return new Date(date).toISOString();
  }

  // Calculate reading time
  static calculateReadingTime(text, wordsPerMinute = 200) {
    if (!text || typeof text !== 'string') return 0;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Truncate text
  static truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Deep clone object
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Remove duplicate items from array
  static removeDuplicates(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const val = item[key];
        if (seen.has(val)) return false;
        seen.add(val);
        return true;
      });
    }
    
    return [...new Set(array)];
  }

  // Delay execution
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function with exponential backoff
  static async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }

  // Parse JSON safely
  static parseJSON(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      return defaultValue;
    }
  }

  // Generate slug from text
  static generateSlug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if string is empty or whitespace only
  static isEmpty(str) {
    return !str || typeof str !== 'string' || str.trim().length === 0;
  }

  // Capitalize first letter of each word
  static capitalizeWords(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  // Convert camelCase to snake_case
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Convert snake_case to camelCase
  static snakeToCamel(str) {
    return str.replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace('-', '').replace('_', '')
    );
  }

  // Generate UUID v4
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Extract keywords from text
  static extractKeywords(text, minLength = 3, maxWords = 10) {
    if (!text || typeof text !== 'string') return [];
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length >= minLength)
      .filter(word => !this.isStopWord(word));
    
    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top words
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, maxWords);
  }

  // Check if word is a common stop word
  static isStopWord(word) {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
      'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her',
      'its', 'our', 'their'
    ];
    return stopWords.includes(word.toLowerCase());
  }

  // Format number with commas
  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Calculate percentage
  static calculatePercentage(part, total, decimals = 2) {
    if (total === 0) return 0;
    return parseFloat(((part / total) * 100).toFixed(decimals));
  }

  // Get time ago string
  static timeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHour = Math.floor(diffInMin / 60);
    const diffInDay = Math.floor(diffInHour / 24);
    const diffInWeek = Math.floor(diffInDay / 7);
    const diffInMonth = Math.floor(diffInDay / 30);
    const diffInYear = Math.floor(diffInDay / 365);

    if (diffInYear > 0) return `${diffInYear} year${diffInYear > 1 ? 's' : ''} ago`;
    if (diffInMonth > 0) return `${diffInMonth} month${diffInMonth > 1 ? 's' : ''} ago`;
    if (diffInWeek > 0) return `${diffInWeek} week${diffInWeek > 1 ? 's' : ''} ago`;
    if (diffInDay > 0) return `${diffInDay} day${diffInDay > 1 ? 's' : ''} ago`;
    if (diffInHour > 0) return `${diffInHour} hour${diffInHour > 1 ? 's' : ''} ago`;
    if (diffInMin > 0) return `${diffInMin} minute${diffInMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Chunk array into smaller arrays
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Flatten nested array
  static flattenArray(arr) {
    return arr.reduce((flat, item) => 
      flat.concat(Array.isArray(item) ? this.flattenArray(item) : item), []
    );
  }

  // Get random element from array
  static getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Shuffle array
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Check if object is empty
  static isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  // Pick specific properties from object
  static pick(obj, keys) {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {});
  }

  // Omit specific properties from object
  static omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  // Merge objects deeply
  static mergeDeep(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    
    return output;
  }

  // Check if value is an object
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Debounce function
  static debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Convert string to title case
  static toTitleCase(str) {
    return str.replace(/\w\S*/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  // Escape HTML characters
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Strip HTML tags
  static stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Generate color from string (for avatars, etc.)
  static stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }
}

module.exports = Helpers;