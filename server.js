require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

// Health check - must respond immediately for Render
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'HustleHub API', version: '2.0.0' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// Import routes
const stkpushRoute = require('./routes/stkpush')
const callbackRoute = require('./routes/callback')
const statusRoute = require('./routes/status')

app.use('/stkpush', stkpushRoute)
app.use('/callback', callbackRoute)
app.use('/payment-status', statusRoute)

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

// Get port from environment
const PORT = process.env.PORT || 10000

// Start server - bind to all interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://0.0.0.0:${PORT}/health`)
})

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err)
  process.exit(1)
})