import { useState, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, XOctagon, ChevronDown, ChevronUp, 
  CheckCircle, Zap, Activity, Cpu, Database, Info, AlertCircle, RefreshCw, Globe
} from 'lucide-react'
import SignalBreakdown from './SignalBreakdown'

// ─── ERROR BOUNDARY ────────────────────────────────────────────
// This prevents the entire page from going black if PostCard crashes
class PostCardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('[PostCard Crash]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-start mb-10 w-full">
          <div className="w-full max-w-[95%]">
            <div className="bg-[#121212] border border-[#ff4444]/30 border-l-2 border-l-[#ff4444] rounded-sm p-6">
              <div className="flex items-center gap-3 text-[#ff4444]">
                <AlertCircle size={18} />
                <span className="font-['Space_Grotesk'] font-semibold text-xs uppercase tracking-wider">
                  Display Error — Refresh to retry
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const zoneConfig = {
  SAFE: {
    color: 'text-[#F7931A]',
    borderColor: 'border-[#F7931A]',
    leftBorder: 'border-l-[#F7931A]',
    glow: 'glow-safe',
    label: 'Safe Response',
    icon: CheckCircle,
    bg: 'bg-[#F7931A]/5',
  },
  CAUTION: {
    color: 'text-[#ffdb3c]',
    borderColor: 'border-[#ffdb3c]',
    leftBorder: 'border-l-[#ffdb3c]',
    glow: 'glow-caution',
    label: 'Caution: Verification Advised',
    icon: AlertTriangle,
    bg: 'bg-[#ffdb3c]/5',
  },
  BLOCKED: {
    color: 'text-[#ff4444]',
    borderColor: 'border-[#ff4444]',
    leftBorder: 'border-l-[#ff4444]',
    glow: 'glow-danger',
    label: 'Answer Blocked: High Risk of Hallucination',
    icon: XOctagon,
    bg: 'bg-[#ff4444]/5',
  }
}

function PostCardInner({ message, isUser }) {
  const [expanded, setExpanded] = useState(false)

  // ── USER MESSAGE ──
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end mb-8 w-full"
      >
        <div className="bg-[#201f1f] border border-[#353534] p-5 rounded-xl rounded-tr-sm max-w-[85%] shadow-sm">
          <p className="text-[15px] leading-relaxed text-[#e5e2e1] font-['Inter']">
            {message.text || ''}
          </p>
        </div>
      </motion.div>
    )
  }

  // ── ERROR STATE ──
  if (message.isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-start mb-10 w-full"
      >
        <div className="w-full max-w-[95%]">
          <div className="bg-[#121212] border border-[#ff4444]/30 border-l-2 border-l-[#ff4444] rounded-sm p-6 shadow-[0_0_15px_rgba(255,68,68,0.05)]">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#1f1f1f]">
              <AlertCircle size={18} className="text-[#ff4444]" />
              <span className="font-['Space_Grotesk'] font-semibold text-xs uppercase tracking-wider text-[#ff4444]">
                System Error
              </span>
            </div>
            <p className="text-sm font-mono text-[#ff8888] leading-relaxed">
              {message.text || 'Unknown error'}
            </p>
            <div className="mt-4 pt-4 border-t border-[#1f1f1f] text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin" />
              There was a problem connecting to the AI.
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── EVALUATING STATE ──
  if (message.isEvaluating) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start mb-10 w-full"
      >
        <div className="w-full max-w-[95%]">
          <div className="bg-[#121212] border border-[#1f1f1f] border-l-2 border-l-[#353534] rounded-sm p-6 relative">
            <div className="text-[15px] leading-relaxed text-[#e5e2e1] font-['Inter']">
              <p>{message.text || ''}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                <Activity size={12} className="animate-pulse text-[#F7931A]" />
                Checking for hallucinations...
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── NO EVALUATION DATA YET — show plain response ──
  const evaluation = message.evaluation
  if (!evaluation) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-start mb-10 w-full"
      >
        <div className="w-full max-w-[95%]">
          <div className="bg-[#121212] border border-[#1f1f1f] border-l-2 border-l-[#353534] rounded-sm p-6">
            <div className="text-[15px] leading-relaxed text-[#e5e2e1] font-['Inter']">
              <p>{message.text || ''}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── EVALUATED RESPONSE ──
  const zone = evaluation.zone || 'SAFE'
  const config = zoneConfig[zone] || zoneConfig.SAFE
  const Icon = config.icon || CheckCircle
  const riskScore = typeof evaluation.final_risk_score === 'number' ? evaluation.final_risk_score : 0
  const signals = evaluation.signals || {}
  const heatmap = Array.isArray(evaluation.heatmap) ? evaluation.heatmap : []
  const grounding = typeof signals.grounding === 'number' ? signals.grounding : 0
  const internetAudit = typeof signals.internet_audit === 'number' ? signals.internet_audit : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-start mb-10 w-full"
    >
      <div className="w-full max-w-[95%]">
        <div className={`bg-[#121212] border border-[#1f1f1f] border-l-2 ${config.leftBorder} rounded-sm p-6 ${config.glow} relative`}>
          
          {/* ── HEADER BANNER ── */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#1f1f1f]">
            <Icon size={18} className={config.color} />
            <span className={`font-['Space_Grotesk'] font-semibold text-xs uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
            <span className={`ml-auto px-2 py-1 rounded-sm border font-mono text-[10px] ${config.bg} ${config.color} border-current opacity-60`}>
              Risk: {zone === 'BLOCKED' ? `${riskScore.toFixed(0)}/100` : zone === 'CAUTION' ? 'Moderate' : 'Low'}
            </span>
          </div>

          {/* ── CONTENT AREA ── */}
          <div className="space-y-6">
            {zone === 'BLOCKED' ? (
              <div className="space-y-6">
                <p className="text-[14px] text-[#b9cbb9] italic leading-relaxed">
                  This answer was blocked because it contains false information. The AI was making up facts that do not match reality.
                </p>

                {/* Diagnostic Trace */}
                <div className="bg-[#0e0e0e] border border-[#ff4444]/30 rounded-sm overflow-hidden mt-4">
                  <div className="bg-[#ff4444]/5 px-4 py-3 border-b border-[#ff4444]/30 flex justify-between items-center">
                    <span className="font-['Space_Grotesk'] font-semibold text-xs text-[#ff4444] uppercase tracking-wider">Analysis Details</span>
                    <button onClick={() => setExpanded(!expanded)} className="text-[#ff4444] hover:opacity-80 transition-opacity">
                      <ChevronDown size={16} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {expanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          <div>
                             <h4 className="font-['Space_Grotesk'] text-[10px] text-[#b9cbb9] mb-2 uppercase tracking-widest">The AI's Answer</h4>
                            <p className="font-mono text-[11px] text-[#ff8888] bg-[#ff4444]/10 p-3 rounded border border-[#ff4444]/20 leading-relaxed">
                              "{message.text || ''}"
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#0a0a0a] p-3 rounded border border-[#1f1f1f]">
                              <span className="block font-mono text-[10px] text-[#b9cbb9] uppercase mb-1">Consistency</span>
                              <span className="font-['Space_Grotesk'] font-bold text-[#ff4444] text-xs">FAILED</span>
                            </div>
                            <div className="bg-[#0a0a0a] p-3 rounded border border-[#1f1f1f]">
                              <span className="block font-mono text-[10px] text-[#b9cbb9] uppercase mb-1">Grounding</span>
                              <span className="font-['Space_Grotesk'] font-bold text-[#ff4444] text-xs">{(100 - grounding)}%</span>
                            </div>
                            <div className="bg-[#0a0a0a] p-3 rounded border border-[#1f1f1f]">
                              <span className="block font-mono text-[10px] text-[#b9cbb9] uppercase mb-1">Action</span>
                              <span className="font-['Space_Grotesk'] font-bold text-[#e5e2e1] text-xs uppercase">Suppressed</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-[15px] leading-relaxed text-[#e5e2e1] font-['Inter']">
                   {/* In CAUTION mode, we show a simplified "highlight" version if evaluation has heatmap */}
                   {zone === 'CAUTION' && heatmap.length > 0 ? (
                     <div className="space-y-4">
                        <p>{(message.text || "").split('.')[0]}.</p>
                        <div className="bg-[#0e0e0e] border border-[#1f1f1f] p-4 rounded-sm leading-relaxed text-[14px]">
                           {heatmap.map((item, idx) => (
                             <span 
                               key={idx} 
                               className={(item.risk || 0) > 50 ? 'bg-[#ff4444]/20 text-[#ff8888] border-b border-[#ff4444]/50 cursor-help' : (item.risk || 0) > 20 ? 'bg-[#ffdb3c]/20 text-[#ffea88] border-b border-[#ffdb3c]/50 cursor-help' : ''}
                               title={(item.risk || 0) > 50 ? 'Unverified Fact' : 'Potential Hallucination'}
                             >
                               {item.text || ''}{' '}
                             </span>
                           ))}
                        </div>
                     </div>
                   ) : (
                     <p>{message.text || ''}</p>
                   )}
                </div>

                {/* Analysis Breakdown Footer for non-blocked messages */}
                <div className="bg-[#0e0e0e] border border-[#1f1f1f] rounded-sm overflow-hidden">
                   <div 
                    onClick={() => setExpanded(!expanded)}
                    className="bg-[#1c1b1b] px-4 py-2 border-b border-[#1f1f1f] flex justify-between items-center cursor-pointer hover:bg-[#252424] transition-colors"
                   >
                     <span className="font-['Space_Grotesk'] font-semibold text-[10px] text-[#e5e2e1] uppercase tracking-widest">Why was this checked?</span>
                     <ChevronDown size={14} className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`} />
                   </div>
                   
                   <AnimatePresence>
                     {expanded && (
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                       >
                         <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                               <h4 className="font-['Space_Grotesk'] text-[10px] text-[#b9cbb9] uppercase tracking-widest">Web Evidence</h4>
                               <div className="space-y-2">
                                  {internetAudit < 40 ? (
                                    <div className="flex items-center gap-2 text-[11px] text-[#00ff88]">
                                      <CheckCircle size={12} />
                                      <span>The web confirms this answer</span>
                                    </div>
                                  ) : internetAudit < 70 ? (
                                    <div className="flex items-center gap-2 text-[11px] text-[#ffdb3c]">
                                      <Info size={12} />
                                      <span>The web is inconclusive</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-[11px] text-[#ff4444]">
                                      <AlertCircle size={12} />
                                      <span>The web disagrees with this answer</span>
                                    </div>
                                  )}
                                  <div className="text-[10px] text-zinc-500 font-mono">Confidence Score: {(100 - grounding)}%</div>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <h4 className="font-['Space_Grotesk'] text-[10px] text-[#b9cbb9] uppercase tracking-widest">Safety Signals</h4>
                               <SignalBreakdown signals={signals} />
                            </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* ── SYSTEM FOOTER ── */}
          <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><Globe size={12} /> Web Search</span>
              <span className="flex items-center gap-1.5"><Activity size={12} /> Accuracy Check</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#b9cbb9]">
               <Shield size={12} className={config.color} />
               Verified Response
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

// ── EXPORTED COMPONENT WITH ERROR BOUNDARY ──
export default function PostCard(props) {
  return (
    <PostCardErrorBoundary>
      <PostCardInner {...props} />
    </PostCardErrorBoundary>
  )
}
