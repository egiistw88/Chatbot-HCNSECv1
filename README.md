# Egie AI Agentic Workspace (PWA)

An advanced, self-hosted, OpenAI-compatible Progressive Web App chat platform designed with a robust **Agentic Intelligence Layer** for specialized research, long-term learning, and deep reasoning.

## 🤖 Agentic Architecture (Phase 2)
This application moves beyond simple "Prompt-Response" cycles. It implements a structured **Intelligence Layer** that mimics human reasoning:

### 1. The Pipeline
1.  **🧠 Planner**: Deconstructs user input into a strategic execution plan. Categorizes tasks into `Direct Answer` or `Deep Research`.
2.  **⚙️ Executor**: Orchestrates the execution. It pulls from **Long-Term Memory** (user preferences) and the **RAG Knowledge Base** (classical texts/kitabs).
3.  **🔍 Evaluator**: Acts as the quality gate. It verifies citations, checks for hallucinations, and ensures the tone aligns with the **Murabbi** persona.

### 2. Knowledge & Memory
- **Long-Term Memory**: A persistent SQLite-backed storage for user facts, preferences, and project context. Categorized into `preference`, `fact`, `project_context`, and `instruction`.
- **RAG Library (Kitab & Turats)**: A specialized knowledge management system for uploading and indexing classical manuscripts with metadata versioning and source tracking.

## 🛡️ Stability & Reliability (Phase 1)
- **Daily Automatic Backups**: SQLite database rotation every 24 hours to `data/daily_backup_[0-6].sqlite`.
- **User Data Portability**: Admin endpoints for full database export and manual backups.
- **Metadata Grounding**: Advanced classification for Memory (`confidence`, `source`) and RAG Documents (`version`, `source_type`).

## ✨ Key Features
- **Minimalist Monochrome UI**: 3-color palette designed for maximum focus and readability.
- **Real-Time Execution Trace**: Visual transparency into the Agent's reasoning process with per-step progress logs.
- **Voice Intelligence**: AI Speech In (Whisper) and Speech Out (TTS) with Indonesian optimization.
- **Encrypted Local Storage**: SQLite local database row-level encryption using AES-256-CBC.
- **PWA Ready**: Fully responsive mobile experience with standalone app capabilities.

## 📱 PWA & Mobile Optimization
The Egie AI Workspace is fully optimized for mobile devices:
- **Installable**: Click "Add to Home Screen" in your browser to use it as a standalone app.
- **Standalone Mode**: Runs without browser UI for an immersive, native-like experience.
- **Touch-First Design**: Large hit targets, gesture-friendly navigation, and responsive typography.
- **Offline Capabilities**: Basic shell caching for faster load times.

## 🚀 Deployment & Installation

### Standard Installation
1.  **Browser**: Open the application URL in Chrome (Android) or Safari (iOS).
2.  **Menu**: Tap the browser menu (three dots or share icon).
3.  **Install**: Select "Install App" or "Add to Home Screen".
4.  **Launch**: Open the **Egie AI** icon from your home screen.

### Server Setup (Cloud Run / Vercel)
1.  Clone or export the project.
2.  Set `GEMINI_API_KEY` in your environment variables.
3.  `npm install && npm run build`
4.  `npm start`

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Better-SQLite3, PDF Parse, Crypto.
- **AI Engine**: Gemini API & OpenAI-compatible endpoints.

## 📄 License & Credits
Designed and built by **Egie AI Agentic Team**. Focus on minimalist UI/UX and monochrome aesthetic.
