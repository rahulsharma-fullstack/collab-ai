const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/smart-reply', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: `Suggest a concise, casual reply to this message: "${message}"` }
            ]
          }
        ]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response');
    }

    const suggestion = response.data.candidates[0].content.parts[0].text.trim();
    res.json([suggestion]);
  } catch (err) {
    console.error('AI error:', err.response?.data || err.message);
    res.status(500).json(['Nice!']);
  }
});

module.exports = router;