import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { testStackEnvironment, bootstrapProject } from '../api/client'

// ─── Stack definitions (mirrors config.json for display) ─────────────────────
const STACKS = [
  {
    key: 'react_vite',
    label: 'React + Vite',
    description: 'Lightning-fast React app with Vite bundler',
    icon: '⚡',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    accent: 'text-cyan-400',
    glow: 'shadow-cyan-500/10',
  },
  {
    key: 'fastapi',
    label: 'FastAPI + Python',
    description: 'Production-ready Python REST API backend',
    icon: '🐍',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  {
    key: 'mern',
    label: 'MERN Stack',
    description: 'MongoDB · Express · React · Node full-stack',
    icon: '🌐',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
    glow: 'shadow-violet-500/10',
  },
]

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

// ─── Environment Check Result ─────────────────────────────────────────────────
const EnvReport = ({ report }) => {
  if (!report) return null
  const { label, ready, checks = [], error } = report

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">
          Env Report · {label}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            ready
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {ready ? '✓ Ready' : '✗ Missing Tools'}
        </span>
      </div>

      {error && (
        <p className="text-rose-400 font-mono text-xs">{error}</p>
      )}

      <div className="space-y-1.5">
        {checks.map((c) => (
          <div
            key={c.tool}
            className="flex items-center justify-between text-sm font-mono"
          >
            <span className={c.found ? 'text-slate-300' : 'text-rose-400 line-through opacity-60'}>
              {c.tool}
            </span>
            {c.found ? (
              <span className="text-emerald-400 text-xs">{c.path}</span>
            ) : (
              <span className="text-rose-400 text-xs">not found</span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Build Log ────────────────────────────────────────────────────────────────
const BuildLog = ({ result }) => {
  if (!result) return null
  const { success, stdout, stderr, error, command_run } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">
          Bootstrap Log
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            success
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}
        >
          {success ? '✓ Success' : '✗ Failed'}
        </span>
      </div>

      {command_run && (
        <p className="font-mono text-[10px] text-slate-600 truncate" title={command_run}>
          $ {command_run}
        </p>
      )}

      {error && <p className="text-rose-400 font-mono text-xs">{error}</p>}

      {(stdout || stderr) && (
        <pre className="max-h-48 overflow-y-auto text-[11px] font-mono leading-5 text-slate-400 bg-black/30 rounded-lg p-3 border border-white/5 whitespace-pre-wrap">
          {stdout}
          {stderr && <span className="text-rose-400">{stderr}</span>}
        </pre>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StackSelector() {
  const [selectedStack, setSelectedStack] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [envReport, setEnvReport] = useState(null)
  const [buildResult, setBuildResult] = useState(null)
  const [testingEnv, setTestingEnv] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)
  const [feedbackType, setFeedbackType] = useState('info')

  const showFeedback = (msg, type = 'info', duration = 5000) => {
    setFeedbackMsg(msg)
    setFeedbackType(type)
    if (duration) setTimeout(() => setFeedbackMsg(null), duration)
  }

  const handleTestEnv = async () => {
    if (!selectedStack) return showFeedback('Pick a stack first.', 'error', 3000)
    setEnvReport(null)
    setBuildResult(null)
    setTestingEnv(true)
    showFeedback('Checking your environment prerequisites…', 'info', 0)
    try {
      const data = await testStackEnvironment(selectedStack.key)
      setEnvReport(data)
      showFeedback(
        data.ready
          ? `✓ Environment is ready for ${data.label}!`
          : `⚠ Some tools are missing for ${data.label}.`,
        data.ready ? 'success' : 'error',
      )
    } catch (err) {
      showFeedback(
        err?.response?.data?.detail || 'Failed to reach backend. Is it running?',
        'error',
      )
    } finally {
      setTestingEnv(false)
    }
  }

  const handleBootstrap = async () => {
    if (!selectedStack) return showFeedback('Pick a stack first.', 'error', 3000)
    const name = projectName.trim() || 'my-project'
    setBuildResult(null)
    setEnvReport(null)
    setBootstrapping(true)
    showFeedback(`Bootstrapping "${name}" — this may take a minute…`, 'info', 0)
    try {
      const data = await bootstrapProject(selectedStack.key, name)
      setBuildResult(data)
      showFeedback(
        data.success ? `✓ "${name}" bootstrapped successfully!` : `✗ Bootstrap failed.`,
        data.success ? 'success' : 'error',
      )
    } catch (err) {
      showFeedback(
        err?.response?.data?.detail || 'Bootstrap request failed. Is the backend running?',
        'error',
      )
    } finally {
      setBootstrapping(false)
    }
  }

  const feedbackColors = {
    info: 'text-cyan-400/80 border-cyan-400/20 bg-cyan-400/5',
    success: 'text-emerald-400/80 border-emerald-400/20 bg-emerald-400/5',
    error: 'text-rose-400/80 border-rose-400/20 bg-rose-400/5',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6 space-y-6"
    >
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-400/20 bg-violet-400/5 text-violet-400/60 font-mono text-[10px] tracking-[0.2em] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          SMART BOOTSTRAPPER
        </div>
        <h2 className="font-display text-xl font-semibold text-slate-100">
          What are you building today?
        </h2>
        <p className="text-slate-500 text-sm mt-1 font-body">
          Select a stack, test your environment, or scaffold a new project in seconds.
        </p>
      </div>

      {/* Stack Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STACKS.map((stack) => {
          const active = selectedStack?.key === stack.key
          return (
            <button
              key={stack.key}
              id={`stack-card-${stack.key}`}
              onClick={() => {
                setSelectedStack(stack)
                setEnvReport(null)
                setBuildResult(null)
              }}
              className={`
                group relative text-left rounded-xl p-4 border transition-all duration-200
                bg-gradient-to-br ${stack.color}
                ${active
                  ? `${stack.border} shadow-lg ${stack.glow}`
                  : 'border-white/5 hover:border-white/10'}
              `}
            >
              {active && (
                <span
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    stack.accent.replace('text-', 'bg-')
                  } animate-pulse`}
                />
              )}
              <div className="text-2xl mb-2">{stack.icon}</div>
              <div className={`font-semibold text-sm ${active ? stack.accent : 'text-slate-300'}`}>
                {stack.label}
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5 font-body leading-relaxed">
                {stack.description}
              </div>
            </button>
          )
        })}
      </div>

      {/* Project Name Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="project-name-input"
          className="font-mono text-[11px] tracking-widest text-slate-500 uppercase"
        >
          Project Name
        </label>
        <input
          id="project-name-input"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="my-awesome-project"
          className="
            w-full rounded-lg px-4 py-2.5 text-sm font-mono
            bg-white/[0.04] border border-white/[0.08]
            text-slate-200 placeholder-slate-600
            focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06]
            transition-all duration-200
          "
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          id="btn-test-env"
          onClick={handleTestEnv}
          disabled={testingEnv || bootstrapping}
          className="
            flex-1 flex items-center justify-center gap-2
            px-5 py-2.5 rounded-xl text-sm font-semibold
            border border-cyan-500/30 bg-cyan-500/10 text-cyan-300
            hover:bg-cyan-500/20 hover:border-cyan-500/50
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {testingEnv ? <Spinner /> : <span>🔍</span>}
          {testingEnv ? 'Checking…' : 'Test Environment'}
        </button>

        <button
          id="btn-bootstrap"
          onClick={handleBootstrap}
          disabled={testingEnv || bootstrapping}
          className="
            flex-1 flex items-center justify-center gap-2
            px-5 py-2.5 rounded-xl text-sm font-semibold
            border border-violet-500/30 bg-violet-500/10 text-violet-300
            hover:bg-violet-500/20 hover:border-violet-500/50
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {bootstrapping ? <Spinner /> : <span>🚀</span>}
          {bootstrapping ? 'Bootstrapping…' : 'Bootstrap Project'}
        </button>
      </div>

      {/* Inline feedback bar */}
      <AnimatePresence mode="wait">
        {feedbackMsg && (
          <motion.div
            key={feedbackMsg}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`font-mono text-xs tracking-widest px-4 py-2.5 rounded-lg border ${feedbackColors[feedbackType]} flex items-center gap-2`}
          >
            <span className="animate-pulse">›</span> {feedbackMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <EnvReport report={envReport} />
      <BuildLog result={buildResult} />
    </motion.div>
  )
}
