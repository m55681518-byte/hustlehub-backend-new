const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const pendingTransactions = new Map()

class MpesaService {
  constructor() {
    this.baseUrl = process.env.MPESA_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'
  }

  async getAccessToken() {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')
    const response = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    )
    return response.data.access_token
  }

  getTimestamp() {
    const d = new Date()
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`
  }

  getPassword(timestamp) {
    return Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')
  }

  formatPhone(phone) {
    let p = phone.replace(/\s/g, '')
    if (p.startsWith('0')) p = '254' + p.slice(1)
    if (p.startsWith('+')) p = p.slice(1)
    return p
  }

  async sendSTKPush({ phone, amount, userId, description }) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!userId || !uuidRegex.test(userId)) {
        return { success: false, message: 'Invalid user ID' }
      }

      const token = await this.getAccessToken()
      const timestamp = this.getTimestamp()
      const password = this.getPassword(timestamp)
      const formattedPhone = this.formatPhone(phone)

      const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: 'HustleHub',
        TransactionDesc: description || 'Payment'
      }

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )

      const data = response.data
      if (data.CheckoutRequestID) {
        pendingTransactions.set(data.CheckoutRequestID, {
          userId, phone: formattedPhone, amount,
          status: 'pending', createdAt: new Date().toISOString()
        })
      }

      return {
        success: true,
        data: {
          checkoutRequestId: data.CheckoutRequestID,
          merchantRequestId: data.MerchantRequestID,
          responseDescription: data.ResponseDescription
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.errorMessage || error.message
      }
    }
  }

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
        const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value

        if (transaction?.userId) {
          await supabase.from('payments').insert({
            user_id: transaction.userId,
            amount: amountPaid || transaction.amount,
            phone_number: phone || transaction.phone,
            status: 'completed',
            mpesa_receipt: mpesaReceipt,
            checkout_request_id: checkoutRequestId
          })
        }

        if (transaction) {
          transaction.status = 'success'
          pendingTransactions.set(checkoutRequestId, transaction)
        }

        return { status: 'success' }
      } else {
        if (transaction) {
          transaction.status = 'failed'
          pendingTransactions.set(checkoutRequestId, transaction)
        }
        return { status: 'failed', message: body.ResultDesc }
      }
    } catch (error) {
      return { status: 'error', message: error.message }
    }
  }

  async checkPaymentStatus(checkoutRequestId) {
    const transaction = pendingTransactions.get(checkoutRequestId)
    if (!transaction) return { status: 'not_found' }
    return {
      status: transaction.status,
      data: { amount: transaction.amount, phone: transaction.phone }
    }
  }
}

module.exports = new MpesaService()