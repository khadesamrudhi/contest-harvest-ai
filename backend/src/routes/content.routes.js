const express = require('express');
const { supabase } = require('../integrations/storage/SupabaseClient');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase()
      .from('content')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;