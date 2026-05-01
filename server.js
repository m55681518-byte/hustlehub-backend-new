require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'HustleHub API', version: '2.0.0' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

const stkpushRoute = require('./routes/stkpush')
const callbackRoute = require('./routes/callback')
const statusRoute = require('./routes/status')

app.use('/stkpush', stkpushRoute)
app.use('/callback', callbackRoute)
app.use('/payment-status', statusRoute)

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})