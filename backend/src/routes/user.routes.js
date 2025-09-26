const express = require('express');
const { supabase } = require('../integrations/storage/SupabaseClient');
const router = express.Router();

router.get('/profile', async (req, res) => {
  try {
    const { data, error } = await supabase()
      .from('users')
      .select('id, name, email, plan, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;