import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Cpu, AlertTriangle, Fingerprint, Eye, Activity, ShieldCheck, Shield, AlertCircle, MessageSquare, ChevronRight, Zap, Lock, Globe, Server, Network, Database } from 'lucide-react'
import heroShield from '../assets/hero_shield.png'
import threatMap from '../assets/threat_map.png'
import dataWaterfall from '../assets/data_waterfall.png'
import logoImg from '../assets/logo.png'

/* ── 1. Magnetic Button ── */
function MagneticButton({ children, className = "", onClick }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.button>
  );
}

/* ── 2. Stars Background ── */
function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5,
      opacity: Math.random(),
      speed: 0.05 + Math.random() * 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) star.y = canvas.height;
        star.opacity = 0.2 + Math.abs(Math.sin(Date.now() * 0.001 * star.speed)) * 0.8;
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />;
}

/* ── 3. Shooting Stars ── */
function ShootingStars() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substring(7);
      const startX = Math.random() * 100;
      const startY = Math.random() * 50;
      setStars(prev => [...prev, { id, startX, startY }]);
      setTimeout(() => setStars(prev => prev.filter(s => s.id !== id)), 2000);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(star => (
        <motion.div
          key={star.id}
          initial={{ x: `${star.startX}%`, y: `${star.startY}%`, opacity: 0, scale: 0 }}
          animate={{ x: `${star.startX + 20}%`, y: `${star.startY + 20}%`, opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute w-1 h-1 bg-white blur-[1px]"
        >
          <div className="absolute top-1/2 right-0 w-20 h-[1px] bg-gradient-to-l from-white to-transparent -translate-y-1/2 rotate-45" />
        </motion.div>
      ))}
    </div>
  );
}

/* ── 4. Connective Line ── */
function ConnectiveLine() {
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full z-0 hidden md:block">
      <div className="w-full h-full bg-white/[0.05]" />
      <motion.div 
        style={{ height }}
        className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-[#F7931A]/30 to-transparent shadow-[0_0_10px_rgba(247,147,26,0.5)]" 
      />
    </div>
  );
}

/* ── 5. Grid Overlay ── */
function GridOverlay() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" 
      style={{ 
        backgroundImage: `radial-gradient(circle, white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
        backgroundSize: '40px 40px, 40px 40px, 40px 40px'
      }} 
    />
  );
}

/* ── 6. Parallax Background Text ── */
function ParallaxText({ text, yOffset = 0, speed = 0.5, opacity = 0.03 }) {
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, [0, 5000], [0, -1000 * speed]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] flex items-center overflow-hidden whitespace-nowrap pt-[20vh]" style={{ top: yOffset }}>
      <motion.h1 
        style={{ x, opacity }}
        className="text-[30vw] font-black tracking-tighter text-white uppercase select-none outline-text"
      >
        {text} {text} {text}
      </motion.h1>
      <style>{`
        .outline-text {
          -webkit-text-stroke: 1px rgba(255,255,255,1);
          color: transparent;
        }
      `}</style>
    </div>
  );
}

/* ── 7. Spotlight Card ── */
function SpotlightCard({ children, className = "" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/5 transition-colors hover:bg-zinc-900/60 ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(247, 147, 26, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
}

/* ── 8. Cinematic Text Reveal ── */
function CinematicText({ text, className, delay = 0 }) {
  const words = text.split(" ");
  return (
    <div className={`flex flex-wrap justify-center gap-x-[0.2em] ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: delay + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {word.toLowerCase() === 'shield' || word.toLowerCase() === 'mistakes' || word.toLowerCase() === 'accurate' ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F7931A] to-[#EA580C] relative">
              {word}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: delay + 1.5, duration: 1 }}
                className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#F7931A]/50 to-transparent origin-left" 
              />
            </span>
          ) : (
            word
          )}
        </motion.span>
      ))}
    </div>
  );
}

