const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /hustles - List all active hustles
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hustles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, count: data.length, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /hustles/:id - Get single hustle
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hustles')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /hustles - Create new hustle
router.post('/', async (req, res) => {
  try {
    const { title, description, category, payout_amount } = req.body

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' })
    }

    const { data, error } = await supabase
      .from('hustles')
      .insert([{ 
        title, 
        description, 
        category, 
        payout_amount: payout_amount || 0,
        status: 'active'
      }])
      .select()

    if (error) throw error
    res.json({ success: true, data: data[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /hustles/:id - Update hustle
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, payout_amount, status } = req.body

    const { data, error } = await supabase
      .from('hustles')
      .update({ title, description, category, payout_amount, status })
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ success: true, data: data[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
