// File: routes/callback.js
const express = require('express')
const router = express.Router()
const mpesaService = require('../services/mpesaService')

router.post('/', async (req, res) => {
  try {
    // This calls the logic we updated in mpesaService.js[cite: 14, 15]
    const result = await mpesaService.handleCallback(req.body)
    
    // Always return a 200 OK to Safaricom so they don't keep retrying
    res.json({ status: 'ok', result })
  } catch (error) {
    console.error("Callback Error:", error)
    res.status(200).json({ status: 'error_logged' })
  }
})

module.exports = router