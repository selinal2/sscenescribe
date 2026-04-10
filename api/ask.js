import Groq from '@groq/sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama3-8b-8192', // or your preferred Groq model
      messages: [{ role: 'user', content: question }],
    });
    res.status(200).json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI request failed' });
  }
}
