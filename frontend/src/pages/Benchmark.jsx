import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Cpu, Globe, Activity, Shield, 
  MessageSquare, Layers, Search, AlertCircle,
  Database, Radio, Terminal, Target, Eye
} from 'lucide-react'

const SIGNAL_DEEP_DIVE = {
  input: {
    title: 'Your Question',
    subtitle: 'Step 1',
    color: '#60a5fa',
    desc: 'The process starts when you type a question. Our system captures what you asked.',
    details: 'It prepares the text for the AI to read and for our firewall to analyze.',
    icon: MessageSquare
  },
  generator: {
    title: 'AI Response',
    subtitle: 'Step 2',
    color: '#f59e0b',
    desc: 'The AI model thinks and creates an answer. But before you see it, we hold it for a safety check.',
    details: 'The firewall is now ready to look at this answer for any hallucinations.',
    icon: Zap
  },
  s1: {
    title: 'Consistency',
    subtitle: 'Signal 01',
    color: '#F7931A',
    desc: 'We ask the AI the same thing multiple times. If the answers are very different, it might be hallucinating.',
    details: 'Changing details in every answer is a big red flag for AI confusion.',
    icon: Layers
  },
  s2: {
    title: 'Certainty',
    subtitle: 'Signal 02',
    color: '#F7931A',
    desc: 'We check if the AI sounds unsure. Words like "maybe" or "probably" help us see if it is guessing.',
    details: 'A confident AI uses clear facts; an unsure AI uses "hedge" words.',
    icon: Activity
  },
  s3: {
    title: 'Facts Found',
    subtitle: 'Signal 03',
    color: '#F7931A',
    desc: 'We count how many names, dates, and places are in the answer. Too many facts can sometimes hide a lie.',
    details: 'This tells us how much "factual" information needs to be verified.',
    icon: Database
  },
  s4: {
    title: 'Web Check',
    subtitle: 'Signal 04',
    color: '#F7931A',
    desc: 'We search the internet in real-time to see if the AIs facts match what is actually on the web.',
    details: 'This is the final verification to make sure the AI is telling the truth.',
    icon: Globe
  },
  verdict: {
    title: 'Final Score',
    subtitle: 'Step 4',
    color: '#ef4444',
    desc: 'We combine all 4 signals into one risk level. This tells you if the answer is safe to use.',
    details: 'Safe means verified; Caution means be careful; Blocked means the AI likely lied.',
    icon: Shield
  }
}

function StageNode({ id, active, onHover, data }) {
  const Icon = data.icon
  return (
    <motion.div 
      onMouseEnter={() => onHover(id)}
      className={`relative cursor-pointer p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-3 min-w-[180px] ${
        active 
        ? 'bg-black border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)] scale-110 z-20' 
        : 'bg-zinc-900/20 border-white/5 opacity-40 grayscale blur-[1px]'
      }`}
    >
      <div className={`p-4 rounded-2xl shadow-xl transition-all duration-500 ${active ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600'}`}>
        <Icon size={28} />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-1">{data.subtitle}</p>
        <p className={`text-sm font-black uppercase tracking-tight ${active ? 'text-white' : 'text-zinc-700'}`}>{data.title}</p>
      </div>
    </motion.div>
  )
}

