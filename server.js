require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

// Helper to ensure the lib folder exists or use a direct path
const { supabaseAdmin } = require('./lib/supabase') 

app.use(cors()) 
app.use(express.json())

app.use((req, res, next) => {
  console.log(`>>> ${req.method} request to ${req.path}`)
  next()
})

// Routes
const aiRoute = require('./routes/ai')
const trackingRoute = require('./routes/tracking')
const hustlesRoute = require('./routes/hustles')
const callbackRoute = require('./routes/callback') // Added this
const stkpushRoute = require('./routes/stkpush')   // Added this

app.use('/ai', aiRoute)
app.use('/track', trackingRoute)
app.use('/hustles', hustlesRoute)
app.use('/callback', callbackRoute)
app.use('/stkpush', stkpushRoute)

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`HustleHub Backend live on port ${PORT}`)
})

module.exports = app