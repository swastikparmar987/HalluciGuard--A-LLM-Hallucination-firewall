import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, Shield, Cpu, 
  Layers, Activity, Globe, Database, Save, 
  User, Bell, Lock, Sliders
} from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('firewall')
  const [config, setConfig] = useState({
    s1_weight: 0.2,
    s2_weight: 0.2,
    s3_weight: 0.2,
    s4_weight: 0.4,
    provider: 'gemini-pro',
    model: 'gemini-1.5-flash',
    enableSearch: true
  })

  useEffect(() => {
    const storedUser = localStorage.getItem('halluciguard_user')
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  const handleSave = () => {
    // In a real app, this would be an API call
    alert('Settings saved successfully!')
  }

  const avatarUrl = user ? `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}&backgroundColor=0a0a0a` : ''

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar bg-[#050505] text-[#e5e2e1]">
      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <div className="p-3 rounded-2xl bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20">
                  <SettingsIcon size={28} />
               </div>
               <div>
                  <h1 className="text-3xl font-black font-['Space_Grotesk'] uppercase tracking-tight">System <span className="text-[#F7931A]">Settings</span></h1>
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Configure your hallucination defense</p>
               </div>
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-3 px-8 py-3 bg-[#F7931A] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#F7931A]/10"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Tabs Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { id: 'firewall', label: 'Firewall Weights', icon: Shield },
              { id: 'model', label: 'AI Provider', icon: Cpu },
              { id: 'profile', label: 'My Account', icon: User },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-['Space_Grotesk'] ${
                  activeTab === tab.id ? 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={18} />
                <span className="uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Settings Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {activeTab === 'firewall' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Sliders size={20} className="text-[#F7931A]" />
                    <h3 className="text-lg font-bold uppercase tracking-tight text-white">Signal Importance</h3>
                  </div>
                  
                  <div className="space-y-8">
                    {[
                      { id: 's1', label: 'Consistency', icon: Layers },
                      { id: 's2', label: 'Certainty', icon: Activity },
                      { id: 's3', label: 'Fact Density', icon: Database },
                      { id: 's4', label: 'Web Check', icon: Globe },
                    ].map(signal => (
                      <div key={signal.id} className="space-y-3">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                               <signal.icon size={16} className="text-zinc-500" />
                               <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{signal.label}</span>
                            </div>
                            <span className="font-mono text-sm text-[#F7931A] font-bold">{(config[`${signal.id}_weight`] * 100).toFixed(0)}%</span>
                         </div>
                         <input 
                           type="range" min="0" max="1" step="0.05"
                           value={config[`${signal.id}_weight`]}
                           onChange={(e) => setConfig({...config, [`${signal.id}_weight`]: parseFloat(e.target.value)})}
                           className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#F7931A]"
                         />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'model' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Primary Engine</label>
                      <select 
                        value={config.provider}
                        onChange={(e) => setConfig({...config, provider: e.target.value})}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#F7931A] appearance-none"
                      >
                         <option value="gemini-pro">Google Gemini 1.5 (Cloud)</option>
                         <option value="ollama">Ollama (Local Inference)</option>
                         <option value="openai">OpenAI GPT-4o (Coming Soon)</option>
                      </select>
                   </div>

                   <div className="flex items-center justify-between p-6 rounded-2xl bg-[#F7931A]/5 border border-[#F7931A]/10 mt-8">
                      <div className="flex items-center gap-4">
                         <Globe size={24} className="text-[#F7931A]" />
                         <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">Enable Real-time Web Search</p>
                            <p className="text-[10px] text-zinc-500 font-mono">Used for Signal S4 (Web Check)</p>
                         </div>
                      </div>
                      <div 
                        onClick={() => setConfig({...config, enableSearch: !config.enableSearch})}
                        className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${config.enableSearch ? 'bg-[#F7931A]' : 'bg-zinc-800'}`}
                      >
                         <motion.div 
                           animate={{ x: config.enableSearch ? 24 : 4 }}
                           className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                         />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 flex flex-col items-center text-center space-y-6">
                    <div className="relative group">
                       <img 
                         src={avatarUrl}
                         alt="User Avatar"
                         className="w-32 h-32 rounded-full border-4 border-[#F7931A] bg-black shadow-2xl"
                       />
                       <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-mono text-white uppercase font-bold">Auto-Generated</span>
                       </div>
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white uppercase tracking-tight">{user?.name || 'User'}</h2>
                       <p className="text-sm font-mono text-zinc-500">{user?.email || 'user@halluciguard.ai'}</p>
                    </div>
                    <div className="w-full pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                          <p className="text-[8px] font-mono text-zinc-600 uppercase mb-1">Account Tier</p>
                          <p className="text-xs font-bold text-white uppercase">Advanced Beta</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                          <p className="text-[8px] font-mono text-zinc-600 uppercase mb-1">Security Score</p>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Excellent</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F7931A; }
      `}</style>
    </div>
  )
}
