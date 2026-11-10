# JARVIS AI Backend

A small Node.js API for the JARVIS Android assistant. It supports Tamil, English, and Tanglish through the OpenAI Responses API.

## Endpoints

- `GET /health` — service health check
- `POST /chat` — send a message and receive a JARVIS reply

Example request:

```json
{
  "message": "Vanakkam JARVIS",
  "approvedMemory": "",
  "history": []
}
```

Example response:

```json
{
  "reply": "Vanakkam! How can I help?"
}
```

## Run locally

Requires Node.js 20 or newer.

1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Put your API key in `.env` as `OPENAI_API_KEY`.
4. Run `npm start`.
5. Open `http://localhost:3000/health`.

Never commit `.env`, paste an API key into source code, or share it in screenshots.

## Deploy on Render

Create a **Web Service** from this GitHub repository and set:

- Root Directory: `jarvis-ai-backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`

Add these environment variables in Render's dashboard:

- `OPENAI_API_KEY` — your secret OpenAI API key
- `OPENAI_MODEL` — optional; defaults to `gpt-4.1-mini`

After deployment, test `https://YOUR-SERVICE.onrender.com/health`.

## Important

The OpenAI API is billed separately from a ChatGPT subscription. Set a small budget/usage alert in the API account before using it. This backend does not yet provide wake-word detection, Android device control, or permanent cloud memory; those require separate Android-side features and explicit permissions.
