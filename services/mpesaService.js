// File: services/mpesaService.js
const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase Admin client[cite: 14]
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Uses your secret key from Render[cite: 14]
)

const pendingTransactions = new Map()

class MpesaService {
  // ... (keep constructor, getAccessToken, getTimestamp, getPassword, formatPhone as is)[cite: 14]

  async handleCallback(callbackData) {
    try {
      const body = callbackData.Body?.stkCallback || callbackData
      const resultCode = body.ResultCode
      const checkoutRequestId = body.CheckoutRequestID
      const transaction = pendingTransactions.get(checkoutRequestId)

      if (resultCode === 0) {
        const metadata = body.CallbackMetadata?.Item || []
        const amountPaid = metadata.find(i => i.Name === 'Amount')?.Value
        const mpesaReceipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
        
        if (transaction?.userId) {
          // 1. Record the successful payment
          await supabase.from('payments').insert({
            user_id: transaction.userId,
            amount: amountPaid || transaction.amount,
            status: 'completed',
            mpesa_receipt: mpesaReceipt,
            transaction_type: 'deposit'
          })

          // 2. CRITICAL: Flip the is_pro switch to true
          // This allows App_7.js to stop showing ads
          await supabase.from('profiles')
            .update({ is_pro: true })
            .eq('id', transaction.userId)
        }

        if (transaction) {
          transaction.status = 'success'
          pendingTransactions.set(checkoutRequestId, transaction)
        }
        return { status: 'success' }
      } else {
        // ... (keep existing failure logic)[cite: 14]
        return { status: 'failed', message: body.ResultDesc }
      }
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  }
  // ... (keep other functions)[cite: 14]
}

module.exports = new MpesaService()