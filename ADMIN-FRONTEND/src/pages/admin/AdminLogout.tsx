import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const ParticleBg = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(134,239,172,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(134,239,172,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const FAREWELL_MESSAGES = [
  { title: "See you soon!", sub: "Your empire awaits your return." },
  { title: "Rest well!", sub: "The panel will be here when you're back." },
  { title: "Until next time!", sub: "Go touch some grass. You've earned it." },
  { title: "Stay legendary!", sub: "Every great admin needs a break." },
  { title: "Mission complete!", sub: "Your work today made a difference." },
];

const CountdownRing = ({ seconds, total }: { seconds: number; total: number }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = (seconds / total) * circ;

  return (
    <svg width="72" height="72" className="absolute inset-0 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
      <motion.circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke="#f87171"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - progress}
        transition={{ duration: 1, ease: 'linear' }}
      />
    </svg>
  );
};

export default function AdminLogoutPage() {
  const navigate = useNavigate();
  const COUNTDOWN = 5;
  const [seconds, setSeconds] = useState(COUNTDOWN);
  const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin';

  const farewell = FAREWELL_MESSAGES[Math.floor(Math.random() * FAREWELL_MESSAGES.length)];

  const fullText = `Goodbye, ${adminName}`;
  const [displayed, setDisplayed] = useState('');
  const [typeDone, setTypeDone] = useState(false);

  const sessionStart = sessionStorage.getItem('adminSessionStart');
  const sessionDuration = sessionStart
    ? Math.floor((Date.now() - parseInt(sessionStart)) / 60000)
    : null;

  useEffect(() => {
    if (!sessionStorage.getItem('adminSessionStart')) {
      sessionStorage.setItem('adminSessionStart', Date.now().toString());
    }

    let i = 0;
    const typeInterval = setInterval(() => {
      setDisplayed(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) { clearInterval(typeInterval); setTypeDone(true); }
    }, 65);

    const countInterval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(countInterval);
          handleLeave();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => { clearInterval(typeInterval); clearInterval(countInterval); };
  }, []);

  const handleLeave = () => {
    sessionStorage.removeItem('adminSessionStart');
    navigate('/admin/login');
  };

  const hour = new Date().getHours();
  const timeEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : hour < 21 ? '🌆' : '🌙';

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center relative overflow-hidden">
      <ParticleBg />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/2 rounded-full blur-3xl" />
      </div>

      {/* Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-400/40 to-transparent mb-px" />

        <div className="bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">SMM</span>
              <span className="text-red-400 font-black text-lg tracking-tight"> Admin</span>
            </div>
          </div>

          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ delay: 0.4, duration: 1.2, ease: 'easeInOut' }}
              className="text-5xl mb-5 inline-block"
            >
              👋
            </motion.div>

            <h2 className="text-white text-2xl font-black tracking-tight mb-1 min-h-[36px]">
              {displayed}
              {!typeDone && <span className="animate-pulse text-red-400">|</span>}
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 text-sm mb-2"
            >
              {farewell.sub}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-600 text-xs mb-6"
            >
              {timeEmoji} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </motion.p>

            {sessionDuration !== null && sessionDuration > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/3 border border-white/8 rounded-xl mb-6"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span className="text-gray-400 text-xs">
                  Session lasted <span className="text-white font-bold">{sessionDuration} min{sessionDuration !== 1 ? 's' : ''}</span>
                </span>
              </motion.div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-6" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-4"
            >
              {/* Countdown ring */}
              <div className="relative w-[72px] h-[72px] shrink-0 flex items-center justify-center">
                <CountdownRing seconds={seconds} total={COUNTDOWN} />
                <div className="text-center">
                  <span className="text-white text-xl font-black">{seconds}</span>
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={handleLeave}
                className="flex-1 py-4 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 font-black text-base rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <span>Back to Login</span>
                <motion.svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </motion.svg>
              </button>
            </motion.div>

            <p className="text-gray-700 text-[11px] mt-5">
              Redirecting automatically in {seconds} second{seconds !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mt-px" />

        <p className="text-center text-[11px] text-gray-700 mt-5">
          Your session has been securely terminated.
        </p>
      </motion.div>
    </div>
  );
}
