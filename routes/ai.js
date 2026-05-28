// routes/ai.js — EcoBot AI Assistant (Groq Powered)

const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const SYSTEM_PROMPT = `
You are EcoBot, the AI sustainability assistant for EcoServe.

Your goals:
- Help users manage waste responsibly
- Explain waste segregation clearly
- Give practical recycling advice
- Promote eco-friendly habits
- Help users use EcoServe platform features

Rules:
- Keep answers concise and useful
- Use bullet points when helpful
- Sound friendly and modern
- Avoid robotic responses
- Use emojis sparingly
- Never invent fake facts
- Suggest actionable steps
- Keep responses under 180 words

Waste categories:
- Wet waste
- Dry waste
- Plastic
- Glass
- E-waste
- Hazardous waste
- Organic waste

If users ask unrelated questions:
Politely redirect them toward sustainability or EcoServe features.
`;

const OFFLINE_TIPS = [
  "♻️ Separate wet and dry waste daily for better recycling efficiency.",
  "🌿 Composting kitchen waste can reduce household garbage by up to 30%.",
  "🔋 Never throw batteries in regular bins — use e-waste collection centers.",
  "🧴 Clean plastic containers before recycling to avoid contamination.",
  "📦 Reusing containers and bags reduces landfill waste significantly.",
  "🌍 Small recycling habits collectively create massive environmental impact."
];

// ====================================
// POST /api/ai/chat
// ====================================
router.post('/chat', authenticate, async (req, res) => {

  try {

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || !messages.length) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required.'
      });
    }

    // Offline fallback if API key missing
    if (!process.env.GROQ_API_KEY) {

      const randomTip =
        OFFLINE_TIPS[Math.floor(Math.random() * OFFLINE_TIPS.length)];

      return res.json({
        success: true,
        reply:
`🤖 EcoBot AI is currently running in offline mode.

${randomTip}`
      });
    }

    // Keep recent context only
    const trimmed = messages.slice(-5);

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

    // Call Groq API
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',

          messages: groqMessages,

          temperature: 0.7,

          max_tokens: 500
        })
      }
    );

    const data = await response.json();

    console.log('Groq Response:', data);

    // Handle API errors
    if (!response.ok) {

      console.error('Groq API Error:', data);

      if (response.status === 429) {
        return res.json({
          success: true,
          reply:
            '⏳ EcoBot is currently busy. Please try again in a few moments.'
        });
      }

      return res.json({
        success: true,
        reply:
          '⚠️ EcoBot AI is temporarily unavailable.'
      });
    }

    // Extract reply
    const reply =
      data?.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response right now.';

    return res.json({
      success: true,
      reply
    });

  } catch (err) {

    console.error('AI Route Error:', err);

    const randomTip =
      OFFLINE_TIPS[Math.floor(Math.random() * OFFLINE_TIPS.length)];

    return res.json({
      success: true,
      reply:
`⚠️ EcoBot is temporarily offline.

${randomTip}`
    });
  }
});

// ====================================
// GET /api/ai/fact
// ====================================
router.get('/fact', authenticate, (req, res) => {

  const facts = [

    {
      stat: '2.01B tonnes',
      detail: 'of municipal waste generated globally every year.'
    },

    {
      stat: '91%',
      detail: 'of plastic waste has never been recycled.'
    },

    {
      stat: '62 MT',
      detail: 'of waste is generated annually in India.'
    },

    {
      stat: '500 years',
      detail: 'for plastic bottles to decompose in landfills.'
    },

    {
      stat: '17 trees',
      detail: 'saved by recycling 1 tonne of paper.'
    },

    {
      stat: '70%',
      detail: 'less energy used when recycling paper.'
    }

  ];

  const fact =
    facts[Math.floor(Math.random() * facts.length)];

  return res.json({
    success: true,
    fact
  });
});

module.exports = router;
