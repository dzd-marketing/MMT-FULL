import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';

type AuthStep = 'login' | 'email-verify' | '2fa' | 'welcome';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Particle background ───────────────────────────────────────────────────
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
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(134,239,172,${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
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

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// ── OTP Input ─────────────────────────────────────────────────────────────
const OtpInput = ({ length = 6, value, onChange }: { length?: number; value: string; onChange: (v: string) => void }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Backspace') {
      const newVal = digits.map((d, idx) => idx === i ? '' : d).join('');
      onChange(newVal);
      if (i > 0) inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = char;
    const newVal = newDigits.join('');
    onChange(newVal);
    if (char && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)}
          onFocus={e => e.target.select()}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-white/5 text-white outline-none transition-all duration-200
            ${digit ? 'border-green-400 bg-green-400/10 shadow-[0_0_12px_rgba(74,222,128,0.3)]' : 'border-white/15 focus:border-green-400/70 focus:bg-white/8'}`}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────
const StepDots = ({ current }: { current: AuthStep }) => {
  const steps: AuthStep[] = ['login', 'email-verify', '2fa'];
  const labels = ['Login', 'Verify Email', '2FA'];
  const idx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
              ${i < idx ? 'bg-green-400 text-black' : i === idx ? 'bg-green-400/20 border-2 border-green-400 text-green-400' : 'bg-white/5 border border-white/15 text-gray-600'}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${i <= idx ? 'text-green-400' : 'text-gray-600'}`}>{labels[i]}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-px mb-4 transition-all duration-500 ${i < idx ? 'bg-green-400' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Login Step ────────────────────────────────────────────────────────────
const LoginStep = ({ onNext }: { onNext: (email: string, token: string) => void }) => {
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.username || !form.password) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/auth/login`, form);
      if (res.data.success) {
        onNext(form.email, res.data.tempToken);
      } else {
        setError(res.data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.4 }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Admin Access</h2>
        <p className="text-gray-500 text-sm">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="group">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@company.com"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-400/60 focus:bg-white/8 transition-all text-sm"
            />
          </div>
        </div>

        {/* Username */}
        <div className="group">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="superadmin"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-400/60 focus:bg-white/8 transition-all text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="group">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Password</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-green-400/60 focus:bg-white/8 transition-all text-sm"
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPass
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </motion.div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3.5 bg-green-400 hover:bg-green-300 disabled:bg-green-400/40 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm tracking-wide transition-all duration-200 shadow-[0_0_24px_rgba(74,222,128,0.25)] hover:shadow-[0_0_32px_rgba(74,222,128,0.4)] mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Verifying...
            </span>
          ) : 'Continue →'}
        </button>
      </form>
    </motion.div>
  );
};

// ── Email Verify Step ─────────────────────────────────────────────────────
const EmailVerifyStep = ({ email, tempToken, onNext, onBack }: { email: string; tempToken: string; onNext: (token: string) => void; onBack: () => void }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/auth/verify-email`, { code, tempToken });
      if (res.data.success) {
        onNext(res.data.tempToken);
      } else {
        setError(res.data.message || 'Invalid code');
        setCode('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(`${API_URL}/admin/auth/resend-email-code`, { tempToken });
      setResendCooldown(60);
      setError('');
    } catch {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleSubmit(new Event('submit') as any);
    }
  }, [code]);

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.4 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Check Your Email</h2>
        <p className="text-gray-500 text-sm">We sent a 6-digit code to</p>
        <p className="text-green-400 text-sm font-semibold mt-1">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 block text-center">Verification Code</label>
          <OtpInput value={code} onChange={setCode} />
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </motion.div>
        )}

        <button type="submit" disabled={loading || code.length < 6}
          className="w-full py-3.5 bg-green-400 hover:bg-green-300 disabled:bg-green-400/40 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm tracking-wide transition-all duration-200 shadow-[0_0_24px_rgba(74,222,128,0.25)] hover:shadow-[0_0_32px_rgba(74,222,128,0.4)]">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Verifying...
            </span>
          ) : 'Verify Code →'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center gap-1">
            ← Back to Login
          </button>
          <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || resending}
            className="text-xs text-gray-500 hover:text-green-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors">
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// ── 2FA Step ──────────────────────────────────────────────────────────────
const TwoFAStep = ({ tempToken, onSuccess, onBack }: { tempToken: string; onSuccess: (token: string) => void; onBack: () => void }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) { setError('Enter the 6-digit authenticator code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/admin/auth/verify-2fa`, { code, tempToken });
      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token);
        onSuccess(res.data.token);
      } else {
        setError(res.data.message || 'Invalid authenticator code');
        setCode('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '2FA verification failed');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.length === 6 && !loading) {
      handleSubmit(new Event('submit') as any);
    }
  }, [code]);

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.4 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-4 relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1" fill="#4ade80"/></svg>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="black"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Two-Factor Auth</h2>
        <p className="text-gray-500 text-sm">Open Google Authenticator and enter</p>
        <p className="text-gray-500 text-sm">the 6-digit code for this account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 block text-center">Authenticator Code</label>
          <OtpInput value={code} onChange={setCode} />
        </div>

        {/* Authenticator hint */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            The code refreshes every <span className="text-gray-300 font-semibold">30 seconds</span>. Make sure your device time is synced.
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </motion.div>
        )}

        <button type="submit" disabled={loading || code.length < 6}
          className="w-full py-3.5 bg-green-400 hover:bg-green-300 disabled:bg-green-400/40 disabled:cursor-not-allowed text-black font-black rounded-xl text-sm tracking-wide transition-all duration-200 shadow-[0_0_24px_rgba(74,222,128,0.25)] hover:shadow-[0_0_32px_rgba(74,222,128,0.4)]">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Authenticating...
            </span>
          ) : 'Access Dashboard →'}
        </button>

        <button type="button" onClick={onBack} className="w-full text-xs text-gray-500 hover:text-gray-300 transition-colors text-center">
          ← Back
        </button>
      </form>
    </motion.div>
  );
};



