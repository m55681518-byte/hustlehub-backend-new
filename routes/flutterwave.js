const express = require('express')
const router  = express.Router()
const axios   = require('axios')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FLW_SECRET = process.env.FLW_SECRET_KEY
const FLW_BASE   = 'https://api.flutterwave.com/v3'

// ── POST /payments/verify ─────────────────────────────────────────────────
// Called by frontend after Flutterwave redirects back
// NEVER trust the frontend — always verify server-side
router.post('/verify', async (req, res) => {
  try {
    const { transaction_id, tx_ref, userId } = req.body

    if (!transaction_id || !tx_ref || !userId) {
      return res.status(400).json({
        success: false,
        message: 'transaction_id, tx_ref and userId are required'
      })
    }

    // 1. Verify with Flutterwave API (server-side)
    const flwRes = await axios.get(
      `${FLW_BASE}/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    const flwData = flwRes.data?.data

    // 2. Validate the response
    if (
      flwRes.data?.status !== 'success' ||
      flwData?.status !== 'successful' ||
      flwData?.tx_ref !== tx_ref
    ) {
      console.log('Payment verification failed:', flwRes.data)
      return res.json({ success: false, message: 'Payment verification failed.' })
    }

    const amount   = flwData.amount
    const currency = flwData.currency
    const receipt  = flwData.flw_ref

    console.log(`✅ Payment verified: ${receipt} — ${currency} ${amount}`)

    // 3. Save to payments table
    await supabase.from('payments').insert([{
      user_id:        userId,
      amount:         amount,
      status:         'success',
      mpesa_receipt:  receipt,
      checkout_request_id: tx_ref,
      description:    'HustleHub Pro — Flutterwave',
      paid_at:        new Date().toISOString(),
    }])

    // 4. Save to earnings table
    await supabase.from('earnings').insert([{
      user_id:     userId,
      amount:      amount,
      type:        'payment',
      description: 'Pro subscription payment',
      reference:   receipt,
      status:      'completed',
    }])

    // 5. Unlock premium for this user
    await supabase
      .from('profiles')
      .update({
        is_premium:           true,
        premium_unlocked_at:  new Date().toISOString(),
      })
      .eq('id', userId)

    console.log(`🔓 Premium unlocked for user: ${userId}`)

    res.json({
      success: true,
      message: 'Payment verified and premium unlocked!',
      data: { amount, currency, receipt },
    })

  } catch (error) {
    console.error('Flutterwave verify error:', error.response?.data || error.message)
    res.status(500).json({ success: false, message: 'Verification failed. Please contact support.' })
  }
})

// ── POST /payments/webhook ────────────────────────────────────────────────
// Flutterwave calls this automatically after payment
// Add this URL in your Flutterwave dashboard → Settings → Webhooks
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['verif-hash']
    if (signature !== process.env.FLW_WEBHOOK_HASH) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const event = req.body
    console.log('Webhook received:', event.event, event.data?.tx_ref)

    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      const tx_ref = event.data.tx_ref
      const userId = tx_ref.split('_')[1] // we embed userId in tx_ref

      if (userId) {
        await supabase
          .from('profiles')
          .update({ is_premium: true, premium_unlocked_at: new Date().toISOString() })
          .eq('id', userId)

        console.log(`🔓 Webhook: Premium unlocked for ${userId}`)
      }
    }

    res.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error.message)
    res.status(200).json({ status: 'error_logged' }) // always 200 to Flutterwave
  }
})

module.exports = router
