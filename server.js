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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(client), mode: client ? 'online' : 'offline-fallback' });
});

function localReply(messages) {
  const last = messages.at(-1)?.content?.trim() || '';
  const q = last.toLowerCase();
  if (/^(hi|hello|hey|hii)\b/.test(q)) return 'Hello! 👋 I’m AI Assistant. I’m ready to help you with coding, projects, UI/UX, studies, ideas, and more. What would you like to build?';
  if (q.includes('who are you') || q.includes('what are you')) return 'I’m your AI Assistant for this app. I can help explain concepts, plan projects, write code, debug problems, and brainstorm ideas.';
  if (q.includes('thank')) return 'You’re welcome! 😊 What shall we work on next?';
  if (q.includes('javascript')) return 'JavaScript is a programming language used to make web pages interactive. I can help you learn it step by step or build a project with it.';
  if (q.includes('html') || q.includes('css')) return 'HTML structures a webpage, while CSS controls its appearance and layout. Tell me what page you want to build and I can create the structure and styling.';
  if (q.includes('python')) return 'Python is a beginner-friendly programming language used for automation, web development, data science, and AI. I can help you write or debug Python code.';
  if (q.includes('project') || q.includes('app')) return 'Great! 🚀 Tell me the app idea, target users, and main features. I can turn it into a complete project plan, UI, frontend, backend, and deployment steps.';
  return `I received: “${last}”\n\nI’m currently running in offline fallback mode because no AI provider key is configured. The app is working without the configuration error. Add your provider key later to enable full cloud AI responses.`;
}

app.post('/api/chat', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const safeMessages = messages
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (!client) return res.json({ text: localReply(safeMessages), mode: 'offline-fallback' });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: 'You are AI Chat, a helpful, concise, friendly assistant. Use Markdown when useful. Never reveal secrets or API keys.',
      input: safeMessages,
      max_output_tokens: 1200
    });
    return res.json({ text: response.output_text || 'I could not generate a response.', mode: 'online' });
  } catch (error) {
    console.error('AI provider error:', error?.message || error);
    return res.json({ text: localReply(safeMessages), mode: 'offline-fallback' });
  }
});

app.listen(port, () => console.log(`AI Chat running on port ${port}`));