export default function PresentationInfographic() {
  const [hoveredNode, setHoveredNode] = useState('s1')

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar bg-[#020202] text-[#e5e2e1] relative selection:bg-white selection:text-black">
      
      {/* Premium Visual Elements */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px]" />
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_50%)]" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-16 relative z-10">
        
        {/* Simplified Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-500">
              <Radio size={12} className="animate-pulse" /> Hallucination Checker
           </div>
           <h1 className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none italic">
             How it <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-700">Works</span>
           </h1>
           <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Hover over each step to learn more</p>
        </div>

        {/* The Map */}
        <div className="relative py-20 px-10 rounded-[3rem] bg-white/[0.01] border border-white/5 backdrop-blur-3xl overflow-hidden">
           
           {/* Static High-End Pipes */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
              <defs>
                 <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="white" />
                    <stop offset="100%" stopColor="transparent" />
                 </linearGradient>
              </defs>
              <path d="M 150 200 L 1250 200" stroke="url(#pipeGrad)" strokeWidth="1" strokeDasharray="5 5" />
           </svg>

           <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-10">
              <StageNode id="input" active={hoveredNode === 'input'} onHover={setHoveredNode} data={SIGNAL_DEEP_DIVE.input} />
              <StageNode id="generator" active={hoveredNode === 'generator'} onHover={setHoveredNode} data={SIGNAL_DEEP_DIVE.generator} />
              
              {/* Signal Grid */}
              <div className="p-4 rounded-[2.5rem] bg-white/[0.03] border border-white/10 grid grid-cols-2 gap-4">
                 {['s1', 's2', 's3', 's4'].map(sid => (
                    <div 
                      key={sid}
                      onMouseEnter={() => setHoveredNode(sid)}
                      className={`w-28 h-28 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-500 cursor-help ${
                        hoveredNode === sid ? 'bg-white border-white scale-105 shadow-2xl' : 'bg-black/40 border-white/5 opacity-40'
                      }`}
                    >
                       {(() => {
                         const Icon = SIGNAL_DEEP_DIVE[sid].icon
                         return <Icon size={24} className={hoveredNode === sid ? 'text-black' : 'text-zinc-600'} />
                       })()}
                       <span className={`text-[9px] font-black uppercase tracking-widest ${hoveredNode === sid ? 'text-black' : 'text-zinc-700'}`}>{sid.toUpperCase()}</span>
                    </div>
                 ))}
              </div>

              <StageNode id="verdict" active={hoveredNode === 'verdict'} onHover={setHoveredNode} data={SIGNAL_DEEP_DIVE.verdict} />
           </div>
        </div>

        {/* The Infographic Card (Updates on Hover) */}
        <div className="max-w-5xl mx-auto">
           <AnimatePresence mode="wait">
              <motion.div 
                key={hoveredNode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-16 rounded-[4rem] bg-white text-black relative overflow-hidden flex flex-col md:flex-row gap-16 items-center shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
              >
                 {/* Large Icon Background */}
                 <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
                    {(() => {
                      const Icon = SIGNAL_DEEP_DIVE[hoveredNode].icon
                      return <Icon size={400} />
                    })()}
                 </div>

                 <div className="flex-1 space-y-8 relative z-10">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-[2px] bg-black" />
                          <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold">Stage Explanation</span>
                       </div>
                       <h2 className="text-7xl font-black tracking-tighter uppercase leading-none font-['Space_Grotesk']">
                          {SIGNAL_DEEP_DIVE[hoveredNode].title}
                       </h2>
                    </div>

                    <p className="text-2xl font-medium leading-tight text-zinc-800 italic">
                       "{SIGNAL_DEEP_DIVE[hoveredNode].desc}"
                    </p>
                    
                    <div className="p-8 rounded-[2rem] bg-black/5 border border-black/5 flex gap-6 items-start">
                       <div className="p-3 rounded-xl bg-black text-white">
                          <Eye size={24} />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase tracking-widest">Why this matters?</h4>
                          <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                             {SIGNAL_DEEP_DIVE[hoveredNode].details}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="w-full md:w-80 shrink-0 relative z-10 flex flex-col items-center justify-center p-12 border-2 border-black rounded-[3rem]">
                    <div className="text-[120px] font-black leading-none font-mono tracking-tighter mb-4">
                       {hoveredNode === 'input' ? '01' : hoveredNode === 'generator' ? '02' : hoveredNode === 'verdict' ? '04' : '03'}
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.5em] text-center">Process Step</p>
                 </div>
              </motion.div>
           </AnimatePresence>
        </div>

        {/* Class Presentation Footer */}
        <div className="flex justify-center pt-10">
           <div className="px-8 py-4 rounded-full bg-white/[0.02] border border-white/5 flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <Terminal size={14} className="text-zinc-600" />
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Press S for Fullscreen System View</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                 Logic Visualization v4.2.1-RELEASE
              </div>
           </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}
