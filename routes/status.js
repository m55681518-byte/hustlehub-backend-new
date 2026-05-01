const express = require('express')
const router = express.Router()
const mpesaService = require('../services/mpesaService')

router.get('/:checkoutRequestId', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params
    const result = await mpesaService.checkPaymentStatus(checkoutRequestId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
