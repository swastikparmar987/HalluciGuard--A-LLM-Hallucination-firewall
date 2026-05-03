import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, XOctagon, Activity,
  RefreshCw, Server, Zap, Database, Search, Clock, ShieldAlert, Radio, Terminal
} from 'lucide-react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, Tooltip
} from 'recharts'

const API_BASE = '/api'

const ZONE_COLORS = {
  SAFE: '#F7931A',    // Orange
  CAUTION: '#ffdb3c', // Yellow
  BLOCKED: '#ff4444', // Red
}

// Custom Grid Pattern for background
const GridBackground = () => (
  <div className="absolute inset-0 pointer-events-none opacity-10">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F7931A" strokeWidth="0.5" strokeOpacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
)

function StatNode({ title, value, subtitle, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className="relative p-6 rounded-lg overflow-hidden group bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-md shadow-2xl"
    >
      {/* Animated glow background */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }}
      />
      <div className="absolute left-0 top-0 w-1 h-full shadow-[0_0_15px_currentColor]" style={{ backgroundColor: color, color: color }} />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className="p-2.5 rounded-md bg-black/60 border border-white/10 relative">
          <div className="absolute inset-0 rounded-md animate-pulse opacity-20" style={{ boxShadow: `0 0 15px ${color}` }} />
          <Icon size={20} style={{ color }} className="relative z-10" />
        </div>
        <div className="flex items-center gap-2">
           <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
           <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Active</span>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-['Space_Grotesk'] text-[10px] text-zinc-400 uppercase tracking-widest mb-2">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 font-mono tracking-tight">
            {value}
          </p>
          {subtitle && <span className="text-xs font-mono text-zinc-600 uppercase">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const storedUser = localStorage.getItem('halluciguard_user')
      const userEmail = storedUser ? JSON.parse(storedUser).email : null
      
      const statsUrl = userEmail ? `${API_BASE}/stats?user_email=${encodeURIComponent(userEmail)}` : `${API_BASE}/stats`
      const logsUrl = userEmail ? `${API_BASE}/logs?user_email=${encodeURIComponent(userEmail)}` : `${API_BASE}/logs`

      const [statsRes, logsRes] = await Promise.all([
        fetch(statsUrl),
        fetch(logsUrl),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (logsRes.ok) setLogs(await logsRes.json())
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to delete all your history? This cannot be undone.")) return;
    
    try {
      const storedUser = localStorage.getItem('halluciguard_user')
      const userEmail = storedUser ? JSON.parse(storedUser).email : null
      const url = userEmail ? `${API_BASE}/clear-logs?user_email=${encodeURIComponent(userEmail)}` : `${API_BASE}/clear-logs`
      
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        setLogs([])
        setStats(prev => ({ ...prev, total_queries: 0, total_blocked: 0, total_caution: 0, total_safe: 0 }))
      }
    } catch (err) {
      console.error('Clear history error:', err)
    }
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "halluciguard_history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  // Formatting Data
  const safeCount = stats?.total_safe || 0
  const totalCount = stats?.total_queries || 1
  const safetyPercent = ((safeCount / totalCount) * 100).toFixed(1)

  const filteredLogs = logs.filter(log => 
    log.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.zone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const radialData = stats ? [
    { name: 'Blocked', value: stats.total_blocked, fill: ZONE_COLORS.BLOCKED },
    { name: 'Caution', value: stats.total_caution, fill: ZONE_COLORS.CAUTION },
    { name: 'Safe', value: stats.total_safe, fill: ZONE_COLORS.SAFE },
  ].filter(d => d.value > 0) : []

  const timelineData = logs.slice().reverse().map((log, i) => ({ time: i + 1, score: log.final_score }))

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505]">
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#F7931A] animate-spin"></div>
          <Shield size={24} className="text-[#F7931A] animate-pulse" />
        </div>
        <p className="font-mono text-[10px] text-[#F7931A] uppercase tracking-widest animate-pulse">Initializing Core...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar bg-[#050505] text-[#e5e2e1] relative">
      <GridBackground />
      
      <div className="max-w-[1400px] mx-auto space-y-10 relative z-10">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-['Space_Grotesk'] font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-400 to-[#F7931A] uppercase tracking-wider drop-shadow-lg">
              History & Performance
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-1 uppercase tracking-widest">Activity Log & Accuracy Monitoring</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-5 py-2.5 bg-[#F7931A]/10 border border-[#F7931A]/30 rounded-full text-[10px] font-mono text-[#F7931A] hover:bg-[#F7931A]/20 transition-all shadow-[0_0_15px_rgba(247,147,26,0.15)] active:scale-95 group">
            <RefreshCw size={14} className="group-hover:animate-spin-slow" /> REFRESH DATA
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatNode delay={0.1} title="Total Questions" value={stats?.total_queries || 0} icon={Search} color="#F7931A" />
          <StatNode delay={0.2} title="Blocked Answers" value={stats?.total_blocked || 0} icon={XOctagon} color="#ff4444" />
          <StatNode delay={0.3} title="Warnings" value={stats?.total_caution || 0} icon={ShieldAlert} color="#ffdb3c" />
          <StatNode delay={0.4} title="Safety Score" value={`${safetyPercent}%`} icon={Activity} color="#F7931A" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Trend Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 p-6 rounded-xl bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-md relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F7931A]/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <Radio size={18} className="text-[#F7931A]" />
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-widest">Accuracy Trend</h3>
              </div>
              <div className="flex gap-4 items-center">
                 <div className="w-2 h-2 rounded-full bg-[#ff4444] shadow-[0_0_8px_#ff4444] animate-pulse" />
                 <span className="font-mono text-[9px] text-zinc-500 uppercase">Live Analysis</span>
              </div>
            </div>
            <div className="h-72 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(val) => `${val}%`} width={30} axisLine={false} tickLine={false} />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#F7931A" 
                    strokeWidth={3} 
                    fill="url(#glowGradient)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Radial Core */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl bg-[#0a0a0a]/80 border border-white/5 backdrop-blur-md relative flex flex-col shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <Database size={18} className="text-zinc-400" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-white uppercase tracking-widest">Result Mix</h3>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Answer Breakdown</p>
            
            <div className="flex-1 flex flex-col items-center justify-center relative my-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(247,147,26,0.05),transparent_70%)] pointer-events-none" />
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={10} data={radialData} startAngle={90} endAngle={-270}>
                    <PolarAngleAxis type="number" domain={[0, totalCount]} angleAxisId={0} tick={false} />
                    <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.02)' }} clockWise dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <Shield size={24} className="text-zinc-600 opacity-50" />
              </div>
            </div>

            <div className="space-y-3">
              {radialData.map(d => (
                <div key={d.name} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: d.fill, boxShadow: `0 0 8px ${d.fill}` }} />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: d.fill }}>{d.value}</span>
                </div>
              ))}
              {radialData.length === 0 && (
                <div className="text-center py-4 text-[10px] font-mono text-zinc-600 uppercase">Awaiting Data</div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Live Intercept Stream */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6 pt-4"
        >
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                 <Terminal size={20} className="text-[#F7931A]" />
                 <h2 className="text-xl font-['Space_Grotesk'] font-bold uppercase tracking-wider">Recent Checks</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                 {/* Search Bar */}
                 <div className="relative group min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#F7931A] transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="Search history..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/5 rounded-full py-2 pl-10 pr-4 text-[11px] font-mono focus:outline-none focus:border-[#F7931A]/40 transition-all"
                    />
                 </div>

                 {/* Export Button */}
                 <button 
                   onClick={handleExport}
                   className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[9px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                 >
                   <Database size={12} /> EXPORT JSON
                 </button>

                 {/* Clear Button */}
                 <button 
                   onClick={handleClearHistory}
                   className="flex items-center gap-2 px-4 py-2 bg-rose-500/5 border border-rose-500/20 rounded-full text-[9px] font-mono text-rose-500 hover:bg-rose-500/10 transition-all"
                 >
                   <XOctagon size={12} /> CLEAR ALL
                 </button>
              </div>
           </div>

           {filteredLogs.length === 0 ? (
             <div className="p-10 text-center border border-white/5 rounded-xl bg-[#0a0a0a]/80">
               <span className="font-mono text-zinc-600 uppercase text-xs">
                 {searchTerm ? `No results for "${searchTerm}"` : "No signals intercepted yet."}
               </span>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredLogs.slice(0, 20).map((log, index) => {
                    const color = ZONE_COLORS[log.zone] || ZONE_COLORS.SAFE
                    return (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative p-5 rounded-xl bg-[#0a0a0a]/90 border border-white/5 backdrop-blur-md overflow-hidden group hover:border-white/20 transition-all shadow-xl"
                      >
                         <div className="absolute left-0 top-0 w-1 h-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color: color }} />
                         
                         <div className="relative z-10 flex justify-between items-start mb-3">
                            <span className="px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-widest border shadow-lg" style={{ color, borderColor: color, backgroundColor: `${color}1A` }}>
                               {log.zone}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                               {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                         </div>
                         
                         <div className="relative z-10 space-y-3">
                            <p className="text-sm text-[#e5e2e1] font-['Inter'] leading-relaxed line-clamp-2">
                               "{log.query}"
                            </p>
                            
                            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                               <div className="flex gap-4">
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Risk Score</p>
                                    <p className="text-xs font-mono font-bold drop-shadow-md" style={{ color }}>{(log.final_score || 0).toFixed(0)}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">S3 Signal</p>
                                    <p className="text-xs font-mono font-bold text-zinc-400">{(log.s3_score || 0).toFixed(0)}</p>
                                 </div>
                               </div>
                               
                               <div className="text-[9px] font-mono text-zinc-500 max-w-[120px] lg:max-w-[180px] truncate" title={log.reasoning}>
                                 {(log.reasoning || "").split('|')[0]?.trim()}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
             </div>
           )}
        </motion.div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F7931A; }
        
        .animate-spin-slow {
           animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
