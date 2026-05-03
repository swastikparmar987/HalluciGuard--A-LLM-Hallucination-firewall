import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, HelpCircle, Search, Activity, Cpu, Globe } from 'lucide-react'

const signalMeta = {
  consistency: {
    label: 'Story Check',
    desc: 'Checking if AI changes its story across multiple runs.',
    icon: Activity,
  },
  confidence: {
    label: 'Tone Analysis',
    desc: 'Scanning for hedge words and uncertainty markers.',
    icon: AlertCircle,
  },
  grounding: {
    label: 'Fact Scanner',
    desc: 'Detecting specific names, dates, and numbers.',
    icon: Cpu,
  },
  internet_audit: {
    label: 'Web Verify',
    desc: 'Cross-checking claims with live search results.',
    icon: Globe,
  }
}

const COLORS = {
  SAFE: '#F7931A',
  CAUTION: '#ffdb3c',
  DANGER: '#ff4444',
}

export default function SignalBreakdown({ signals }) {
  if (!signals) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(signals).map(([key, score], index) => {
        const meta = signalMeta[key] || { label: key, desc: '', icon: HelpCircle }
        const Icon = meta.icon
        
        const isSafe = score < 35
        const isWarning = score >= 35 && score < 65
        const color = isSafe ? COLORS.SAFE : isWarning ? COLORS.CAUTION : COLORS.DANGER
        const bg = isSafe ? 'rgba(247, 147, 26, 0.05)' : isWarning ? 'rgba(255, 219, 60, 0.05)' : 'rgba(255, 68, 68, 0.05)'

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={key}
            className="p-4 rounded-sm border border-[#1f1f1f] bg-black/40 flex flex-col gap-2 group hover:border-[#353534] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-black/60 border border-[#1f1f1f]">
                  <Icon size={14} style={{ color }} />
                </div>
                <span className="text-[10px] font-['Space_Grotesk'] font-bold uppercase tracking-widest text-zinc-300">
                  {meta.label}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color }}>
                {(score || 0).toFixed(0)}% Risk
              </span>
            </div>
            
            <p className="text-[10px] text-zinc-500 leading-tight">
              {meta.desc}
            </p>
            
            <div className="w-full h-1 bg-[#1c1b1b] rounded-full overflow-hidden mt-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                className="h-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
