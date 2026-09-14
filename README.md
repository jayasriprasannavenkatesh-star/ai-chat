# ✦ AI Chat

A premium, responsive AI chat application with a modern productivity-app interface and a server-side AI integration.

## Features

- Real AI chat through `/api/chat`
- Conversation context sent securely from the browser to the server
- API key stays server-side
- Responsive desktop and mobile UI
- Conversation history with localStorage persistence
- New chat and clear history controls
- Dark/light theme
- Quick prompt suggestions
- Loading state and friendly error handling

## Run locally

1. Install Node.js 18+.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from `.env.example` and set your server-side `OPENAI_API_KEY`.
4. Start the app:

```bash
npm start
```

5. Open `http://localhost:3000`.

Never commit `.env` or expose an API key in `index.html` or `app.js`.

## Deployment

Deploy this as a Node/Express web service. GitHub Pages can host the static frontend, but it cannot run the Node backend, so use a server-capable host for the complete AI app and configure `OPENAI_API_KEY` as a secret environment variable.

## Stack

HTML · CSS · JavaScript · Node.js · Express · OpenAI SDK · LocalStorage
