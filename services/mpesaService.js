const axios = require('axios')
const { supabaseAdmin } = require('../lib/supabase') // Point to the admin client

const pendingTransactions = new Map()

class MpesaService {
  constructor() {
    this.baseUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'
  }

  // ... keep other helper functions (getAccessToken, etc)[cite: 12]

  async handleCallback(callbackData) {
    try {
      const body = callbackData.Body?.stkCallback || callbackData
      if (body.ResultCode === 0) {
        const checkoutRequestId = body.CheckoutRequestID
        const transaction = pendingTransactions.get(checkoutRequestId)
        const metadata = body.CallbackMetadata?.Item || []
        const mpesaReceipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value

        if (transaction?.userId) {
          // 1. Update Payment Record
          await supabaseAdmin.from('payments').insert({
            user_id: transaction.userId,
            amount: transaction.amount,
            status: 'completed',
            mpesa_receipt: mpesaReceipt
          })

          // 2. UNLOCK PRO STATUS[cite: 12]
          await supabaseAdmin.from('profiles')
            .update({ is_pro: true })
            .eq('id', transaction.userId)
        }
        return { status: 'success' }
      }
      return { status: 'failed' }
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  }
}

module.exports = new MpesaService()