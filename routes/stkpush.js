const express = require('express')
const router = express.Router()
const mpesaService = require('../services/mpesaService')

router.post('/', async (req, res) => {
  try {
    const { phone, amount, userId, description } = req.body
    if (!phone || !amount || !userId) {
      return res.status(400).json({ success: false, message: 'Phone, amount, and userId required' })
    }
    const result = await mpesaService.sendSTKPush({ phone, amount, userId, description })
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router