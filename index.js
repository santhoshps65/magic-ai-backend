const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

app.get('/', (req, res) => {
  res.send('Magic Mirror AI backend is running');
});

app.get('/api/check-env', (req, res) => {
  const keySet = !!process.env.NVIDIA_API_KEY;
  const keyPrefix = keySet ? process.env.NVIDIA_API_KEY.substring(0, 10) : null;
  res.json({ keySet, keyPrefix, message: keySet ? 'API key is present' : 'API key is MISSING' });
});

app.post('/api/generate', async (req, res) => {
  console.log('Received request with body:', req.body);

  const { topic, style = 'friendly', communityName = 'general', model = 'nvidia/nemotron-3-super-120b-a12b' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    // Stronger prompt – very explicit about length
    const userPrompt = `Write a VERY SHORT social media post about "${topic}" for the community "${communityName}". Use a ${style} tone. MAXIMUM 500 CHARACTERS. Keep it brief, engaging, and to the point. Respond with ONLY the post text – no explanations, no extra words.`;

    console.log('Calling NVIDIA API with prompt:', userPrompt);

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes very short social media posts. Always keep responses under 500 characters. Be concise.' },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,        // reduced from 500 – forces shorter output
      temperature: 0.7,
    });

    let draft = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a draft.';
    
    // Enforce hard limit: truncate to 500 characters
    if (draft.length > 500) {
      draft = draft.substring(0, 500) + '…';
      console.log('Truncated draft to 500 chars');
    }

    console.log('Generated draft (length:', draft.length, '):', draft);
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