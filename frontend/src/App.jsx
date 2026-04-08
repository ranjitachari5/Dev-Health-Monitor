import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HealthScore from './components/HealthScore'
import IssueList from './components/IssueList'
import ActionButton from './components/ActionButton'
import StackSelector from './components/StackSelector'
import { runScan } from './api/client'

const MOCK_TOOLS = [
  { name: 'Node.js', version: 'v20.11.0', status: 'ok' },
  { name: 'npm', version: '10.2.4', status: 'ok' },
  { name: 'Python3', version: '3.11.7', status: 'ok' },
  { name: 'Git', version: '2.43.0', status: 'ok' },
  { name: 'Docker', version: null, status: 'missing' },
  { name: 'Rust', version: '1.74.0', status: 'outdated' },
  { name: 'Go', version: null, status: 'missing' },
  { name: 'Yarn', version: '1.22.21', status: 'ok' },
]

const StatusBar = ({ message, type = 'info' }) => {
  const colors = {
    info: 'text-cyan-400/70 border-cyan-400/20 bg-cyan-400/5',
    success: 'text-emerald-400/70 border-emerald-400/20 bg-emerald-400/5',
    error: 'text-rose-400/70 border-rose-400/20 bg-rose-400/5',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className={`font-mono text-xs tracking-widest px-4 py-2.5 rounded-lg border ${colors[type]} flex items-center gap-2`}
    >
      <span className="animate-pulse">›</span> {message}
    </motion.div>
  )
}

export default function App() {
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)
  const [statusType, setStatusType] = useState('info')
  const [hasScanned, setHasScanned] = useState(false)

  const showStatus = (msg, type = 'info', duration = 4000) => {
    setStatusMsg(msg); setStatusType(type)
    if (duration) setTimeout(() => setStatusMsg(null), duration)
  }

  const handleScan = async () => {
    setIsLoading(true)
    showStatus('Initializing system scan...', 'info', 0)
    try {
      const data = await runScan()
      setReport(data); setHasScanned(true)
      showStatus('Scan complete. Report generated successfully.', 'success')
    } catch (err) {
      console.warn('[Demo Mode] Backend offline — using mock data.')
      showStatus('Demo mode: backend offline. Showing mock data.', 'info')
      setReport({ tools: MOCK_TOOLS }); setHasScanned(true)
    } finally {
      setIsLoading(false)
    }
  }

  const tools = report?.tools || []
  const okTools = tools.filter(t => t.status?.toLowerCase() === 'ok').length
  const score = tools.length > 0 ? Math.round((okTools / tools.length) * 100) : 0

  return (
    <div className="min-h-screen bg-navy-950 bg-grid relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb absolute top-[-20%] left-[-10%] w-[600px] h-[600px]"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)' }} />
        <div className="orb absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px]"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', animationDelay: '-4s' }} />
        <div className="scanline fixed inset-0 pointer-events-none w-full h-[200px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <motion.div className="flex justify-center mb-8"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400/60 font-mono text-[11px] tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            DEV ENVIRONMENT MONITOR · v1.0
          </div>
        </motion.div>

        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-tight mb-4">
            <span className="text-gradient">System Health</span><br />
            <span className="text-slate-200">at a glance</span>
          </h1>
          <p className="text-slate-500 font-body text-base max-w-md mx-auto leading-relaxed">
            Scan your development environment for installed tools, version drift, and missing dependencies — in seconds.
          </p>
        </motion.div>

        <motion.div className="flex flex-col items-center gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <ActionButton onClick={handleScan} isLoading={isLoading} />
          <AnimatePresence mode="wait">
            {statusMsg && <StatusBar key={statusMsg} message={statusMsg} type={statusType} />}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {hasScanned && tools.length > 0 && (
            <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <HealthScore score={score} totalTools={tools.length} okTools={okTools} />
              <IssueList tools={tools} />
            </motion.div>
          )}
        </AnimatePresence>

        {!hasScanned && !isLoading && (
          <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="font-mono text-[11px] tracking-[0.3em] text-slate-700 uppercase">— awaiting scan —</div>
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div key={i} className="w-1 h-1 rounded-full bg-slate-700"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Smart Project Bootstrapper ─────────────────────────────── */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.05]" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-slate-700 uppercase">
              project bootstrapper
            </span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>
          <StackSelector />
        </motion.div>

      </div>
    </div>
  )
}