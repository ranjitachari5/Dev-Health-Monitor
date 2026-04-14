# 🩺 Dev Health Monitor

A full-stack web application that analyzes your local development environment — detecting installed tools, missing dependencies, and overall dev readiness — with AI-powered insights and fix suggestions.

---

## 📌 Overview

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) + Uvicorn |
| Frontend | React + Vite + TypeScript |
| AI | Multi-provider (configurable via `.env`) |
| Database | SQLModel |

---

## 📁 Project Structure

```
Dev-Health-Monitor/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # API routes & app entry point
│   ├── models.py                   # SQLModel database models
│   ├── database.py                 # Database setup & connection
│   ├── config.json                 # AI provider defaults
│   ├── .env                        # Secret API keys (not committed)
│   └── core/
│       ├── ai_advisor.py           # Multi-provider AI integration
│       ├── scanner.py              # Subprocess-based tool detection
│       ├── auto_fixer.py           # Fix suggestions engine
│       └── config_parser.py        # Config file loader
│
├── frontend/                       # React + Vite + TypeScript frontend
│   └── src/
│       ├── App.tsx                 # Root app component
│       ├── api/
│       │   └── client.ts           # Axios/fetch with AI header injection
│       ├── components/
│       │   ├── ApiKeyModal.tsx     # AI provider configurator
│       │   ├── LandingPage.tsx     # Landing/home screen
│       │   ├── ProjectInput.tsx    # Project path input form
│       │   └── ScanDashboard.tsx   # Scan results & insights UI
│       └── types/                  # TypeScript type definitions
│
├── requirements.txt                # Python dependencies
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ranjitachari5/Dev-Health-Monitor.git
cd Dev-Health-Monitor
```

---

## ⚙️ Backend Setup (FastAPI)

### 2. Navigate to the backend directory

```bash
cd backend
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

### 4. Activate the virtual environment

**Windows (PowerShell)**
```bash
venv\Scripts\activate
```

**Windows (CMD)**
```bash
venv\Scripts\activate.bat
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Run the backend server

> ⚠️ Avoid ports `8000` or `5173` if they are already in use.

```bash
uvicorn main:app --reload --port 8001
```

Backend will be available at: `http://127.0.0.1:8001`

---

## 💻 Frontend Setup (React + Vite)

### 7. Open a new terminal and navigate to frontend

```bash
cd Dev-Health-Monitor/frontend
```

### 8. Install dependencies

```bash
npm install
```

### 9. Run the frontend

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5176`

> Note: Port may change automatically if already in use.

---

## 🔗 Connecting Frontend to Backend

Ensure your frontend API calls point to the backend URL. Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://127.0.0.1:8001
```

The `frontend/src/api/client.ts` file reads this variable and injects it into all requests.

---

## ▶️ Quick Start (Both Terminals)

**Terminal 1 — Backend**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5176 |
| Backend | http://127.0.0.1:8001 |

---

## ⚠️ Common Errors & Fixes

### ❌ WinError 10013 — Port access blocked

Cause: Port blocked by firewall, or already in use.

```bash
uvicorn main:app --reload --port 8001
```

### ❌ Port already in use

Find and kill the conflicting process:

```bash
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### ❌ Node modules issues

```bash
rm -rf node_modules
npm install
```

---

## ⚡ Important — Scanner Limitation

The scanning feature works **only on the local machine where the backend is running**.

**Why?** Browsers restrict access to installed software, system files, and local environment details. The scanner uses Python subprocesses on the server side, so it reads *that machine's* environment — not the visitor's browser.

**For production / real user scanning**, you would need one of:
- A desktop app (Electron or packaged Python)
- A local agent installed on the user's machine

---

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React, Vite, TypeScript |
| Backend | FastAPI, Python |
| AI Layer | Multi-provider (OpenAI / Anthropic / etc.) |
| Database | SQLModel |
| Server | Uvicorn |
| HTTP Client | Axios |

---

## 📈 Future Improvements

- Authentication system
- Real-time scanning agent
- Cloud-based user reports
- Docker deployment
- CI/CD pipeline integration

---

## 👨‍💻 Author

Developed by **Ranjit**

## ⭐ Contributing

Feel free to fork, improve, and submit pull requests.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).