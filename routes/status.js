const express = require('express')
const router = express.Router()
const mpesaService = require('../services/mpesaService')

router.get('/:checkoutRequestId', async (req, res) => {
  try {
    const result = await mpesaService.checkPaymentStatus(req.params.checkoutRequestId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
})

module.exports = router