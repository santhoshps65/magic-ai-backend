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

app.get('/api/check-env', (req, res) => {
  const keySet = !!process.env.NVIDIA_API_KEY;
  const keyPrefix = keySet ? process.env.NVIDIA_API_KEY.substring(0, 10) : null;
  res.json({ keySet, keyPrefix, message: keySet ? 'API key is present' : 'API key is MISSING' });
});

// Main AI generation endpoint (draft)
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
      max_tokens: 200,
      temperature: 0.7,
    });

    let draft = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a draft.';
    if (draft.length > 500) draft = draft.substring(0, 500) + '…';
    console.log('Generated draft (length:', draft.length, '):', draft);
    res.json({ draft });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    res.status(500).json({ error: 'AI generation failed', details: error.message });
  }
});

// New endpoint: generate hashtags and title
app.post('/api/generate-metadata', async (req, res) => {
  console.log('Metadata request body:', req.body);
  const { topic, style = 'social media', communityName = 'general' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    const prompt = `Generate a catchy title and 5 relevant hashtags for a social media post about: "${topic}" for the community "${communityName}". Use a ${style} tone. Return in JSON format: { "title": "...", "hashtags": ["#tag1", "#tag2", ...] }`;

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns only valid JSON. No extra text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    console.log('Raw metadata response:', responseText);
    const metadata = JSON.parse(responseText);
    res.json(metadata);
  } catch (error) {
    console.error('Metadata generation error:', error);
    res.status(500).json({ error: 'Failed to generate metadata', details: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});