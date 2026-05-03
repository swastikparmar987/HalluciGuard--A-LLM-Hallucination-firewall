import { motion } from 'framer-motion'
import { AlertCircle, Shield, Target, MessageSquare, Activity } from 'lucide-react'
import RiskMeter from './RiskMeter'

export default function HallucinationReport({ evaluation }) {
  if (!evaluation) return null

  const {
    final_risk_score,
    zone,
    is_flagged,
    reasoning,
    heatmap,
    override_triggered,
    signals
  } = evaluation

  const isSafe = zone === 'SAFE'
  const isBlocked = zone === 'BLOCKED'
  const accentColor = isBlocked ? '#f43f5e' : !isSafe ? '#F7931A' : '#10b981'

  return (
    <div className="space-y-10 animate-fade-in font-body">
      {/* Accuracy Meter Section */}
      <section className="relative p-6 rounded-2xl glass-card bg-surface border-white/5 shadow-elevation overflow-hidden corner-accents">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bitcoin-orange/20 to-transparent" />
        
        <div className="flex flex-col items-center">
          <RiskMeter score={final_risk_score} />
          
          <div className="mt-8 w-full space-y-4">
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              isBlocked ? 'bg-rose-500/5 border-rose-500/20' : 
              !isSafe ? 'bg-bitcoin-orange/5 border-bitcoin-orange/20' : 
              'bg-emerald-500/5 border-emerald-500/20'
            }`}>
              {isBlocked ? (
                <AlertCircle className="text-rose-400 shrink-0" size={24} />
              ) : !isSafe ? (
                <Target className="text-bitcoin-orange shrink-0" size={24} />
              ) : (
                <Shield className="text-emerald-400 shrink-0" size={24} />
              )}
              
              <div>
                <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                  isBlocked ? 'text-rose-400' : !isSafe ? 'text-bitcoin-orange' : 'text-emerald-400'
                }`}>
                  {isBlocked ? 'Blocked' : !isSafe ? 'Caution Needed' : 'Verified Safe'}
                </p>
                <p className="text-[13px] font-bold text-white mt-0.5">
                  {isBlocked ? 'High risk of errors' : !isSafe ? 'Some parts might be wrong' : 'This looks correct'}
                </p>
              </div>
            </div>

            {override_triggered && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertCircle size={16} />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest">Manual Safety Override Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Signal Breakdown */}
        {signals && (
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            {[
              { label: 'Consistency', val: signals.consistency, color: 'text-emerald-400' },
              { label: 'Confidence', val: signals.confidence, color: 'text-amber-400' },
              { label: 'Grounding', val: signals.grounding, color: 'text-indigo-400' },
              { label: 'Web Audit', val: signals.internet_audit, color: 'text-bitcoin-orange' }
            ].map(s => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between items-center text-[8px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                  <span>{s.label}</span>
                  <span className={s.val > 50 ? 'text-rose-400' : s.color}>{(s.val || 0).toFixed(0)}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${s.val}%` }}
                    className={`h-full ${s.val > 50 ? 'bg-rose-500' : s.color.replace('text', 'bg')}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reasoning Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-bitcoin-orange/10 text-bitcoin-orange border border-bitcoin-orange/20">
            <MessageSquare size={14} />
          </div>
          <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Why this was flagged</h4>
        </div>
        <div className="p-6 rounded-2xl glass-card bg-surface border-white/5 border-l-2" style={{ borderLeftColor: accentColor }}>
          <p className="text-[13px] leading-relaxed text-zinc-300 font-body">
            {reasoning}
          </p>
        </div>
      </section>

      {/* Heatmap Section */}
      {heatmap && heatmap.length > 0 && (
        <section className="space-y-4 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-digital-gold/10 text-digital-gold border border-digital-gold/20">
              <Activity size={14} />
            </div>
            <h4 className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Detailed Sentence Check</h4>
          </div>
          
          <div className="space-y-3">
            {heatmap.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border transition-all hover:bg-white/5 group"
                style={{
                  background: 'rgba(15, 17, 21, 0.4)',
                  borderColor: item.risk > 65 ? 'rgba(244, 63, 94, 0.2)' : 
                              item.risk > 35 ? 'rgba(247, 147, 26, 0.2)' : 
                              'rgba(16, 185, 129, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-widest">Sentence {i + 1}</span>
                  <span className={`text-[10px] font-mono font-bold ${
                    (item.risk || 0) > 65 ? 'text-rose-400' : 
                    (item.risk || 0) > 35 ? 'text-bitcoin-orange' : 
                    'text-emerald-400'
                  }`}>
                    {(item.risk || 0).toFixed(0)}% Risk
                  </span>
                </div>
                <p className="text-xs font-body text-zinc-300 leading-relaxed italic">
                  "{item.text}"
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
