const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET /profiles/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /profiles/:id - Update profile
router.put('/:id', async (req, res) => {
  try {
    const { full_name, phone_number, avatar_url } = req.body

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, phone_number, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()

    if (error) throw error
    res.json({ success: true, data: data[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
