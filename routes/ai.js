const express = require('express')
const router  = express.Router()
const axios   = require('axios')

const SYSTEM_PROMPT = `You are HustleBot, an AI assistant built into HustleHub — a Kenyan gig marketplace where people post and find short-term work called "hustles".

Your job is to help users:
- Find the right hustle for their skills
- Write compelling hustle descriptions that attract quality applicants
- Give advice on fair pricing for different types of work in Kenya
- Explain how to apply for hustles successfully
- Give tips on completing hustles and building a strong reputation
- Help premium users generate full hustle listings from a brief idea

Be friendly, practical, and brief. Speak like a helpful Kenyan friend who knows the local job market. Use simple English. Occasionally use phrases like "sawa", "poa", "hakuna matata" where natural. Keep answers to 2-4 sentences unless the user asks for more detail.

If someone asks you to write a hustle, respond with a JSON object in this exact format:
{"title":"...","category":"...","description":"...","payout_amount":...,"location":"..."}

If asked anything unrelated to work or the app, redirect kindly.`

// POST /ai/chat — proxies to Groq, keeps API key server-side
router.post('/chat', async (req, res) => {
  try {
    const { messages, isPremium } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages array required' })
    }

    const contextMessages = isPremium ? messages : messages.slice(-6)

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model:      'llama-3.3-70b-versatile',
        max_tokens: isPremium ? 800 : 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...contextMessages.map(m => ({ role: m.role, content: m.content })),
        ],
      },
      {
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        timeout: 30000,
      }
    )

    const reply = response.data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response."
    res.json({ success: true, reply })
  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message)
    res.status(500).json({ success: false, message: 'AI service temporarily unavailable.' })
  }
})

module.exports = router