/* ── 9. Counter Metric ── */
function CounterMetric({ value, label, prefix = "", suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const end = parseFloat(value);
      const duration = 2000;
      const stepTime = 20;
      const steps = duration / stepTime;
      const increment = end / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <div ref={ref} className="text-center group">
      <div className="font-mono text-4xl md:text-6xl font-black text-white mb-2 transition-transform group-hover:scale-110">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 group-hover:text-[#F7931A] transition-colors">
        {label}
      </div>
    </div>
  );
}

/* ── 10. Global Summary Section ── */
function TelemetrySection() {
  return (
    <section className="py-24 relative z-10 px-4 max-w-[1400px] mx-auto overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 pointer-events-none">
        <img src={threatMap} alt="History Map" className="w-full h-full object-cover filter saturate-0 hue-rotate-[15deg]" />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        <CounterMetric value="1248932" label="Answers Checked" suffix="+" />
        <CounterMetric value="42058" label="Lies Blocked" suffix="+" />
        <CounterMetric value="0.03" label="Check Speed" suffix="s" />
      </div>

      <div className="flex justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} viewport={{ margin: "-20%" }}
          className="relative group cursor-crosshair"
        >
          <div className="absolute inset-0 bg-[#F7931A]/10 blur-[100px] rounded-full group-hover:bg-[#F7931A]/20 transition-all duration-700" />
          <div className="relative border border-white/10 rounded-3xl bg-black/60 backdrop-blur-3xl p-1 overflow-hidden">
             <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-white/[0.02]">
               <Globe size={14} className="text-[#F7931A] animate-spin-slow" />
               <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">Live Activity Feed</span>
             </div>
             <div className="p-8 space-y-4 font-mono text-[11px] text-zinc-500">
                <div className="flex gap-4">
                  <span className="text-[#F7931A]">[20:42:11]</span>
                  <span className="text-emerald-400">VERIFIED:</span>
                  <span>Answer looks correct (Score 12.5)</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-[#F7931A]">[20:42:14]</span>
                  <span className="text-rose-500 font-bold">BLOCKED:</span>
                  <span>Incorrect info detected (Score 89.2) - AI was wrong!</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-[#F7931A]">[20:42:15]</span>
                  <span className="text-emerald-400">VERIFIED:</span>
                  <span>Answer looks correct (Score 05.1)</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── 11. Data Section ── */
function DataWaterfallSection() {
  return (
    <section className="h-[60vh] w-full relative flex items-center justify-center overflow-hidden border-y border-white/5 bg-black">
      <div className="absolute inset-0 opacity-20">
        <img src={dataWaterfall} alt="Data Check" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="relative z-10 text-center space-y-8 px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ margin: "-20%" }} className="space-y-4">
          <div className="inline-flex items-center gap-3 text-[#F7931A] font-mono text-xs font-bold tracking-[0.4em] uppercase">
            <Database size={16} /> Fact Checking
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white max-w-4xl mx-auto leading-[0.9]">
            We check the internet to find the <span className="italic font-serif">truth</span>.
          </h2>
        </motion.div>
      </div>
    </section>
  );
}

/* ── 12. How it works ── */
function ArchitectureSection() {
  return (
    <section className="py-24 relative z-10 px-4 max-w-[1400px] mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">How it works.</h2>
        <p className="text-zinc-500 text-lg font-light max-w-xl mx-auto">HalluciGuard sits between you and the AI to make sure the answers you get are correct.</p>
      </div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Globe className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="font-mono text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Users</div>
        </div>
        <motion.div animate={{ scaleX: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="h-[1px] w-24 bg-gradient-to-r from-zinc-800 via-white to-zinc-800 hidden lg:block" />
        <div className="relative group">
          <div className="absolute -inset-10 bg-[#F7931A]/10 blur-[60px] rounded-full group-hover:bg-[#F7931A]/20 transition-all duration-700" />
          <div className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[#F7931A] to-[#EA580C] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(247,147,26,0.3)] border border-white/20">
            <ShieldCheck className="w-12 h-12 text-white mb-2" />
            <div className="font-mono text-[8px] font-black text-black uppercase tracking-[0.2em]">GUARD</div>
          </div>
        </div>
        <motion.div animate={{ scaleX: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} className="h-[1px] w-24 bg-gradient-to-r from-zinc-800 via-white to-zinc-800 hidden lg:block" />
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Cpu className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="font-mono text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Any AI</div>
        </div>
      </div>
    </section>
  );
}

/* ── 13. Example UI ── */
function MockAppScreenshot({ type }) {
  const isDanger = type === 'danger'
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden flex flex-col relative w-full aspect-[4/3] md:aspect-video group">
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
      <div className="h-10 bg-[#111] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        <div className="mx-auto font-mono text-[10px] text-zinc-600 tracking-widest flex items-center gap-2">
          <Shield size={12} /> GUARD.EXE
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-hidden flex flex-col relative">
          <MockChatBubble isUser={true} text={isDanger ? "Who was the first emperor of the United States?" : "How does computer security work?"} />
          {isDanger ? (
             <MockChatBubble isUser={false} isBlocked={true} text="The first emperor was Joshua Norton..." />
          ) : (
             <MockChatBubble isUser={false} isBlocked={false} text="Security works by checking users and data..." />
          )}
        </div>
        <div className="w-[35%] min-w-[280px] hidden md:block border-l border-white/5 bg-[#0F0F0F] p-6 shrink-0 relative overflow-hidden">
          <MockReport type={type} />
        </div>
      </div>
    </div>
  )
}

function MockChatBubble({ isUser, text, isBlocked }) {
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
        isUser 
          ? 'bg-zinc-800 text-zinc-200 rounded-tr-sm' 
          : isBlocked 
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-tl-sm shadow-[0_0_20px_rgba(244,63,94,0.1)]'
            : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-sm'
      }`}>
        {isBlocked && (
          <div className="flex items-center gap-2 mb-2 text-rose-500 font-mono text-[9px] font-bold uppercase tracking-widest">
            <AlertCircle size={10} className="animate-pulse" /> Stopped Wrong Answer
          </div>
        )}
        {text}
      </div>
    </div>
  )
}

function MockReport({ type }) {
  const isDanger = type === 'danger'
  return (
    <div className="bg-black/50 border border-white/5 rounded-2xl p-4 w-full max-w-sm backdrop-blur-xl scale-90">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2 h-2 rounded-full ${isDanger ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Security Check</h3>
      </div>
      <div className="flex flex-col items-center">
         <span className={`font-mono text-2xl font-bold ${isDanger ? 'text-rose-500' : 'text-emerald-400'}`}>
           {isDanger ? 'High Risk' : 'Safe'}
         </span>
      </div>
    </div>
  )
}

/* ── 14. 3D Perspective Showcase ── */
function PerspectiveShowcase() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 40, mass: 0.5 });
  const rotateXSafe = useTransform(smoothProgress, [0.1, 0.4], [20, 0]);
  const rotateXDanger = useTransform(smoothProgress, [0.2, 0.5], [20, 0]);
  const scaleSafe = useTransform(smoothProgress, [0.1, 0.4], [0.9, 1]);
  const scaleDanger = useTransform(smoothProgress, [0.2, 0.5], [0.9, 1]);
  const opacitySafe = useTransform(smoothProgress, [0.1, 0.3], [0, 1]);
  const opacityDanger = useTransform(smoothProgress, [0.2, 0.4], [0, 1]);

  return (
    <section ref={containerRef} className="max-w-[1400px] mx-auto px-4 py-20 relative z-10 perspective-[2000px]">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-20%" }} className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">See the difference.</h2>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 perspective-[2000px]">
        <motion.div style={{ rotateX: rotateXSafe, scale: scaleSafe, opacity: opacitySafe, transformStyle: "preserve-3d" }} className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
            <ShieldCheck size={14} /> Verified Correct
          </div>
          <MockAppScreenshot type="safe" />
        </motion.div>
        <motion.div style={{ rotateX: rotateXDanger, scale: scaleDanger, opacity: opacityDanger, transformStyle: "preserve-3d" }} className="flex flex-col items-center lg:mt-24">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-rose-500/10 text-rose-500 font-mono text-xs font-bold uppercase tracking-widest border border-rose-500/20">
            <AlertTriangle size={14} /> Mistake Blocked
          </div>
          <MockAppScreenshot type="danger" />
        </motion.div>
      </div>
    </section>
  );
}

/* ── 15. Stacking Cards ── */
const signals = [
  { id: '01', title: 'Story Check', desc: 'We check the answer multiple times to see if it changes. If it changes, it might be wrong.', icon: Activity, color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
  { id: '02', title: 'Confidence Check', desc: 'We scan the AI answer to see if it sounds unsure or confused.', icon: Eye, color: 'text-amber-400', glow: 'bg-amber-500/10' },
  { id: '03', title: 'Facts Check', desc: 'We verify names, dates, and places to make sure they are real.', icon: Fingerprint, color: 'text-indigo-400', glow: 'bg-indigo-500/10' },
  { id: '04', title: 'Internet Search', desc: 'We search the web live to verify the AIs claims against real news and data.', icon: Globe, color: 'text-[#F7931A]', glow: 'bg-[#F7931A]/10' },
];

function StickyStackingSection() {
  return (
    <section className="relative w-full max-w-[1400px] mx-auto px-4 py-20">
      <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-24">
        <div className="lg:sticky lg:top-1/4 max-w-sm z-50">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-20%" }}>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">4 Signs of Truth.</h2>
            <p className="text-zinc-400 text-lg font-light leading-relaxed">
              Every AI answer goes through 4 different tests to make sure it is correct and not a hallucination.
            </p>
          </motion.div>
        </div>
        <div className="flex-1 w-full max-w-2xl relative flex flex-col gap-8">
          {signals.map((signal, index) => {
            const stickyTop = `calc(15vh + ${index * 20}px)`;
            return (
              <motion.div key={signal.id} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ margin: "-10%", once: true }} transition={{ duration: 0.6 }} className="sticky w-full rounded-3xl" style={{ top: stickyTop, zIndex: index + 10 }}>
                <div className="rounded-3xl bg-zinc-900/95 backdrop-blur-3xl border border-white/10 p-8 md:p-10 relative overflow-hidden group shadow-2xl">
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 transition-all duration-700 group-hover:scale-125 ${signal.glow}`} />
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${signal.color}`}><signal.icon size={32} /></div>
                    <span className="font-mono text-4xl font-black text-white/5">{signal.id}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight relative z-10">{signal.label || signal.title}</h3>
                  <p className="text-zinc-400 text-base md:text-lg leading-relaxed relative z-10 font-light">{signal.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 16. Marquee ── */
function InfiniteMarquee() {
  const phrases = [
    "TRUTH IN EVERY WORD",
    "TRUST YOUR AI",
    "NO MORE AI MISTAKES",
    "THE ULTIMATE SHIELD",
    "VERIFIED ANSWERS",
    "STAY ACCURATE",
    "REAL DATA ONLY",
  ];

  return (
    <div className="w-full overflow-hidden bg-[#050505] border-y border-white/5 py-8 flex relative">
      <motion.div 
        animate={{ x: [0, -1800] }} 
        transition={{ ease: "linear", duration: 30, repeat: Infinity }} 
        className="flex gap-24 whitespace-nowrap px-12"
      >
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-24 items-center">
            {phrases.map((phrase, idx) => (
              <div key={idx} className="flex items-center gap-6 group cursor-default">
                <span className="text-[#F7931A] text-xl">✦</span>
                <span className="font-bold text-lg md:text-xl tracking-[0.2em] text-white/40 group-hover:text-white transition-all duration-500">
                  {phrase}
                </span>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ══ HOMEPAGE ══ */
export default function HomePage() {
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 200])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <div className="w-full text-zinc-200 relative selection:bg-[#F7931A]/30 selection:text-[#F7931A] overflow-hidden bg-[#030303]">
      <GridOverlay />
      <StarsBackground />
      <ShootingStars />
      <ConnectiveLine />
      
      <ParallaxText text="SAFE AI" yOffset="10vh" speed={0.8} />
      <ParallaxText text="ACCURACY" yOffset="70vh" speed={0.4} opacity={0.02} />

      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120vw] h-[500px] bg-[#F7931A]/5 rounded-[100%] blur-[120px]" />
      </div>

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 px-4 z-10">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-8">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7931A] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#F7931A]"></span></span>
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-[#F7931A]">Shield is Active</span>
        </motion.div>
        <div className="relative">
          <motion.div style={{ y: y1, opacity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[800px] aspect-square pointer-events-none z-[-1]">
            <img src={heroShield} alt="Shield Core" className="w-full h-full object-contain opacity-20 mix-blend-screen" />
          </motion.div>
          <CinematicText text="Stop AI mistakes before they happen." className="text-[10vw] sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-center leading-[0.85] max-w-6xl mx-auto" />
        </div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-8 text-base md:text-xl text-zinc-400 max-w-2xl text-center font-light">
          We check every AI answer to make sure it is true. We stop, check, and block wrong info in real-time.
        </motion.p>
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <MagneticButton onClick={() => navigate('/chat')} className="px-8 py-4 rounded-xl bg-white text-black font-black text-xs tracking-widest uppercase hover:scale-105 transition-all">Start Chat</MagneticButton>
          <button onClick={() => navigate('/dashboard')} className="px-8 py-4 rounded-xl bg-zinc-900/50 border border-white/5 text-zinc-400 font-mono text-[9px] uppercase tracking-widest hover:text-white transition-all">View History</button>
        </div>
      </section>

      <InfiniteMarquee />
      <TelemetrySection />
      <PerspectiveShowcase />
      <DataWaterfallSection />
      <StickyStackingSection />
      <ArchitectureSection />

      {/* CTA */}
      <section className="py-40 relative flex items-center justify-center text-center px-4 z-10 border-t border-white/5 bg-[#050505]">
        <div className="relative z-10 max-w-4xl">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }}>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-12">Trust your AI <br/> every time.</h2>
            <MagneticButton onClick={() => navigate('/chat')} className="px-12 py-6 rounded-2xl bg-white text-black font-black text-lg tracking-widest shadow-[0_0_50px_rgba(255,255,255,0.2)]">Start Now</MagneticButton>
          </motion.div>
        </div>
      </section>
      
      <footer className="relative border-t border-white/5 bg-[#030303] pt-20 pb-8 px-6 md:px-10 z-10 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#F7931A]/40 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[80px] bg-[#F7931A]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pb-16 border-b border-white/5">
            
            {/* Brand Column */}
            <div className="md:col-span-1 space-y-5">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="HalluciGuard" className="w-10 h-10 rounded-xl object-cover shadow-[0_0_20px_rgba(247,147,26,0.2)]" />
                <span className="font-['Space_Grotesk'] font-black text-lg tracking-widest text-white uppercase">HalluciGuard</span>
              </div>
              <p className="text-[13px] text-zinc-500 leading-relaxed font-light">
                An AI hallucination firewall that checks, scores, and blocks incorrect LLM responses in real-time using a 4-signal defense pipeline.
              </p>
              <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-500/80 uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                System Operational
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-5">
              <h4 className="font-['Space_Grotesk'] text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Navigate</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Launch Chat', path: '/chat' },
                  { label: 'Query History', path: '/history' },
                  { label: 'Settings', path: '/settings' },
                  { label: 'How it Works', path: '/how-it-works' },
                  { label: 'Sign In', path: '/login' },
                ].map(link => (
                  <li key={link.path}>
                    <a onClick={() => navigate(link.path)} className="group flex items-center gap-2 text-[12px] text-zinc-600 hover:text-[#F7931A] cursor-pointer transition-colors font-mono">
                      <ChevronRight size={10} className="text-zinc-800 group-hover:text-[#F7931A] transition-colors" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Defense Signals */}
            <div className="space-y-5">
              <h4 className="font-['Space_Grotesk'] text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">4-Signal Pipeline</h4>
              <ul className="space-y-3">
                {[
                  { icon: Activity, label: 'Self-Consistency Check', color: '#F7931A' },
                  { icon: AlertTriangle, label: 'Confidence Calibration', color: '#ffdb3c' },
                  { icon: Cpu, label: 'Factual Grounding', color: '#22d3ee' },
                  { icon: Globe, label: 'Web Verification', color: '#a78bfa' },
                ].map(signal => (
                  <li key={signal.label} className="flex items-center gap-3 text-[12px] text-zinc-600 font-mono">
                    <signal.icon size={14} style={{ color: signal.color }} />
                    {signal.label}
                  </li>
                ))}
              </ul>
            </div>


          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.2em]">
              © 2026 HalluciGuard — AI Hallucination Firewall Project
            </div>
            <div className="flex items-center gap-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Shield size={12} className="text-[#F7931A]" />
                v2.4.0
              </span>
              <span className="text-zinc-800">|</span>
              <span>Made for Research & Education</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
