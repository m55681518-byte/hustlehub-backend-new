const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /payments/:userId - Get user's payments
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /payments/stats/:userId - Get payment stats
router.get('/stats/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('user_id', req.params.userId)

    if (error) throw error

    const stats = {
      total: data.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      completed: data.filter(p => p.status === 'completed').length,
      pending: data.filter(p => p.status === 'pending').length,
      count: data.length
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
