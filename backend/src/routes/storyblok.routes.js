const express = require('express');
const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      data: { 
        connected: false, 
        message: 'Storyblok integration not configured' 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;