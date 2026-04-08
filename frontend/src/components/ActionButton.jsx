import { motion } from 'framer-motion'

const ActionButton = ({ onClick, isLoading }) => (
  <motion.button
    className="btn-primary px-8 py-4 text-lg w-full sm:w-auto min-w-[220px]"
    onClick={onClick}
    disabled={isLoading}
    whileTap={{ scale: 0.96 }}
    whileHover={{ scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}
  >
    <span className="flex items-center justify-center gap-3">
      {isLoading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-5 h-5 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full"
          />
          <span className="font-mono text-sm tracking-wider text-cyan-200">SCANNING...</span>
        </>
      ) : (
        <>
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-xl"
          >🚀</motion.span>
          <span className="font-mono text-sm tracking-widest">SCAN SYSTEM</span>
        </>
      )}
    </span>
  </motion.button>
)

export default ActionButton