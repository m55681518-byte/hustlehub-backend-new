const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const providers = [
  {
    name: 'Gemini (Primary)',
    call: async (msg, hist, inst) => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: inst });
      const result = await model.startChat({ history: hist }).sendMessage(msg);
      return result.response.text();
    }
  },
  {
    name: 'Groq (Backup 1)',
    call: async (msg, hist, inst) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "llama-3.3-70b-versatile", 
          messages: [{ role: "system", content: inst }, { role: "user", content: msg }] 
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  {
    name: 'OpenRouter (Backup 2)',
    call: async (msg, hist, inst) => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "google/gemini-2.0-flash-exp:free", 
          messages: [{ role: "system", content: inst }, { role: "user", content: msg }] 
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  {
    name: 'Together AI (Backup 3)',
    call: async (msg, hist, inst) => {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", 
          messages: [{ role: "system", content: inst }, { role: "user", content: msg }] 
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  {
    name: 'DeepSeek (Backup 4)',
    call: async (msg, hist, inst) => {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: "deepseek-chat", 
          messages: [{ role: "system", content: inst }, { role: "user", content: msg }] 
        })
      });
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  {
    name: 'Hugging Face (Backup 5)',
    call: async (msg) => {
      const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-v0.1", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.HF_API_KEY}` },
        body: JSON.stringify({ inputs: msg })
      });
      const data = await res.json();
      // HF sometimes returns an array or a single object
      return Array.isArray(data) ? data[0].generated_text : data.generated_text;
    }
  }
];

router.post('/chat', async (req, res) => {
  const { message, history, systemInstruction } = req.body;
  const validHistory = (history && history.length > 0 && history[0].role === 'user') ? history : [];

  for (const provider of providers) {
    try {
      console.log(`>>> HustleBot attempting ${provider.name}...`);
      const reply = await provider.call(message, validHistory, systemInstruction);
      
      // We return 'source' as well so you can see in the logs which one is working
      return res.json({ reply, source: provider.name }); 
    } catch (err) {
      console.error(`${provider.name} failed:`, err.message);
      // Fail silently and move to the next provider in the loop
    }
  }

  // Final failsafe message if everything explodes
  res.status(500).json({ reply: "My systems are having a moment. Give me a minute to reset!" });
});

module.exports = router;