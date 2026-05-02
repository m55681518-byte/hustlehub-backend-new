require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'HustleHub API', version: '2.0.0' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// M-Pesa routes
const stkpushRoute = require('./routes/stkpush')
const callbackRoute = require('./routes/callback')
const statusRoute = require('./routes/status')

app.use('/stkpush', stkpushRoute)
app.use('/callback', callbackRoute)
app.use('/payment-status', statusRoute)

// AI route
const aiRoute = require('./routes/ai')
app.use('/ai', aiRoute)

// App routes
const hustlesRoute = require('./routes/hustles')
const profilesRoute = require('./routes/profiles')
const paymentsRoute = require('./routes/payments')

app.use('/hustles', hustlesRoute)
app.use('/profiles', profilesRoute)
app.use('/payments', paymentsRoute)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app