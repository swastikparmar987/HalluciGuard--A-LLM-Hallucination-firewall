import { motion } from 'framer-motion'

export default function RiskMeter({ score }) {
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100)
  
  // Calculate rotation for the needle (from -90 to 90 degrees)
  const rotation = (normalizedScore / 100) * 180 - 90

  // Determine color based on score
  const getColor = (s) => {
    if (s <= 35) return '#10b981' // emerald
    if (s <= 65) return '#F7931A' // bitcoin-orange
    return '#f43f5e' // rose
  }

  const currentColor = getColor(normalizedScore)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-64 h-40">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Main Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value Arc (Glow) */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={currentColor}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: normalizedScore / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${currentColor})`, opacity: 0.8 }}
          />

          {/* Tick Marks (Mathematical Precision) */}
          {[...Array(11)].map((_, i) => {
            const angle = (i * 18) * (Math.PI / 180)
            const x1 = 100 - Math.cos(angle) * 80
            const y1 = 100 - Math.sin(angle) * 80
            const x2 = 100 - Math.cos(angle) * 88
            const y2 = 100 - Math.sin(angle) * 88
            return (
              <line
                key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
            )
          })}

          {/* Labels */}
          <text x="20" y="115" fontSize="8" fill="#5a5a5a" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold">0</text>
          <text x="100" y="15" fontSize="8" fill="#5a5a5a" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold">50</text>
          <text x="180" y="115" fontSize="8" fill="#5a5a5a" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="bold">100</text>

          {/* Center Point */}
          <circle cx="100" cy="100" r="4" fill="#030304" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Needle */}
          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
            style={{ originX: '100px', originY: '100px' }}
          >
            <line
              x1="100" y1="100" x2="100" y2="30"
              stroke={currentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 5px ${currentColor})` }}
            />
            <circle cx="100" cy="100" r="2" fill="white" />
          </motion.g>
        </svg>

        {/* Digital Value Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.div
            key={score}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-heading font-bold text-white tracking-tighter"
          >
            {normalizedScore.toFixed(1)}
          </motion.div>
          <div className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
            normalizedScore > 65 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
            normalizedScore > 35 ? 'bg-bitcoin-orange/10 text-bitcoin-orange border-bitcoin-orange/20' : 
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            Risk Vector
          </div>
        </div>
      </div>
    </div>
  )
}
