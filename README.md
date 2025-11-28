# Euno

Euno is an AI-powered talking companion designed to provide real-time emotional support through natural voice and text conversations. It adapts to user-selected moods, remembers past interactions, and responds with human-like empathy to help people feel heard, understood, and supported.

---

## ✨ What is Euno?

Euno is not just another chatbot. It is a real-time emotional companion that listens, understands, and responds like a friend. Built for people who feel lonely, overwhelmed, or simply need someone to talk to, Euno creates a safe, judgment-free space for conversations.

It is built to feel natural, responsive, and emotionally aligned with the user’s needs.

---

## 🎯 Why Euno Exists

Most AI chatbots today are designed to provide information, not emotional connection. They lack:
- Emotional intelligence
- Memory of user context
- Natural voice expression
- Real-time conversational flow

Euno bridges this gap by focusing on **emotional continuity and human-like interaction**, making technology feel more present and personal.

---

## 🧠 Core Features

### Real-Time Conversations
- Powered by WebSockets for fast, continuous interaction
- No message delays or robotic pauses

### Mood-Based Responses
- Users can select moods like:
  - Calm
  - Happy
  - Sad
  - Excited
  - Anxious
  - Angry
- The agent adapts both text tone and speech style based on the selected emotion

### Voice-First Experience
- Text-to-Speech powered responses
- Uses SSML to control pitch, speed, and voice expression
- Designed to sound natural and human

### Memory & Context Awareness
- Summarization layer tracks recent conversations
- Allows Euno to remember emotional context and conversation flow
- Creates continuity across sessions

---

## 🏗️ Tech Stack

### Frontend
- Next.js
- TypeScript
- TailwindCSS
- Zustand

### Backend
- Python
- FastAPI
- WebSockets

### AI Layer
- Gemini-based LLMs
- Custom system prompts
- Mood-driven response engine

### Voice
- SSML-based Text-to-Speech pipeline

---

## 📂 Project Structure

```text
euno/
  frontend/
    app/
    components/
    lib/
  backend/
    main.py
    services/
    prompts/
  shared/
    types/
```

---

## 🚀 Local Setup

Frontend
```bash
cd frontend
npm install
npm run dev
```

Backend
```bash
cd backend
uv sync
uvicorn main:app --reload
```

---

## 🔒 Ethics & Safety

Euno is not a replacement for therapy or medical help.
It is designed as a supportive companion, not a diagnostic or clinical tool.

The product is built with:

- User privacy in mind
- Minimal data storage
- Safe, non-judgmental conversation design

---

## 🌱 Vision

Euno’s vision is simple:
No one should feel unheard.

We are building the future of emotionally intelligent technology — where AI feels less artificial and more human.

---

## 🤝 Contributing

This project is currently in active development.
If you’d like to collaborate, contribute, or give feedback, feel free to open issues or reach out.

📬 Contact

Website: https://euno.live
Email: kunalgarg054@gmail.com, tanishsingla51@gmail.com
