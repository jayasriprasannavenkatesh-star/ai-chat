import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(client) }));

app.post('/api/chat', async (req, res) => {
  try {
    if (!client) return res.status(503).json({ error: 'AI is not configured. Add OPENAI_API_KEY to the server environment.' });
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const safeMessages = messages
      .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: 'You are AI Chat, a helpful, concise, friendly assistant. Use Markdown when useful. Never reveal secrets or API keys.',
      input: safeMessages,
      max_output_tokens: 1200
    });
    res.json({ text: response.output_text || 'I could not generate a response.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'The AI service could not complete the request.' });
  }
});

app.listen(port, () => console.log(`AI Chat running on port ${port}`));
