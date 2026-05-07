import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Cpu, Activity, Fingerprint, Globe, ShieldCheck, 
  AlertTriangle, Search, Shield, Code, Calculator, Sigma, Terminal
} from 'lucide-react'

// --- PIPELINE DATA ---
const steps = [
  {
    id: 1,
    title: "1. The User Query",
    desc: "A user asks the AI a question. In a normal system, the AI generates an answer and sends it back immediately. But with HalluciGuard, we intercept the request.",
    icon: Search,
    color: "text-blue-400",
    glow: "bg-blue-500/20"
  },
  {
    id: 2,
    title: "2. Initial Generation",
    desc: "The AI generates a raw draft answer. This draft is held in quarantine and NOT shown to the user yet.",
    icon: Cpu,
    color: "text-purple-400",
    glow: "bg-purple-500/20"
  },
  {
    id: 3,
    title: "3. The 4-Signal Scan",
    desc: "The firewall begins a parallel scan using 4 distinct detection signals to look for hallucinations and factual errors.",
    icon: Activity,
    color: "text-rose-400",
    glow: "bg-rose-500/20",
    subSteps: [
      { name: "Self-Consistency", icon: Activity, detail: "We ask the AI to re-answer the question multiple times. If the answers differ wildly, it's guessing." },
      { name: "Confidence Calibration", icon: AlertTriangle, detail: "We scan the text for words like 'I think', 'maybe', or 'possibly' which indicate low confidence." },
      { name: "Factual Grounding", icon: Fingerprint, detail: "We extract entities (people, places, dates) and check their density. High density usually means higher accuracy." },
      { name: "Web Verification", icon: Globe, detail: "We perform a live internet search to cross-reference the AI's claims against real-world data." }
    ]
  },
  {
    id: 4,
    title: "4. Scoring & Verdict",
    desc: "The signals are combined into a final Risk Score (0-100). Based on this score, the response is either marked SAFE, CAUTION, or BLOCKED.",
    icon: ShieldCheck,
    color: "text-[#F7931A]",
    glow: "bg-[#F7931A]/20"
  }
]

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' | 'deepdive'
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7931A]/10 text-[#F7931A] font-mono text-xs font-bold uppercase tracking-widest border border-[#F7931A]/20 mb-6">
            <Shield size={14} /> Documentation
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            How HalluciGuard Works
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Understand the firewall architecture. Choose the high-level pipeline view or dive deep into the mathematics and algorithms powering the engine.
          </p>
        </header>

        {/* TABS */}
        <div className="flex justify-center mb-12">
          <div className="bg-zinc-900/50 p-1.5 rounded-2xl inline-flex border border-white/5">
            <button 
              onClick={() => setActiveTab('pipeline')}
              className={`px-8 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all ${
                activeTab === 'pipeline' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Interactive Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('deepdive')}
              className={`px-8 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all ${
                activeTab === 'deepdive' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Technical Deep Dive
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* TAB 1: INTERACTIVE PIPELINE */}
          {/* ======================================================== */}
          {activeTab === 'pipeline' && (
            <motion.div 
              key="pipeline"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* LEFT: Step Controls */}
              <div className="lg:col-span-5 space-y-6">
                {steps.map((step) => {
                  const isActive = activeStep === step.id
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`w-full text-left transition-all duration-300 rounded-3xl p-6 border ${
                        isActive 
                          ? 'bg-zinc-900/80 border-white/20 shadow-2xl scale-[1.02]' 
                          : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 transition-colors ${
                          isActive ? step.glow : 'bg-white/5'
                        }`}>
                          <step.icon size={24} className={isActive ? step.color : 'text-zinc-500'} />
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                            {step.title}
                          </h3>
                          <p className={`text-sm leading-relaxed ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {step.desc}
                          </p>
                          
                          {isActive && step.subSteps && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-6 space-y-3"
                            >
                              {step.subSteps.map((sub, idx) => (
                                <div key={idx} className="flex gap-3 items-start bg-black/40 p-3 rounded-xl border border-white/5">
                                  <sub.icon size={16} className="text-[#F7931A] mt-0.5 shrink-0" />
                                  <div>
                                    <h4 className="text-sm font-bold text-zinc-300">{sub.name}</h4>
                                    <p className="text-xs text-zinc-500 mt-1">{sub.detail}</p>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* RIGHT: Visualizer */}
              <div className="lg:col-span-7 bg-zinc-900/30 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden min-h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
                  style={{ backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: '20px 20px' }} 
                />

                <AnimatePresence mode="wait">
                  {activeStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative z-10 flex flex-col items-center text-center max-w-sm"
                    >
                      <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                        <Search className="text-blue-400 w-10 h-10" />
                      </div>
                      <div className="bg-black/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                        <div className="text-xs font-mono text-zinc-500 mb-2 uppercase">User Input</div>
                        <div className="text-sm">"Who was the first emperor of the United States?"</div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative z-10 flex flex-col items-center w-full max-w-md"
                    >
                      <div className="w-full flex justify-between items-center mb-8 relative">
                         <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
                         <motion.div animate={{ left: ["0%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 w-4 h-0.5 bg-purple-500 -translate-y-1/2 z-10 shadow-[0_0_10px_#a855f7]" />
                         
                         <div className="relative z-20 bg-zinc-900 p-4 rounded-xl border border-white/10"><Cpu className="text-zinc-400" /></div>
                         <div className="relative z-20 bg-purple-500/20 p-4 rounded-xl border border-purple-500/30"><Shield className="text-purple-400" /></div>
                      </div>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl w-full">
                        <div className="text-xs font-mono text-rose-400 mb-2 uppercase flex items-center gap-2"><AlertTriangle size={14}/> Quarantined Draft</div>
                        <div className="text-sm text-zinc-300">"The first emperor of the United States was Emperor Norton I..."</div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative z-10 w-full max-w-md grid grid-cols-2 gap-4"
                    >
                      {[
                        { icon: Activity, title: "S1: Consistency", val: "Scanning..." },
                        { icon: AlertTriangle, title: "S2: Confidence", val: "Scanning..." },
                        { icon: Fingerprint, title: "S3: Facts", val: "Scanning..." },
                        { icon: Globe, title: "S4: Web", val: "Scanning..." }
                      ].map((s, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group"
                        >
                          <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} className="absolute inset-0 bg-[#F7931A]/10" />
                          <s.icon className="text-[#F7931A] mb-3" size={24} />
                          <div className="text-xs font-bold text-white mb-1">{s.title}</div>
                          <div className="text-[10px] font-mono text-zinc-500 uppercase">{s.val}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeStep === 4 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative z-10 flex flex-col items-center w-full"
                    >
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <motion.svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <motion.circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round"
                            initial={{ strokeDasharray: "0 251.2" }}
                            animate={{ strokeDasharray: "220 251.2" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </motion.svg>
                        <div className="text-center">
                          <div className="text-4xl font-black text-rose-500">89</div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Risk Score</div>
                        </div>
                      </div>
                      
                      <div className="mt-8 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-6 py-4 rounded-2xl flex items-center gap-4">
                        <ShieldCheck size={24} />
                        <div>
                          <div className="font-bold">Response BLOCKED</div>
                          <div className="text-xs opacity-80">Hallucination detected and prevented.</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TECHNICAL DEEP DIVE */}
          {/* ======================================================== */}
          {activeTab === 'deepdive' && (
            <motion.div 
              key="deepdive"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-24"
            >
              
              {/* Global Engine Math */}
              <section className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[2rem]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-zinc-800 rounded-xl"><Calculator className="text-[#F7931A]" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">The Global Scoring Engine</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                      The core engine runs 4 distinct mathematical signals in parallel using a thread pool. The raw scores are aggregated into a single continuous variable <strong>Final Score</strong> (0 to 100), where 0 is perfect truth and 100 is severe hallucination.
                    </p>
                    <div className="bg-black/50 border border-white/10 p-6 rounded-xl font-mono text-sm">
                      <div className="text-[#F7931A] mb-2 uppercase text-xs font-bold tracking-widest">Weighted Formula</div>
                      <div className="text-emerald-400">Score =</div>
                      <div className="ml-4 text-zinc-300">
                        (S1 * 0.25) + <br />
                        (S2 * 0.20) + <br />
                        (S3 * 0.25) + <br />
                        (S4 * 0.30)
                      </div>
                    </div>
                  </div>
                  <div>
                     <h3 className="text-white font-bold mb-4 font-mono uppercase tracking-widest text-xs">Risk Zones</h3>
                     <ul className="space-y-4">
                       <li className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                         <div><span className="text-emerald-400 font-bold">SAFE (0-35)</span> — Shown to user.</div>
                       </li>
                       <li className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
                         <div><span className="text-amber-400 font-bold">CAUTION (36-65)</span> — Shown with warning.</div>
                       </li>
                       <li className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                         <div><span className="text-rose-400 font-bold">BLOCKED (66-100)</span> — Response intercepted.</div>
                       </li>
                     </ul>
                     <div className="mt-6 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl text-xs text-rose-200">
                       <strong className="text-rose-400">Max Signal Sensitivity:</strong> If ANY individual signal scores &gt; 90, the entire response is automatically elevated to BLOCKED, overriding the average.
                     </div>
                  </div>
                </div>
              </section>

              {/* S1 */}
              <section className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[2rem]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-zinc-800 rounded-xl"><Sigma className="text-emerald-400" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">S1: TF-IDF Cosine Similarity</h2>
                </div>
                <div className="space-y-6 text-zinc-400 leading-relaxed">
                  <p>
                    <strong>Hypothesis:</strong> If an LLM is hallucinating, it is essentially "guessing" based on weak probabilistic weights. If asked the same question 3 times at high temperature, a guessing LLM will generate 3 highly divergent stories.
                  </p>
                  <p>
                    <strong>Mechanism:</strong> We use Scikit-Learn to convert the 3 responses into mathematical vectors using <strong>TF-IDF Vectorization</strong> (Term Frequency-Inverse Document Frequency). We then compute the <strong>Cosine Similarity matrix</strong> across all response pairs.
                  </p>
                  <div className="bg-black/50 border border-white/10 p-6 rounded-xl overflow-x-auto">
                    <pre className="font-mono text-sm text-emerald-300">
                      <code>{`# Calculate average pairwise similarity
total_sim = 0.0; count = 0
for i in range(n):
    for j in range(i + 1, n):
        total_sim += cosine_similarity_matrix[i][j]
        count += 1
avg_sim = total_sim / count

# Dynamic Score Curve (High Similarity = Low Score)
if avg_sim >= 0.95:   score = (1.0 - avg_sim) / 0.05 * 10
elif avg_sim >= 0.70: score = 10 + (0.95 - avg_sim) / 0.25 * 50
else:                 score = 60 + (0.70 - avg_sim) / 0.70 * 40`}</code>
                    </pre>
                  </div>
                </div>
              </section>

              {/* S2 */}
              <section className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[2rem]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-zinc-800 rounded-xl"><Code className="text-amber-400" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">S2: Confidence Calibration</h2>
                </div>
                <div className="space-y-6 text-zinc-400 leading-relaxed">
                  <p>
                    <strong>Mechanism:</strong> We scan the response using Regex for "Hedge Words"—language indicating low confidence. The words are categorized into severity tiers.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-xs font-mono text-rose-400 mb-2 font-bold">Tier 1 (15 pts)</div>
                      <div className="text-sm">"i'm not sure", "i don't know", "cannot confirm"</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-xs font-mono text-amber-400 mb-2 font-bold">Tier 2 (10 pts)</div>
                      <div className="text-sm">"probably", "i think", "might", "possibly"</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-xs font-mono text-yellow-400 mb-2 font-bold">Tier 3 (5 pts)</div>
                      <div className="text-sm">"around", "roughly", "estimated"</div>
                    </div>
                  </div>
                  <p>
                    The raw score is multiplied by a <strong>Density Multiplier</strong> `(100 / word_count)` to ensure that long responses aren't unfairly penalized simply because they contain more words.
                  </p>
                </div>
              </section>

              {/* S3 */}
              <section className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[2rem]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-zinc-800 rounded-xl"><Terminal className="text-indigo-400" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">S3: Factual Density Logic</h2>
                </div>
                <div className="space-y-6 text-zinc-400 leading-relaxed">
                  <p>
                    <strong>Mechanism:</strong> The engine uses Regex to extract hard factual entities (Dates, Percentages, Money, Large Numbers, Months).
                  </p>
                  <p>
                    It calculates <strong>Entity Density</strong> = `(entity_count / word_count)`.
                  </p>
                  <div className="bg-black/50 border border-indigo-500/20 p-6 rounded-xl border-l-4 border-l-indigo-500">
                    <h4 className="text-indigo-400 font-bold mb-2 font-mono text-sm uppercase">The S1 Amplifier Effect</h4>
                    <p className="text-sm text-zinc-300">
                      S3 listens to S1. If S1 indicates high divergence (meaning the AI is guessing), but S3 detects a high density of factual entities, the S3 score is <strong>multiplied by 2.0x</strong>. This represents the dangerous scenario where an AI is boldly making up specific numbers and dates.
                    </p>
                  </div>
                </div>
              </section>

              {/* OVERRIDE */}
              <section className="bg-rose-500/5 border border-rose-500/20 p-8 md:p-12 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="p-3 bg-rose-500/20 rounded-xl"><AlertTriangle className="text-rose-500" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">The "Confident Inconsistency" Override</h2>
                </div>
                <div className="space-y-6 text-zinc-300 leading-relaxed relative z-10">
                  <p>
                    A critical safety net built into the engine to catch the most dangerous type of hallucination: <strong>when the AI is completely confident, but factually wrong.</strong>
                  </p>
                  <p>
                    If the AI uses NO hedge words (S2 &lt; 15), the engine extracts factual entities (Dates, Cardinal numbers, Money) from all 3 parallel consistency responses using SpaCy NLP.
                  </p>
                  <p>
                    It calculates the <strong>Entity Overlap Ratio</strong> `(Intersection of Entities / Union of Entities)`. 
                    If the overlap is &lt; 0.3 (meaning the AI confidently stated completely different numbers/dates in each draft), the system forces a <strong>Dynamic Penalty</strong> that instantly forces the Final Score into the BLOCKED zone.
                  </p>
                </div>
              </section>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
