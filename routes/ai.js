// routes/ai.js – AI proxy using GROQ API for EcoBot assistant
const express = require('express');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const SYSTEM_PROMPT = `You are EcoBot, an expert AI assistant for EcoServe — a smart waste collection and management platform in India.
You help citizens, collectors, and admins with:
- Waste segregation: plastics, paper, glass, metals, organic, hazardous, e-waste
- Recycling guidelines and best practices
- Composting and organic waste management
- Hazardous waste handling and safety
- E-waste disposal and drop-off guidance
- Environmental impact of improper waste disposal
- EcoServe platform: pickup requests, complaints, schedules
- Indian waste management regulations (SWM Rules 2016)
- Zero-waste lifestyle tips

Keep responses concise (under 200 words), friendly, practical and actionable.
Use emojis sparingly for warmth. Always emphasize environmental responsibility.
If asked about pickup schedules or requests, remind the user to check their dashboard.
Never provide medical, legal, or financial advice.`;

// POST /api/ai/chat
router.post('/chat', authenticate, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ success: false, message: 'Messages array is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    // Graceful offline fallback
    const offlineTips = [
      "♻️ Separate dry waste (plastic, paper, metal) from wet waste (food scraps) every day. It dramatically increases recycling rates!",
      "🌿 Composting your kitchen scraps reduces household waste by up to 30% and creates rich fertilizer for plants.",
      "🔋 Never throw batteries in general waste — they contain toxic lead and cadmium. Take them to e-waste collection points.",
      "💧 Recycling 1 tonne of paper saves 26,000 litres of water and 17 trees. Always crush and clean before recycling!",
      "🧴 Rinse plastic containers before recycling. Contaminated plastic cannot be recycled and ends up in landfill.",
      "🌍 India generates 62 million tonnes of waste annually. Proper segregation at source can reduce landfill load by 60%!"
    ];
    const tip = offlineTips[Math.floor(Math.random() * offlineTips.length)];
    return res.json({
      success: true,
      reply: `🤖 EcoBot AI is not configured yet.\n\nAdd your **GROQ_API_KEY** to the \`.env\` file to enable full AI chat.\n\nMeanwhile, here's a tip:\n\n${tip}`
    });
  }
try {
    const trimmed = messages.slice(-4);

    const groqMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      ...trimmed.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 600
      })
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      console.error('Groq API error:', JSON.stringify(data));

      if (response.status === 429) {
        return res.json({
          success: true,
          reply: '⏳ EcoBot is busy right now. Please try again shortly!'
        });
      }

      return res.json({
        success: true,
        reply: '⚠️ EcoBot AI is temporarily unavailable.'
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    return res.json({ success: true, reply });


  } catch (err) {
    console.error('AI proxy error:', err.message);
    return res.json({
      success: true,
      reply: '⚠️ EcoBot is temporarily offline. Please check your internet connection and try again.\n\n🌿 Tip: Always segregate waste at source — it is the most effective step you can take for the environment!'
    });
  }
});

// GET /api/ai/fact – Random eco fact
router.get('/fact', authenticate, (req, res) => {
  const facts = [
    { stat: '2.01B tonnes', detail: 'of municipal solid waste generated globally every year.' },
    { stat: '91%',          detail: 'of all plastic ever produced has never been recycled.' },
    { stat: '40%',          detail: 'of all food produced globally is wasted every year.' },
    { stat: '62 MT',        detail: 'of waste generated in India annually; only 20% is processed.' },
    { stat: '500 years',    detail: 'for a plastic bottle to decompose in a landfill.' },
    { stat: '₹25,000 Cr',  detail: 'worth of recyclable material lost to Indian landfills annually.' },
    { stat: '70%',          detail: 'less energy used when recycling paper vs making from raw wood.' },
    { stat: '17 trees',     detail: 'saved by recycling just 1 tonne of paper.' }
  ];
  const fact = facts[Math.floor(Math.random() * facts.length)];
  return res.json({ success: true, fact });
});

module.exports = router;
