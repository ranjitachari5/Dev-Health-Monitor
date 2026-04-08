import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

const getScoreColor = (score) => {
  if (score >= 80) return { text: '#34d399', bar: 'from-emerald-500 to-emerald-400', label: 'Excellent', glow: 'rgba(52,211,153,0.4)' }
  if (score >= 50) return { text: '#fbbf24', bar: 'from-amber-500 to-amber-400', label: 'Fair', glow: 'rgba(251,191,36,0.4)' }
  return { text: '#fb7185', bar: 'from-rose-600 to-rose-400', label: 'Critical', glow: 'rgba(251,113,133,0.4)' }
}

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return controls.stop
  }, [value])
  return <span>{display}</span>
}

const HealthScore = ({ score, totalTools, okTools }) => {
  const colors = getScoreColor(score)
  const circumference = 2 * Math.PI * 54

  return (
    <motion.div
      className="card-highlight p-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-mono text-xs tracking-[0.2em] text-cyan-400/70 uppercase">System Health Index</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-10">
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="10" />
            <motion.circle
              cx="70" cy="70" r="54" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
              transition={{ duration: 1.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
              transform="rotate(-90 70 70)"
              style={{ filter: `drop-shadow(0 0 8px ${colors.glow})` }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.text} stopOpacity="0.8" />
                <stop offset="100%" stopColor={colors.text} />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r="44" fill="rgba(10,21,48,0.8)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-3xl leading-none" style={{ color: colors.text }}>
              <AnimatedNumber value={score} /><span className="text-base opacity-60">%</span>
            </span>
            <span className="font-mono text-[10px] tracking-widest mt-1 opacity-50" style={{ color: colors.text }}>
              {colors.label.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: totalTools, color: '#94a3b8' },
              { label: 'Healthy', value: okTools, color: '#34d399' },
              { label: 'Issues', value: totalTools - okTools, color: '#fb7185' },
            ].map(({ label, value, color }) => (
              <motion.div key={label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center"
                whileHover={{ scale: 1.04 }}
              >
                <div className="font-display text-2xl font-semibold" style={{ color }}>{value}</div>
                <div className="font-mono text-[10px] tracking-widest text-slate-500 uppercase mt-1">{label}</div>
              </motion.div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[11px] text-slate-500 tracking-wider">HEALTH COVERAGE</span>
              <span className="font-mono text-[11px] tracking-wider" style={{ color: colors.text }}>{score}%</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                style={{ boxShadow: `0 0 12px ${colors.glow}` }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default HealthScore