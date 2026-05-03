const express = require('express');
const router = express.Router();

// Route to log affiliate and ad clicks
router.post('/click', (req, res) => {
  const { item, type, timestamp } = req.body;
  
  // For now, we log to the terminal. In production, you'd save this to Supabase.
  console.log(`[TRACKING] ${new Date(timestamp).toLocaleString()}: User clicked ${type} - ${item}`);
  
  res.json({ success: true, message: 'Click tracked' });
});

module.exports = router;