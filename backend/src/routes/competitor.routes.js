const express = require('express');
const { supabase } = require('../integrations/storage/SupabaseClient');
const ContentScraper = require('../scrapers/competitors/ContentScraper');
const { validateCompetitor } = require('../middleware/validation.middleware');
const router = express.Router();

// Get all competitors
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase()
      .from('competitors')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add competitor
router.post('/', validateCompetitor, async (req, res) => {
  try {
    const { name, website, description, industry } = req.body;
    
    const { data, error } = await supabase()
      .from('competitors')
      .insert([{
        user_id: req.user.id,
        name,
        website,
        description,
        industry,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Scrape competitor content
router.post('/:id/scrape', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: competitor, error } = await supabase()
      .from('competitors')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !competitor) {
      return res.status(404).json({ success: false, message: 'Competitor not found' });
    }

    const scraper = new ContentScraper();
    const content = await scraper.scrapeContent(competitor.website);

    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;