const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Health check
app.get('/', (req, res) => {
  res.send('Magic Mirror AI backend is running');
});

// Debug endpoint to check environment variable
app.get('/api/check-env', (req, res) => {
  const keySet = !!process.env.NVIDIA_API_KEY;
  const keyPrefix = keySet ? process.env.NVIDIA_API_KEY.substring(0, 10) : null;
  res.json({ keySet, keyPrefix, message: keySet ? 'API key is present' : 'API key is MISSING' });
});

// Main AI generation endpoint
app.post('/api/generate', async (req, res) => {
  console.log('Received request with body:', req.body);

  const { topic, style = 'friendly', communityName = 'general', model = 'nvidia/nemotron-3-super-120b-a12b' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    const userPrompt = `Write a short social media post about "${topic}" for the community "${communityName}". Use a ${style} tone. Keep it under 500 characters. Respond with only the post text.`;

    console.log('Calling NVIDIA API with prompt:', userPrompt);

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes social media posts.' },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const draft = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a draft.';
    console.log('Generated draft:', draft);
    res.json({ draft });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'AI generation failed', details: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});