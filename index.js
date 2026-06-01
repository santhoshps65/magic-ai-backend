// New endpoint for generating hashtags & titles
app.post('/api/generate-metadata', async (req, res) => {
  const { topic, style = 'social media', communityName = 'general' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  try {
    const prompt = `Generate a catchy title and 5 relevant hashtags for a social media post about: "${topic}" for the community "${communityName}". Use a ${style} tone. Return in JSON format: { "title": "...", "hashtags": ["#tag1", "#tag2", ...] }`;

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct', // or your preferred model
      messages: [
        { role: 'system', content: 'You are a helpful assistant that returns only valid JSON. No extra text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    const metadata = JSON.parse(responseText);
    res.json(metadata);
  } catch (error) {
    console.error('Metadata generation error:', error);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});