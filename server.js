require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors()) 
app.use(express.json())

app.use((req, res, next) => {
  console.log(`>>> ${req.method} request to ${req.path}`)
  next()
})

const aiRoute = require('./routes/ai')
app.use('/ai', aiRoute)

const trackingRoute = require('./routes/tracking')
app.use('/track', trackingRoute)

const hustlesRoute = require('./routes/hustles')
app.use('/hustles', hustlesRoute)

// REMOVED the profiles and payments lines because they cause crashes if files are missing[cite: 3, 4]

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`HustleHub Backend live on port ${PORT}`)
})

module.exports = app