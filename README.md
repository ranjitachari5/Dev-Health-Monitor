# 🩺 Dev Health Monitor

A full-stack web application that scans your local development environment, detects installed tools, identifies missing dependencies, and delivers AI-powered health insights — all in one report.

---

## 📌 Overview

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | FastAPI + Uvicorn (Python)          |
| Frontend  | React + Vite + TypeScript           |
| AI Engine | Multi-provider (user supplies key)  |
| Database  | SQLite via SQLModel                 |

---

## ✅ Prerequisites

Install these before running the app:

| Tool       | Minimum Version | Download                          |
|------------|-----------------|-----------------------------------|
| Python     | 3.10+           | https://www.python.org/downloads/ |
| Node.js    | 18+             | https://nodejs.org/               |
| npm        | 9+              | Bundled with Node.js              |
| Git        | any             | https://git-scm.com/              |

### One-liner install check (PowerShell)

```powershell
python --version; node --version; npm --version
```

---

## 🚀 Quick Start — Single Command

```powershell
git clone https://github.com/ranjitachari5/Dev-Health-Monitor.git
cd "Dev-Health-Monitor"
.\start.ps1
```

That's it. The script will:

1. ✅ Verify Python, Node.js, and npm are installed
2. 🐍 Create a Python virtual environment (`backend/venv/`)
3. 📦 Install all Python dependencies from `requirements.txt`
4. 📦 Install all npm packages inside `frontend/node_modules/`
5. 🚀 Launch the **backend** at `http://localhost:8000`
6. 🚀 Launch the **frontend** at `http://localhost:5173` *(opens in browser)*

Press **Ctrl+C** to stop both services cleanly.

---

## 🔑 API Key Setup (Required for AI Features)

The app **does not have a default API key**. AI-powered analysis requires you to enter your own key inside the app.

### Step 1 — Get a free API key

| Provider   | Key prefix  | Get a key                              |
|------------|-------------|----------------------------------------|
| OpenRouter | `sk-or-`    | https://openrouter.ai/ (free tier)     |
| OpenAI     | `sk-`       | https://platform.openai.com/           |
| Anthropic  | `sk-ant-`   | https://console.anthropic.com/         |
| Google Gemini | `AIza…` | https://aistudio.google.com/           |
| Groq       | `gsk_`      | https://console.groq.com/ (free)       |

> **Recommended for free usage**: [OpenRouter](https://openrouter.ai/) or [Groq](https://console.groq.com/) — both offer generous free tiers.

### Step 2 — Enter key in the app

1. Open `http://localhost:5173`
2. Click **"Set API Key"** in the top nav
3. Paste your key into the input field
4. The provider is auto-detected from the key prefix (e.g. `sk-or-` → OpenRouter)
5. Click **Save Key**

Your key is stored in **browser localStorage only** — it is never sent to any server except the AI provider you chose.

---

## 📁 Project Structure

```
Dev-Health-Monitor/
├── start.ps1                    # ← Single command to start everything
├── requirements.txt             # Python dependencies
├── backend/
│   ├── main.py                  # FastAPI routes & app entry point
│   ├── models.py                # SQLModel database models
│   ├── database.py              # Database setup & session management
│   ├── config.json              # AI provider defaults
│   ├── .env                     # Local secrets (not committed)
│   ├── .env.example             # Template — copy to .env
│   └── core/
│       ├── ai_advisor.py        # Multi-provider AI integration
│       ├── scanner.py           # Tool detection via subprocesses
│       ├── auto_fixer.py        # Fix command suggestions
│       ├── github_analyzer.py   # GitHub repo stack detection
│       └── config_parser.py     # Config file loader
└── frontend/
    ├── index.html
    ├── vite.config.ts           # Vite dev server + proxy to backend
    └── src/
        ├── App.tsx              # Root app component
        ├── api/client.ts        # API client (injects AI key headers)
        ├── components/
        │   ├── LandingPage.tsx  # Landing view
        │   ├── ProjectInput.tsx # Project description & scan entry
        │   ├── ScanDashboard.tsx# Scan results dashboard
        │   ├── ApiKeyModal.tsx  # API key configuration
        │   ├── ScanHistory.tsx  # Scan history viewer
        │   ├── ToolCard.tsx     # Individual tool result card
        │   ├── AIInsights.tsx   # AI-generated analysis and recommendations
        │   ├── StackChips.tsx   # Visual indicator for detected stack
        │   └── Squares.tsx      # Landing page background effect
        └── types/index.ts       # TypeScript type definitions
```

---

## 🛠 Manual Setup (Advanced / Non-Windows)

If you prefer to set up manually or are on Linux/macOS:

### Backend

```bash
cd backend

# Create and activate venv
python -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate       # Windows PowerShell

# Install dependencies
pip install -r ../requirements.txt

# Start server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
# In a second terminal
cd frontend
npm install
npm run dev
```

---

## 🌐 API Endpoints Reference

| Method | Endpoint                        | Description                          |
|--------|---------------------------------|--------------------------------------|
| GET    | `/`                             | Service info & endpoint list         |
| GET    | `/api/ping`                     | Health check                         |
| GET    | `/api/health`                   | Full machine tool scan               |
| GET    | `/api/ai-status`                | Validate your AI key                 |
| POST   | `/api/scan`                     | AI-powered project scan              |
| POST   | `/api/analyze`                  | Analyze + scan current machine       |
| POST   | `/api/analyze-github`           | Detect stack from a GitHub repo URL  |
| GET    | `/api/history`                  | Your scan history                    |
| GET    | `/api/scan/{id}`                | Retrieve a specific scan             |
| POST   | `/api/fix/{tool_name}`          | Run a fix command for a tool         |
| GET    | `/api/install-command/{tool}`   | Get AI-generated install command     |
| GET    | `/docs`                         | Interactive Swagger UI               |

> AI endpoints accept `X-AI-Api-Key`, `X-AI-Base-Url`, and `X-AI-Model` headers — sent automatically by the frontend when you set your key in the app.

---

## ⚠️ Troubleshooting

### Port already in use

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### PowerShell execution policy error

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### npm install fails

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### AI features show "No key provided"

Click **"Set API Key"** in the top navigation bar and paste your API key.

### Backend won't start — module not found

```powershell
# Re-run the installer part manually:
cd backend
venv\Scripts\python.exe -m pip install -r ..\requirements.txt
```

---

## ⚡ Important Notes

- **Scanning is local** — the backend scans the machine where it's running, not the visitor's browser.
- **AI key privacy** — your key is stored only in your browser's localStorage and sent directly to the AI provider via the backend proxy. It is not logged or persisted.
- **No login required** — the app works without any authentication.

---

## 📦 Tech Stack

| Component   | Technology                     |
|-------------|--------------------------------|
| Frontend    | React 18, Vite, TypeScript     |
| Backend     | FastAPI, Python 3.10+          |
| AI Layer    | OpenAI-compatible (any provider)|
| Database    | SQLite + SQLModel              |
| Dev Server  | Uvicorn                        |

---

## 👨‍💻 Author

Developed by **Ranjit**

## ⭐ Contributing

Fork, improve, and submit pull requests — contributions welcome.

## 📄 License

MIT License