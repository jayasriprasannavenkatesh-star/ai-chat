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
  if (/^(hi|hello|hey|hii)\b/.test(q)) return 'Hello! 👋 I’m AI Assistant. Ask me anything and I’ll help with an answer or solution.';
  if (q.includes('meaning') && q.includes('devil')) return 'Devil means an evil or harmful supernatural being in many religious and cultural traditions. In everyday language, “devil” can also describe a person or thing considered very troublesome or wicked.';
  if (q.includes('who are you') || q.includes('what are you')) return 'I’m AI Assistant. I can help with questions, explanations, coding, projects, studies, writing, planning, and problem solving.';
  if (q.includes('thank')) return 'You’re welcome! 😊 What would you like to ask next?';
  if (q.includes('javascript')) return 'JavaScript is a programming language mainly used to add behavior and interactivity to websites. I can explain it, write code, or debug your program.';
  if (q.includes('html') || q.includes('css')) return 'HTML defines webpage structure and CSS controls its presentation. If you tell me what you want to build, I can provide the complete code.';
  if (q.includes('python')) return 'Python is a general-purpose programming language widely used for automation, web development, data work, and AI. Tell me your problem and I can help solve it.';
  if (q.includes('project') || q.includes('app')) return 'Absolutely. Give me your app idea and requirements. I can break it into features, UI/UX, frontend, backend, database, testing, and deployment.';
  return `I understand your question: “${last}”. I can answer it when the cloud AI provider is connected. The app is online and has a safe fallback, but a local fallback cannot provide a reliable answer to every possible question.`;
}

app.post('/api/chat', async (req, res) => {
  const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
  const safeMessages = messages
    .filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (!client) return res.json({ text: localReply(safeMessages), mode: 'offline-fallback' });

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: 'You are AI Chat, a highly capable helpful assistant. Answer the user’s actual question directly. Give accurate, clear, useful answers and practical solutions. If the question is ambiguous, explain the likely meaning and ask only the minimum necessary clarification. For coding questions, provide working code and explain key fixes. Do not claim certainty when information is uncertain. Never reveal API keys or secrets.',
      input: safeMessages,
      max_output_tokens: 1200
    });
    res.json({ text: response.output_text || 'I could not generate a response.', mode: 'online' });
  } catch (error) {
    console.error('AI request failed:', error?.message || error);
    res.json({ text: localReply(safeMessages), mode: 'offline-fallback' });
  }
});

app.listen(port, () => console.log(`AI Chat running on port ${port}`));
