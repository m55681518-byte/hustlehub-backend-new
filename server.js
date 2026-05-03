require('dotenv').config()
const express = require('express')
const cors = require('cors')
const axios = require('axios')
const { supabaseAdmin } = require('./lib/supabase') // Import the admin client
const app = express()

app.use(cors()) 
app.use(express.json())

// --- M-PESA LOGIC START ---

// 1. Trigger STK Push (Called by PremiumPage_3.js)
app.post('/stkpush', async (req, res) => {
  const { phone, userId } = req.body;
  
  try {
    // In production, insert Daraja logic here to send the push
    // Ensure 'AccountReference' in your Safaricom call is set to 'userId'[cite: 17]
    console.log(`STK Push initiated for ${userId} at ${phone}`);
    
    // Create a 'pending' record in Supabase so we can track it[cite: 17]
    await supabaseAdmin
      .from('payments')
      .insert([{ user_id: userId, amount: 30, status: 'pending', phone_number: phone }]);

    res.status(200).json({ success: true, message: "Check your phone for PIN prompt" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. M-Pesa Callback (Called by Safaricom)[cite: 17]
app.post('/callback', async (req, res) => {
  const { Body } = req.body;
  
  if (Body.stkCallback.ResultCode === 0) {
    const metadata = Body.stkCallback.CallbackMetadata.Item;
    const mpesaReceipt = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
    const userId = Body.stkCallback.ExternalReference; // This matches AccountReference[cite: 17]

    console.log(`Processing Success: User ${userId}, Receipt ${mpesaReceipt}`);
    
    // 1. Mark payment as success[cite: 17]
    await supabaseAdmin
      .from('payments')
      .update({ status: 'success', transaction_id: mpesaReceipt })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // 2. Unlock Pro features in profiles table[cite: 17]
    await supabaseAdmin
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId);
  }
  
  res.status(200).send("Callback Processed");
});

// --- M-PESA LOGIC END ---

const aiRoute = require('./routes/ai')
app.use('/ai', aiRoute)

const trackingRoute = require('./routes/tracking')
app.use('/track', trackingRoute)

const hustlesRoute = require('./routes/hustles')
app.use('/hustles', hustlesRoute)

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log(`HustleHub Backend live on port ${PORT}`)
})

module.exports = app