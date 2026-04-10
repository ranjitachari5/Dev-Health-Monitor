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

## � Prerequisites

- **Python 3.8+** (any version, no specific version required)
- **Node.js 16+** and **npm**
- **Git** (for cloning and version control)

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd dev-health-monitor
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r ../requirements.txt

# Copy environment configuration
cp .env.example .env

# Edit .env file to add your GROQ API key (get from https://groq.com)
# GROQ_API_KEY=your_api_key_here

# Start the backend server
python main.py
```
The backend will start on `http://localhost:8000`

### 3. Frontend Setup (in a new terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```
The frontend will start on `http://localhost:5173`

### 4. Access the Application
Open your browser and go to: **http://localhost:5173**

## 📂 Project Structure

```
dev-health-monitor/
├── backend/                          # FastAPI Backend
│   ├── core/                         # Core business logic
│   │   ├── ai_advisor.py            # AI-powered environment analysis
│   │   ├── auto_fixer.py            # Platform-specific fix execution
│   │   ├── config_parser.py         # Configuration management
│   │   ├── github_analyzer.py       # GitHub repository analysis
│   │   └── scanner.py               # System tool scanning engine
│   ├── scripts/                     # Cross-platform fix scripts
│   │   ├── fix_path_vars.ps1        # Windows path fixes
│   │   ├── fix_path_vars.sh         # Unix path fixes
│   │   ├── install_deps.ps1         # Windows dependency installation
│   │   └── install_deps.sh          # Unix dependency installation
│   ├── .env.example                 # Environment variables template
│   ├── config.json                  # Application configuration
│   ├── database.py                  # Database connection & setup
│   ├── main.py                      # FastAPI application entry point
│   └── models.py                    # SQLModel database models
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/                     # API client functions
│   │   │   └── client.ts            # Axios-based API client
│   │   ├── components/              # React components
│   │   │   ├── AIInsights.tsx       # AI recommendations display
│   │   │   ├── DownloadModal.tsx    # Report download interface
│   │   │   ├── LandingPage.tsx      # Welcome & quick scan page
│   │   │   ├── ProjectInput.tsx     # Project description input
│   │   │   ├── ScanDashboard.tsx    # Main results dashboard
│   │   │   ├── ScanHistory.tsx      # Scan history viewer
│   │   │   ├── ScanProgress.tsx     # Progress indicators
│   │   │   ├── ScoreRing.tsx        # Circular health score display
│   │   │   ├── Squares.tsx          # Animated background component
│   │   │   ├── StackChips.tsx       # Technology stack display
│   │   │   ├── SystemHealthReport.tsx # Health report component
│   │   │   ├── TerminalOutput.tsx   # Terminal emulation
│   │   │   ├── ToolCard.tsx         # Individual tool status cards
│   │   │   └── ToolCard.tsx         # Individual tool status cards
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── index.ts             # All type interfaces
│   │   ├── utils/                   # Utility functions
│   │   │   └── reportGenerator.ts   # Report generation utilities
│   │   ├── App.tsx                  # Main React application
│   │   ├── index.css                # Global styles & Tailwind CSS
│   │   └── main.tsx                 # React application entry point
│   ├── .env.example                 # Frontend environment template
│   ├── index.html                   # HTML template
│   ├── package.json                 # Node.js dependencies & scripts
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.node.json           # Node.js TypeScript config
│   ├── vite.config.ts               # Vite build configuration
│   └── vercel.json                  # Vercel deployment config
│
├── requirements.txt                 # Python dependencies
├── QUICK_START.md                   # Quick start guide
├── FRONTEND_COMPLETE.md             # Frontend completion notes
├── FRONTEND_DOCS_INDEX.md           # Frontend documentation index
├── FRONTEND_FILE_INVENTORY.md       # Frontend file inventory
├── FRONTEND_SETUP_COMPLETE.md       # Frontend setup completion
└── README.md                        # This file
```

## 🔧 Development Commands

### Backend
```bash
cd backend
python main.py                    # Start development server
python -m pytest                  # Run tests (if available)
```

### Frontend
```bash
cd frontend
npm run dev                      # Start development server
npm run build                    # Build for production
npm run preview                  # Preview production build
```

## 🌐 API Endpoints

The backend provides the following REST API endpoints:

- `GET /` - API information and available endpoints
- `GET /api/ping` - Health check
- `POST /api/scan` - Perform environment scan
- `POST /api/analyze-github` - Analyze GitHub repository
- `GET /api/history` - Get scan history
- `GET /api/scan/{id}` - Get specific scan results

## 🔑 Configuration

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./dev_env_health.db
```

### Frontend (.env)
```env
# Optional: Override backend URL for production
VITE_API_URL=http://localhost:8000
```

## 🏗️ Architecture

### Backend Architecture
- **FastAPI**: Modern Python web framework
- **SQLModel**: SQLAlchemy + Pydantic for database models
- **SQLite**: Local database for scan history
- **GROQ AI**: AI-powered environment analysis

### Frontend Architecture
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source. See LICENSE file for details.

## 🆘 Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify GROQ API key is set in `.env`

### Frontend Issues
- Ensure Node.js 16+ is installed
- Clear node_modules: `rm -rf node_modules && npm install`
- Check that backend is running on port 8000

### Port Conflicts
- Backend runs on port 8000 by default
- Frontend runs on port 5173 by default
- Change ports in respective configuration files if needed
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
