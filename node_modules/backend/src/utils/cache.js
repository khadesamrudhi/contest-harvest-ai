// src/utils/cache.js

const NodeCache = require('node-cache');
const { CACHE } = require('./constants');

class Cache {
  constructor() {
    // In-memory cache for hackathon
    this.cache = new NodeCache({
      stdTTL: CACHE.TTL,
      maxKeys: CACHE.MAX_SIZE,
      checkperiod: 600 // Check for expired keys every 10 minutes
    });
    
    // Redis cache (if available)
    this.redis = null;
    this.initRedis();
  }

  // Initialize Redis (optional for hackathon)
  initRedis() {
    try {
      if (process.env.REDIS_URL) {
        const redis = require('redis');
        this.redis = redis.createClient({ url: process.env.REDIS_URL });
        this.redis.connect();
        console.log('Redis cache connected');
      }
    } catch (error) {
      console.log('Redis not available, using in-memory cache');
    }
  }

  // Get value from cache
  async get(key) {
    try {
      const cacheKey = this.getKey(key);
      
      // Try Redis first
      if (this.redis) {
        const value = await this.redis.get(cacheKey);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback to in-memory
      return this.cache.get(cacheKey) || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set value in cache
  async set(key, value, ttl = CACHE.TTL) {
    try {
      const cacheKey = this.getKey(key);
      
      // Set in Redis
      if (this.redis) {
        await this.redis.setEx(cacheKey, ttl, JSON.stringify(value));
      }
      
      // Set in memory
      this.cache.set(cacheKey, value, ttl);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete from cache
  async del(key) {
    try {
      const cacheKey = this.getKey(key);
      
      // Delete from Redis
      if (this.redis) {
        await this.redis.del(cacheKey);
      }
      
      // Delete from memory
      this.cache.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async has(key) {
    try {
      const cacheKey = this.getKey(key);
      
      // Check Redis first
      if (this.redis) {
        const exists = await this.redis.exists(cacheKey);
        return exists === 1;
      }
      
      // Check memory
      return this.cache.has(cacheKey);
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  // Clear all cache
  async clear() {
    try {
      // Clear Redis
      if (this.redis) {
        const keys = await this.redis.keys(CACHE.REDIS_PREFIX + '*');
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      }
      
      // Clear memory
      this.cache.flushAll();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Cache with callback (get or set)
  async remember(key, callback, ttl = CACHE.TTL) {
    try {
      // Try to get from cache first
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }
      
      // Execute callback to get fresh data
      value = await callback();
      
      // Store in cache
      await this.set(key, value, ttl);
      
      return value;
    } catch (error) {
      console.error('Cache remember error:', error);
      // Return fresh data on error
      return await callback();
    }
  }

  // Cache user data
  async cacheUser(userId, userData, ttl = 1800) {
    return await this.set(`user:${userId}`, userData, ttl);
  }

  // Get cached user
  async getUser(userId) {
    return await this.get(`user:${userId}`);
  }

  // Cache content
  async cacheContent(contentId, contentData, ttl = 3600) {
    return await this.set(`content:${contentId}`, contentData, ttl);
  }

  // Get cached content
  async getContent(contentId) {
    return await this.get(`content:${contentId}`);
  }

  // Cache API response
  async cacheAPI(endpoint, params, data, ttl = 600) {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    return await this.set(key, data, ttl);
  }

  // Get cached API response
  async getAPI(endpoint, params) {
    const key = `api:${endpoint}:${this.hashParams(params)}`;
    return await this.get(key);
  }

  // Generate cache key with prefix
  getKey(key) {
    return CACHE.REDIS_PREFIX + key;
  }

  // Hash parameters for cache key
  hashParams(params) {
    if (!params) return 'empty';
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
  }

  // Get cache stats
  getStats() {
    const memoryStats = this.cache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
      },
      redis: this.redis ? 'connected' : 'not available'
    };
  }

  // Increment counter in cache
  async increment(key, amount = 1, ttl = CACHE.TTL) {
    try {
      const currentValue = (await this.get(key)) || 0;
      const newValue = currentValue + amount;
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      console.error('Cache increment error:', error);
      return amount;
    }
  }

  // Set expiry for existing key
  async expire(key, ttl) {
    try {
      const value = await this.get(key);
      if (value !== null) {
        return await this.set(key, value, ttl);
      }
      return false;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }
}

module.exports = new Cache();