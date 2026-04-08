# Dev Environment Health Monitor - Frontend

A production-ready React + TypeScript frontend for the Dev Environment Health Monitor application. This is an AI-powered tool that analyzes your development environment, identifies issues, and provides automated fixes.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **Animated Squares Background** - Custom canvas component

## Project Structure

```
src/
├── components/
│   ├── Squares.tsx              # Animated background grid component
│   ├── LandingPage.tsx          # Entry screen with quick scan & project input options
│   ├── ProjectInput.tsx         # AI-powered project description form
│   ├── ScanDashboard.tsx        # Main health dashboard with tools & insights
│   ├── ToolCard.tsx             # Individual tool health card with fix actions
│   ├── ScoreRing.tsx            # Animated circular health score display
│   ├── TerminalOutput.tsx       # Terminal window simulator with typewriter effect
│   ├── AIInsights.tsx           # AI recommendations & insights panel
│   └── ScanHistory.tsx          # Historical scan data visualization
├── api/
│   └── client.ts                # Axios-based API client with typed endpoints
├── types/
│   └── index.ts                 # TypeScript interfaces for all API responses
├── App.tsx                       # Main app component with screen routing
├── main.tsx                      # React entry point
└── index.css                     # Tailwind CSS configuration & global styles
```

## Features

### Screen 1: Landing Page
- Full-screen animated background with interactive grid
- Quick scan button (runs instant health check)
- Project description link
- OS platform detection
- Glowing buttons with smooth interactions

### Screen 2: Project Input
- Rich textarea for project description
- AI-curated example chips (React, Python, Java, DevOps, Flutter)
- Animated loading states with cycling messages
- Frosted glass design with backdrop blur

### Screen 3: Dashboard
- **Hero Section**: Animated score ring (0-100) with color-coded health status
  - Green (76-100): Healthy
  - Yellow (41-75): Warning
  - Red (0-40): Critical
  
- **Critical Issues Banner**: Red alert banner for urgent problems

- **Tool Grid**: Responsive 3-column layout showing:
  - Tool name with status badge
  - Current vs. required version
  - Fix actions (Install, Update, Fix PATH)
  - Terminal output with typewriter effect
  - Lucide icons for each tool type

- **Filter Tabs**: Quick filter by status (All, Healthy, Warning, Critical, Not Installed)

- **AI Insights Panel**:
  - Required tools list
  - Missing tools with install buttons
  - Outdated tools with update buttons
  - AI-generated recommendations with checkboxes

- **Scan History**: Last 5 scans with score timeline visualization

## Design System

### Colors
- **Background**: `#0a0a0f` (near-black)
- **Surface**: `#0f0f1a` (card background)
- **Text Primary**: `#f8f8ff` (nearly white)
- **Text Muted**: `rgba(255,255,255,0.4)`
- **Success**: `#10b981` (emerald)
- **Warning**: `#eab308` (yellow)
- **Danger**: `#ef4444` (red)
- **Accent**: `#6366f1` (indigo)

### Typography
- **Headings**: Bold, tight tracking
- **Body**: Regular, relaxed leading
- **Code**: Monospace font (JetBrains Mono)

### Effects
- Frosted glass: `backdrop-blur-sm bg-white/5 border border-white/10`
- Smooth transitions: `transition-all duration-300`
- Hover glows: Colored shadows matching element purpose
- Animations: Smooth fill animations, typewriter effects, pulsing badges

## Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- Backend API running at `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Create .env file (optional, defaults to localhost:8000)
echo "VITE_API_URL=http://localhost:8000" > .env
```

### Development

```bash
# Start dev server (opens in browser at http://localhost:5173)
npm run dev
```

### Production Build

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

## API Integration

The frontend connects to the FastAPI backend at the following endpoints:

- `GET /api/health` - Run instant health scan
- `POST /api/analyze` - Analyze project with AI insights
- `POST /api/fix/{tool_name}` - Fix specific tool (install or PATH)
- `GET /api/scan/history` - Retrieve past scan logs
- `GET /api/install-command/{tool_name}` - Get install instructions

See [api/client.ts](src/api/client.ts) for typed endpoint functions.

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will prompt you to use the next available port.

### Backend Connection Error
Ensure the backend is running at the configured API URL and CORS is enabled.

### Build Issues
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimizations

- Lazy component loading with React.lazy (if needed)
- Optimized Squares background canvas rendering
- Efficient state management with minimal re-renders
- Tailwind CSS purging for minimal bundle size
- Vite's fast HMR during development

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Part of the Dev Environment Health Monitor project.
