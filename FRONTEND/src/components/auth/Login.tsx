import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import authService from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import Loader1 from '../LoadingScreen2';


const Login: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);


  React.useEffect(() => {
    if (!lockedOut || lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(s => {
        if (s <= 1) { setLockedOut(false); clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedOut, lockoutSeconds]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    const startTime = Date.now();

    try {
      const rememberMe = (document.getElementById('remember-me') as HTMLInputElement)?.checked || false;

      const response = await authService.login({ email, password, rememberMe });

    
      if (response.tooManyAttempts) {
        setLoading(false);
        setLockedOut(true);
        setLockoutSeconds(15 * 60);
        setErrors({ general: 'Too many failed login attempts. Please wait 15 minutes and try again.' });
        return;
      }

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2000 - elapsed);

      setTimeout(() => {
        setLoading(false);

    
        if (response.requiresVerification || (response.user && !response.user.email_verified)) {
          sessionStorage.setItem('verificationToken', response.token || '');
          sessionStorage.setItem('verificationEmail', email);
          navigate('/verify-email');
          return;
        }

  
        if (response.requiresProfileCompletion) {
          navigate(`/complete-profile?token=${response.profileToken}`);
          return;
        }

        window.dispatchEvent(new Event('auth-change'));
        navigate('/dashboard');

      }, delay);

    } catch (error: any) {
      setLoading(false);
      if (error.tooManyAttempts || (error.response?.status === 429)) {
        setLockedOut(true);
        setLockoutSeconds(15 * 60);
        setErrors({ general: 'Too many failed login attempts. Please wait 15 minutes and try again.' });
      } else if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: error.message || 'Login failed. Please try again.' });
      }
    }
  };

  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505] transition-colors duration-300 pt-24 pb-12 relative overflow-hidden"
    >
  
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[1100px] flex overflow-hidden shadow-2xl rounded-[2.5rem] m-4 border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950 relative"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
            <Loader1 />
          </div>
        )}

     
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <Link to="/">
              <img
                src="https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png"
                alt="Make Me Trend Logo"
                className="h-16 sm:h-20 w-auto object-contain mb-8 -ml-2"
                referrerPolicy="no-referrer"
              />
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Enter your email and password to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

 
            {lockedOut && (
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  Account temporarily locked
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{formatCountdown(lockoutSeconds)}</span>
                </p>
              </div>
            )}

     
            {errors.general && !lockedOut && (
              <div className="p-4 rounded-xl flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50">
                <p className="text-sm text-red-800 dark:text-red-300">{errors.general}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none ${
                    errors.email ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-brand hover:underline">
                  Forgot Your Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                   setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none ${
                    errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-brand focus:ring-brand border-zinc-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300">
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || lockedOut}
              className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{lockedOut ? `Locked (${formatCountdown(lockoutSeconds)})` : 'Log In'}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500">Or Login With</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
            <span>Google</span>
          </button>

          <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't Have An Account?{' '}
            <Link to="/signup" className="font-semibold text-brand hover:underline">
              Register Now.
            </Link>
          </p>

          <div className="mt-12 pt-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-zinc-900">
            <span>© 2026 Make Me Trend.</span>
            <div className="space-x-4">
              <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Right Side: Image/Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Effortlessly manage your trend and operations.
            </h2>
            <p className="text-white/80 text-lg mb-12">
              Log in to access your dashboard and manage your growing business with ease.
            </p>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <img
                src="https://res.cloudinary.com/dgb5a5fmm/image/upload/v1773329807/social-media-influencer-design-concept-illustration_7087-1334_baafod.avif"
                alt="Dashboard Preview"
                className="rounded-lg shadow-inner"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
