# 🩺 Dev-Health-Monitor

> **"Is your laptop ready to code?"** > A high-performance, AI-augmented diagnostic suite that ensures your local development environment is perfectly synchronized with your project requirements.

## 🚀 The Mission
Setting up a dev environment is manual, error-prone, and slow. **Dev-Health-Monitor** automates this by scanning your OS, analyzing your project needs via AI and GitHub integration, and providing automated, cross-platform remediation scripts.

## 🧠 Advanced Features
* **🤖 AI Advisor:** Uses the `ai_advisor.py` core to interpret project requirements and suggest the optimal stack configuration.
* **🐙 GitHub Analyzer:** Integrates `github_analyzer.py` to check for repository-specific dependencies and environment standards.
* **🌍 Multi-Platform Fixes:** A robust `scripts/` library featuring both PowerShell (`.ps1`) and Shell (`.sh`) scripts for true Windows, macOS, and Linux compatibility.
* **📊 Comprehensive Reporting:** Generates full system health reports and persists scan history in a local SQLite database (`dev_env_health.db`).
* **💻 Terminal Emulation:** Real-time typewriter-style terminal output in the UI to monitor fix progress.

## 📂 Project Structure Highlights

### Backend (FastAPI + Python)
* `core/scanner.py`: The interrogation engine—runs subprocesses to verify tool versions.
* `core/ai_advisor.py`: The logic layer for intelligent environment recommendations.
* `core/auto_fixer.py`: The bridge between the UI and the native OS repair scripts.
* `main.py`: Entry point for the FastAPI server and Pydantic-validated API endpoints.

### Frontend (React + TypeScript + Vite)
* `src/components/ScoreRing.tsx`: High-impact visual representation of environment health.
* `src/components/AIInsights.tsx`: Dedicated UI for AI-generated configuration advice.
* `src/components/TerminalOutput.tsx`: Real-time feedback for backend execution.
* `src/types/index.ts`: Strict TypeScript interfaces for zero-runtime-error data flow.

## 🛠️ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | macOS/Linux: source .venv/bin/activate
pip install -r ../requirements.txt
cp .env.example .env  # Configure your AI keys here
python main.py
Dev-Health-Monitor/
├── .gitattributes
├── .gitignore
├── .python-version
├── backend/
│   ├── __pycache__/
│   │   ├── database.cpython-314.pyc
│   │   ├── main.cpython-314.pyc
│   │   └── models.cpython-314.pyc
│   ├── .env.example
│   ├── config.json
│   ├── core/
│   │   ├── __init__.py
│   │   ├── __pycache__/
│   │   │   ├── __init__.cpython-313.pyc
│   │   │   ├── __init__.cpython-314.pyc
│   │   │   ├── ai_advisor.cpython-314.pyc
│   │   │   ├── auto_fixer.cpython-313.pyc
│   │   │   ├── auto_fixer.cpython-314.pyc
│   │   │   ├── config_parser.cpython-313.pyc
│   │   │   ├── config_parser.cpython-314.pyc
│   │   │   ├── project_builder.cpython-313.pyc
│   │   │   ├── scanner.cpython-313.pyc
│   │   │   └── scanner.cpython-314.pyc
│   │   ├── ai_advisor.py
│   │   ├── auto_fixer.py
│   │   ├── config_parser.py
│   │   ├── github_analyzer.py
│   │   └── scanner.py
│   ├── database.py
│   ├── dev_env_health.db
│   ├── main.py
│   ├── models.py
│   └── scripts/
│       ├── fix_path_vars.ps1
│       ├── fix_path_vars.sh
│       ├── install_deps.ps1
│       └── install_deps.sh
├── dev_env_health.db
├── error.txt
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── node_modules/
│   │   ├── @types/
│   │   │   ├── node/
│   │   │   │   ├── README.md
│   │   │   │   └── repl.d.ts
│   │   │   └── react/
│   │   │       └── README.md
│   │   ├── any-promise/
│   │   │   └── README.md
│   │   ├── autoprefixer/
│   │   │   └── README.md
│   │   ├── axios/
│   │   │   └── CHANGELOG.md
│   │   ├── caniuse-lite/
│   │   │   └── data/
│   │   │       └── agents.js
│   │   ├── function-bind/
│   │   │   └── CHANGELOG.md
│   │   ├── lucide-react/
│   │   │   └── dist/
│   │   │       └── esm/
│   │   │           ├── icons/
│   │   │           │   ├── circle-off.js
│   │   │           │   ├── cookie.js
│   │   │           │   ├── expand.js
│   │   │           │   ├── film.js
│   │   │           │   ├── gallery-thumbnails.js
│   │   │           │   ├── haze.js
│   │   │           │   ├── line-chart.js
│   │   │           │   ├── message-square-dashed.js
│   │   │           │   ├── monitor-dot.js
│   │   │           │   ├── notepad-text.js
│   │   │           │   ├── percent-circle.js
│   │   │           │   ├── printer.js
│   │   │           │   ├── sailboat.js
│   │   │           │   ├── settings-2.js
│   │   │           │   ├── sofa.js
│   │   │           │   ├── subtitles.js
│   │   │           │   ├── traffic-cone.js
│   │   │           │   └── user-search.js
│   │   │           └── lucide-react.js
│   │   ├── postcss-selector-parser/
│   │   │   └── API.md
│   │   ├── resolve/
│   │   │   ├── async.js
│   │   │   └── index.js
│   │   ├── source-map-js/
│   │   │   └── README.md
│   │   ├── tailwindcss/
│   │   │   ├── base.css
│   │   │   └── colors.d.ts
│   │   ├── tinyglobby/
│   │   │   └── README.md
│   │   └── typescript/
│   │       └── README.md
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── AIInsights.tsx
│   │   │   ├── DownloadModal.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── ProjectInput.tsx
│   │   │   ├── ScanDashboard.tsx
│   │   │   ├── ScanHistory.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   ├── Squares.tsx
│   │   │   ├── StackChips.tsx
│   │   │   ├── SystemHealthReport.tsx
│   │   │   ├── TerminalOutput.tsx
│   │   │   └── ToolCard.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── reportGenerator.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vercel.json
│   └── vite.config.ts
├── FRONTEND_COMPLETE.md
├── FRONTEND_DOCS_INDEX.md
├── FRONTEND_FILE_INVENTORY.md
├── FRONTEND_SETUP_COMPLETE.md
├── package-lock.json
├── push_error.txt
├── QUICK_START.md
├── render.yaml
└── requirements.txt
