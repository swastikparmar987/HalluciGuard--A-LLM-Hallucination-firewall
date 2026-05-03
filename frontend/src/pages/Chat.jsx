import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, Loader2, Shield, Activity, Zap, Cpu, 
  Terminal, RefreshCw, Lock, Database, Server, Wifi, WifiOff,
  AlertTriangle, CheckCircle, BarChart3, Globe, BookOpen, Info,
  Settings, Menu, Layout, FileText, User, Plus, Search, ChevronDown
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts'
import PostCard from '../components/PostCard'
import HallucinationReport from '../components/HallucinationReport'
import { LLM_FACTS } from '../data/facts'

const API_BASE = '/api'

const ZONE_COLORS = {
  SAFE: '#F7931A',
  CAUTION: '#ffdb3c',
  BLOCKED: '#ff4444',
}



export default function Chat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [currentEval, setCurrentEval] = useState(null)
  const [stats, setStats] = useState(null)
  const [factIndex, setFactIndex] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (evaluating) {
      const factInterval = setInterval(() => {
        setFactIndex(prev => (prev + 1) % LLM_FACTS.length)
      }, 7000)
      return () => clearInterval(factInterval)
    }
  }, [evaluating])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, generating, evaluating])

  const fetchStats = async () => {
    try {
      const storedUser = localStorage.getItem('halluciguard_user')
      const userEmail = storedUser ? JSON.parse(storedUser).email : null
      
      const url = userEmail ? `${API_BASE}/stats?user_email=${encodeURIComponent(userEmail)}` : `${API_BASE}/stats`
      const statsRes = await fetch(url)
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (err) {
      console.error('Stats update error:', err)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const query = input.trim()
    if (!query || generating || evaluating) return

    setMessages(prev => [...prev, { id: Date.now(), text: query, isUser: true }])
    setInput('')
    setGenerating(true)
    setCurrentEval(null)

    try {
      const storedUser = localStorage.getItem('halluciguard_user')
      const userEmail = storedUser ? JSON.parse(storedUser).email : null

      // 1. Generate Response
      const genRes = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_email: userEmail }),
      })
      
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.detail || 'Generation failed')
      
      const responseText = genData.response
      const tempId = Date.now() + 1
      
      // Add un-evaluated response to chat
      setMessages(prev => [...prev, { id: tempId, text: responseText, isUser: false, isEvaluating: true }])
      
      setGenerating(false)
      setEvaluating(true)
      
      // 2. Evaluate Response
      const evalRes = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, response: responseText, user_email: userEmail }),
      })
      
      const evalData = await evalRes.json()
      if (!evalRes.ok) throw new Error(evalData.detail || 'Evaluation failed')
      
      // Update the existing message with evaluation data
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, evaluation: evalData.evaluation, isEvaluating: false } : msg
      ))
      setCurrentEval(evalData.evaluation)
      fetchStats()
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 2, 
        text: `Error: ${err.message}. Please try again.`, 
        isUser: false,
        isError: true 
      }])
    } finally {
      setGenerating(false)
      setEvaluating(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex justify-center pt-8 px-4 z-10">
        <div className="bg-[#131313] border border-[#353534] rounded-full px-6 py-2.5 font-mono text-[11px] text-[#F7931A]/80 flex items-center gap-3 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F7931A] animate-pulse shadow-[0_0_8px_#F7931A]"></span>
          Firewall Active. Monitoring stream...
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-64 custom-scrollbar">
        <div className="max-w-[800px] mx-auto space-y-10">
          
          {/* System Greeting */}
          <div className="flex justify-center mb-4">
          </div>

            {messages.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <Shield size={64} className="text-[#F7931A] mb-6 animate-pulse" />
                  <h3 className="text-2xl font-['Space_Grotesk'] font-bold mb-2">Secure Inference Gateway</h3>
                  <p className="text-sm max-w-sm">Every token is analyzed for consistency, grounding, and confidence before release.</p>
               </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <PostCard key={msg.id} message={msg} isUser={msg.isUser} />
              ))}
            </AnimatePresence>

            {generating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-lg bg-[#121212] border border-[#1f1f1f] text-zinc-400">
                <Loader2 size={16} className="animate-spin text-[#F7931A]" />
                <span className="font-mono text-[11px] uppercase tracking-widest">Generating Answer...</span>
              </motion.div>
            )}

            {evaluating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6 p-6 rounded-lg bg-[#121212] border border-[#1f1f1f] border-l-2 border-l-[#ffdb3c] glow-caution">
                <div className="flex items-center gap-4">
                  <RefreshCw size={20} className="text-[#ffdb3c] animate-spin" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-['Space_Grotesk'] font-bold text-[#ffdb3c] uppercase tracking-wider">Evaluation in Progress</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Running internet audit & pattern analysis...</p>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-[#0e0e0e] border border-[#1f1f1f] flex gap-4 items-start">
                  <div className="p-2 rounded bg-[#ffdb3c]/10 text-[#ffdb3c]">
                    <Info size={16} />
                  </div>
                  <div className="space-y-1 overflow-hidden min-h-[40px]">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Did you know?</p>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={factIndex}
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-xs text-[#F7931A] italic"
                      >
                        "{LLM_FACTS[factIndex]}"
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── STICKY INPUT Area ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-12 pb-8 px-4 md:px-8 pointer-events-none">
          <div className="max-w-[800px] mx-auto pointer-events-auto">
            
              <form onSubmit={handleSubmit} className="relative group">
                <div className="bg-[#080808] border border-[#1f1f1f] rounded-lg focus-within:border-[#F7931A] focus-within:shadow-[0_0_15px_rgba(247,147,26,0.15)] transition-all flex flex-col p-2">
                  <textarea 
                    className="w-full bg-transparent border-none text-[#e5e2e1] font-mono text-sm focus:ring-0 resize-none min-h-[60px] p-3 placeholder-[#353534]" 
                    placeholder="Enter prompt to test firewall..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    disabled={generating || evaluating}
                  />
                  <div className="flex justify-between items-center px-3 pb-1 pt-2 border-t border-white/[0.03]">
                    <div className="flex gap-4">
                      <button type="button" className="text-zinc-600 hover:text-[#F7931A] transition-colors"><Search size={16} /></button>
                      <button type="button" className="text-zinc-600 hover:text-[#F7931A] transition-colors"><Database size={16} /></button>
                    </div>
                    <button 
                      type="submit" 
                      disabled={generating || evaluating || !input.trim()}
                      className="bg-[#F7931A] text-black px-5 py-2 rounded-sm font-['Space_Grotesk'] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-30 active:scale-95"
                    >
                      Send
                      <Send size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </form>

            <div className="text-center mt-3 font-mono text-[10px] text-zinc-600 uppercase tracking-widest opacity-60">
              Firewall is actively monitoring and filtering outputs.
            </div>
          </div>
        </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #353534; }
        
        .glow-safe { box-shadow: 0 0 15px rgba(247, 147, 26, 0.05); }
        .glow-caution { box-shadow: 0 0 15px rgba(255, 219, 60, 0.05); }
        .glow-danger { box-shadow: 0 0 15px rgba(255, 68, 68, 0.05); }
      `}</style>
    </div>
  )
}

