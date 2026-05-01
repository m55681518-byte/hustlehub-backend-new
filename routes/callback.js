const express = require('express')
const router = express.Router()
const mpesaService = require('../services/mpesaService')

router.post('/', async (req, res) => {
  try {
    const result = await mpesaService.handleCallback(req.body)
    res.json({ status: 'ok', result })
  } catch (error) {
    res.status(200).json({ status: 'error_logged' })
  }
})

router.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Callback endpoint active' })
})

module.exports = router