import { motion, AnimatePresence } from 'framer-motion'

const statusConfig = {
  ok: { label: 'OK', className: 'status-ok', icon: '✓', dot: '#34d399' },
  missing: { label: 'MISSING', className: 'status-missing', icon: '✕', dot: '#fb7185' },
  outdated: { label: 'OUTDATED', className: 'status-outdated', icon: '⚠', dot: '#fbbf24' },
}

const toolIcons = {
  node: '⬡', nodejs: '⬡', npm: '◈', python: '🐍', python3: '🐍',
  git: '⎇', docker: '🐳', kubectl: '☸', yarn: '🧶', pnpm: '📦',
  rust: '⚙', go: '◉', java: '☕', ruby: '💎', php: '🐘', default: '◆',
}

const ToolRow = ({ tool, index }) => {
  const status = tool.status?.toLowerCase() || 'ok'
  const config = statusConfig[status] || statusConfig.ok
  const icon = toolIcons[tool.name.toLowerCase()] || toolIcons.default

  return (
    <motion.div
      className="group relative flex items-center justify-between px-5 py-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/20 transition-all duration-200 cursor-default"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-lg">
          {icon}
        </div>
        <div>
          <div className="font-mono text-sm font-medium text-slate-200">{tool.name}</div>
          <div className="font-mono text-[11px] text-slate-600 mt-0.5">{tool.version || '—'}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: config.dot }}
          animate={status === 'ok' ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`font-mono text-[10px] tracking-[0.15em] px-3 py-1 rounded-full font-semibold ${config.className}`}>
          {config.icon} {config.label}
        </span>
      </div>
    </motion.div>
  )
}

const IssueList = ({ tools }) => {
  const sorted = [...tools].sort((a, b) => {
    const order = { missing: 0, outdated: 1, ok: 2 }
    return (order[a.status?.toLowerCase()] ?? 3) - (order[b.status?.toLowerCase()] ?? 3)
  })
  const issues = sorted.filter(t => t.status?.toLowerCase() !== 'ok')
  const healthy = sorted.filter(t => t.status?.toLowerCase() === 'ok')

  return (
    <motion.div
      className="card p-6 space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-xs tracking-[0.2em] text-cyan-400/70 uppercase">Tool Registry</span>
        </div>
        <span className="font-mono text-xs text-slate-600">{sorted.length} tools scanned</span>
      </div>

      <AnimatePresence>
        {issues.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="font-mono text-[10px] tracking-[0.2em] text-rose-400/60 uppercase px-1 mb-3 flex items-center gap-2">
              <span className="text-rose-400">●</span> Requires Attention ({issues.length})
            </div>
            {issues.map((tool, i) => <ToolRow key={tool.name} tool={tool} index={i} />)}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {healthy.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="font-mono text-[10px] tracking-[0.2em] text-emerald-400/60 uppercase px-1 mb-3 flex items-center gap-2">
              <span className="text-emerald-400">●</span> Healthy ({healthy.length})
            </div>
            {healthy.map((tool, i) => <ToolRow key={tool.name} tool={tool} index={issues.length + i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default IssueList