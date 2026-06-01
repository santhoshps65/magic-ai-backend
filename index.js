const express = require('express');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

app.post('/api/generate', async (req, res) => {
  const { topic, style = 'friendly', communityName = 'general', model = 'meta/llama-3.3-70b-instruct' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    const userPrompt = `Write a short social media post about "${topic}" for the community "${communityName}". Use a ${style} tone. Keep it under 500 characters. Respond with only the post text.`;

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
    res.json({ draft });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

app.get('/', (req, res) => {
  res.send('Magic Mirror AI backend is running');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});