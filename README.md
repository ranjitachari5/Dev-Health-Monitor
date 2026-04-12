# 🩺 Dev Health Monitor

A full-stack AI-powered developer environment health checker. Describe your tech stack, and let the app scan your machine for missing tools, outdated versions, and configuration issues — then get actionable AI-generated recommendations to fix them.

---

## ✨ Features

- 🤖 **AI-Powered Analysis** — Supports OpenAI (ChatGPT), Anthropic (Claude), Google Gemini, Groq (LLaMA), or any OpenAI-compatible endpoint
- 🔑 **Bring Your Own API Key** — Enter your key directly in the app UI, or use the server default
- 🖥 **Real Machine Scan** — Detects Python, Node.js, Docker, Git, databases, and 25+ more tools via subprocess
- 📊 **Health Score Dashboard** — Overall readiness score with per-tool status cards
- 🛠 **Auto-Fix Suggestions** — AI recommends exact install commands for your OS
- 📂 **Multiple Input Modes** — Chat, local folder scan, GitHub repo URL, or pre-built templates
- 🕓 **Scan History** — Persistent SQLite database of past scans

---

## 🗂 Project Structure

```
Dev Health Monitor/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # API routes
│   ├── core/
│   │   ├── ai_advisor.py     # Multi-provider AI integration
│   │   ├── scanner.py        # Real subprocess-based tool detection
│   │   ├── auto_fixer.py     # Fix suggestions
│   │   └── config_parser.py  # Config loader
│   ├── models.py             # SQLModel DB models
│   ├── database.py           # DB setup
│   ├── config.json           # AI provider defaults
│   └── .env                  # Your secret API key (not committed)
├── frontend/                 # React + Vite + TypeScript frontend
│   └── src/
│       ├── App.tsx
│       ├── api/client.ts     # Axios/fetch with AI header injection
│       ├── components/
│       │   ├── ApiKeyModal.tsx   # ⚙ AI provider configurator
│       │   ├── LandingPage.tsx
│       │   ├── ProjectInput.tsx
│       │   └── ScanDashboard.tsx
│       └── types/
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** — [python.org](https://python.org)
- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ranjitachari5/Dev-Health-Monitor.git
cd Dev-Health-Monitor
```

---

### 2. Backend Setup

```bash
cd backend
```

#### Install Python dependencies

```bash
pip install -r ../requirements.txt
```

#### Create your `.env` file

Create a file at `backend/.env` with your default server-side AI API key:

```env
AI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./dev_env_health.db
```

> **Note:** This key is used as a fallback when no key is entered in the UI.  
> Supported key formats are auto-detected:
> - `sk-…` → OpenAI (ChatGPT)
> - `sk-ant-…` → Anthropic (Claude)
> - `AIza…` → Google Gemini
> - `gsk_…` → Groq (LLaMA)

#### (Optional) Configure AI defaults in `config.json`

```json
{
  "ai": {
    "provider": "openai",
    "base_url": "https://api.openai.com/v1",
    "model": "gpt-4o-mini",
    "api_key_env_var": "AI_API_KEY"
  }
}
```

#### Start the backend server

```bash
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**  
Interactive API docs: **http://localhost:8000/docs**

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**  
(If port is in use, Vite will try 5174, 5175, etc.)

---

## 🔑 Configuring Your AI Key in the App

You don't need to touch `.env` at all if you prefer to use the in-app key manager:

1. Open the app at **http://localhost:5173**
2. Click the **⚙ AI Setup** button in the top-right corner of any screen
3. Select your provider (OpenAI, Anthropic, Gemini, Groq, or Custom)
4. Paste your API key — the provider and endpoint are auto-detected
5. Choose your preferred model from the dropdown
6. Click **Save Configuration**

Your key is stored **only in your browser's localStorage** — it never sent to our servers, only directly to the AI provider per-request via a secure header.

### Supported Providers

| Provider | Key Prefix | Example Model |
|---|---|---|
| OpenAI (ChatGPT) | `sk-…` | `gpt-4o`, `gpt-4o-mini` |
| Anthropic (Claude) | `sk-ant-…` | `claude-3-5-sonnet-20241022` |
| Google Gemini | `AIza…` | `gemini-1.5-flash`, `gemini-2.0-flash` |
| Groq (LLaMA) | `gsk_…` | `llama-3.3-70b-versatile` |
| Custom (OpenAI-compat) | any | your custom model |

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in each terminal to stop the backend and frontend.

---

## 🧪 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ping` | Health check |
| `GET` | `/api/health` | Full machine tool scan |
| `POST` | `/api/scan` | AI-powered stack scan |
| `POST` | `/api/analyze` | Analyze a project description |
| `POST` | `/api/analyze-github` | Analyze a GitHub repo URL |
| `GET` | `/api/history` | Scan history |
| `GET` | `/api/scan/{id}` | Get scan by ID |
| `POST` | `/api/fix/{tool}` | Trigger auto-fix |
| `GET` | `/api/install-command/{tool}` | Get install command for a tool |

All AI endpoints accept optional headers:
- `X-AI-Api-Key` — overrides the server default key
- `X-AI-Base-Url` — overrides the AI provider base URL
- `X-AI-Model` — overrides the model name

---

## 🔧 Troubleshooting

### `401 Unauthorized` from AI provider
- Your API key is invalid or expired.
- Click **⚙ AI Setup** and re-enter a valid key.

### `uvicorn` not found
```bash
python -m uvicorn main:app --reload --port 8000
```

### CORS errors in browser
- Make sure the backend is running on port `8000`.
- The frontend must run on one of: `5173`, `5174`, `3000`.

### Module not found (Python)
```bash
pip install -r requirements.txt
```

---

## 📄 License

MIT © Dev Health Monitor
