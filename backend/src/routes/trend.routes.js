const express = require('express');
const { supabase } = require('../integrations/storage/SupabaseClient');
const GoogleTrendsScraper = require('../scrapers/trends/GoogleTrendsScraper');
const router = express.Router();

// Get trending topics
router.get('/', async (req, res) => {
  try {
    const { category = 'general', limit = 20 } = req.query;
    
    const { data, error } = await supabase()
      .from('trends')
      .select('*')
      .eq('category', category)
      .order('trend_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Search trends
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }

    const scraper = new GoogleTrendsScraper();
    const trends = await scraper.getTrendData(keyword);

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;