// ── Welcome Card ──────────────────────────────────────────────────────────
const WelcomeStep = ({ onEnter }: { onEnter: () => void }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const adminName = import.meta.env.VITE_ADMIN_NAME || 'Admin';

  // Typewriter effect for the welcome message
  const fullText = `Welcome back, ${adminName}`;
  const [displayed, setDisplayed] = useState('');
  const [typeDone, setTypeDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setTypeDone(true);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-4"
    >
      {/* Success checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.6, type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-full bg-green-400/10 border-2 border-green-400/40 flex items-center justify-center mx-auto mb-6 relative"
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-400/20"
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </motion.div>

      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-green-400/80 text-sm font-semibold tracking-widest uppercase mb-2"
      >
        {greeting} ☀️
      </motion.p>

      {/* Typewriter name */}
      <h2 className="text-white text-2xl font-black tracking-tight mb-1 min-h-[36px]">
        {displayed}
        {!typeDone && <span className="animate-pulse text-green-400">|</span>}
      </h2>

      {/* Access granted badge */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-400/8 border border-green-400/20 rounded-full mt-1 mb-8"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400/80 text-xs font-semibold tracking-wider">ACCESS GRANTED</span>
      </motion.div>

      {/* Info cards row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          { icon: '🛡️', label: 'Security', value: '3-Layer Auth' },
          { icon: '📅', label: 'Date', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
          { icon: '🕐', label: 'Time', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
        ].map((item, i) => (
          <div key={i} className="bg-white/3 border border-white/6 rounded-xl p-3">
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-white text-xs font-bold">{item.value}</div>
            <div className="text-gray-600 text-[10px] mt-0.5">{item.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-8" />

      {/* Let's Go button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onEnter}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 bg-green-400 hover:bg-green-300 text-black font-black text-base rounded-xl transition-all duration-200 shadow-lg shadow-green-400/20 flex items-center justify-center gap-3 group"
      >
        <span>Let's Go</span>
        <motion.svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </motion.svg>
      </motion.button>

      <p className="text-gray-600 text-[11px] mt-4">
        Session active for <span className="text-gray-500">8 hours</span>
      </p>
    </motion.div>
  );
};

// ── Background Audio ──────────────────────────────────────────────────────
const MUSIC_URL = 'https://res.cloudinary.com/dgb5a5fmm/video/upload/v1773157837/Pufino_-_Lucifer_freetouse.com_u8fmd1.mp3';

const useBackgroundAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.25; // 25% volume - subtle background music
    audioRef.current = audio;

    // Browsers block autoplay until first user interaction (click/keypress)
    const tryPlay = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => setStarted(true)).catch(() => {});
      }
    };
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('keydown', tryPlay, { once: true });

    return () => {
      audio.pause();
      audio.src = '';
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setMuted(m => !m);
    }
  };

  return { muted, toggleMute, started };
};

// ── Main Auth Page ────────────────────────────────────────────────────────
export default function AdminAuthPage() {
  const navigate = useNavigate();
  const { muted, toggleMute, started } = useBackgroundAudio();
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) navigate('/admin/dashboard');
  }, []);

  const handleLoginSuccess = (emailVal: string, token: string) => {
    setEmail(emailVal);
    setTempToken(token);
    setStep('email-verify');
  };

  const handleEmailVerified = (token: string) => {
    setTempToken(token);
    setStep('2fa');
  };

  const handleAuthSuccess = (_token: string) => {
    setStep('welcome');
  };

  const handleEnterDashboard = () => {
    // Record session start time for duration display on logout page
    sessionStorage.setItem('adminSessionStart', Date.now().toString());
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center relative overflow-hidden">
      <ParticleBg />

      {/* Music toggle button - fixed top right */}
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-green-400/30 transition-all duration-200 flex items-center justify-center group"
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" className="group-hover:stroke-green-400 transition-colors">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={started ? "#4ade80" : "#6b7280"} strokeWidth="2" className="transition-colors">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>

      {/* "Click anywhere to start music" hint - fades after interaction */}
      {!started && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <span className="text-[11px] text-gray-500">Click anywhere to start music</span>
          </div>
        </div>
      )}

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/3 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/2 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-green-400/60 to-transparent mb-px" />

        <div className="bg-[#0f0f0f]/90 backdrop-blur-2xl border border-white/8 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">SMM</span>
              <span className="text-green-400 font-black text-lg tracking-tight"> Admin</span>
            </div>
            <div className="px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded-md">
              <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Restricted</span>
            </div>
          </div>

          {step !== 'welcome' && <StepDots current={step} />}

          <AnimatePresence mode="wait">
            {step === 'login' && (
              <LoginStep key="login" onNext={handleLoginSuccess} />
            )}
            {step === 'email-verify' && (
              <EmailVerifyStep
                key="email-verify"
                email={email}
                tempToken={tempToken}
                onNext={handleEmailVerified}
                onBack={() => setStep('login')}
              />
            )}
            {step === '2fa' && (
              <TwoFAStep
                key="2fa"
                tempToken={tempToken}
                onSuccess={handleAuthSuccess}
                onBack={() => setStep('email-verify')}
              />
            )}
            {step === 'welcome' && (
              <WelcomeStep key="welcome" onEnter={handleEnterDashboard} />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom accent */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mt-px" />

        <p className="text-center text-[11px] text-gray-600 mt-6">
          Unauthorized access is monitored and logged.
          <br />All login attempts are recorded with IP and device info.
        </p>
      </motion.div>
    </div>
  );
}