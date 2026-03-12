import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import Loader1 from '../components/LoadingScreen2';

const EmailVerification: React.FC = () => {
    const navigate = useNavigate();
    const [verificationToken, setVerificationToken] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [initialCodeSent, setInitialCodeSent] = useState(false);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const API_URL = import.meta.env.VITE_API_URL;

useEffect(() => {
    const fetchUserDetails = async () => {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        
        if (urlToken) {
            setVerificationToken(urlToken);
            sessionStorage.setItem('verificationToken', urlToken);
            
            
            try {
                const response = await fetch(`${API_URL}/auth/get-user-from-token?token=${urlToken}`);
                const data = await response.json();
                
                if (data.success) {
                    sessionStorage.setItem('verificationEmail', data.email);
                    setMessageType('success');
                    setMessage('Verification code sent to your email!');
                }
            } catch (error) {
                console.error('Failed to fetch user details:', error);
            }
            
            setInitialCodeSent(true);
            return;
        }
        
      
        const token = sessionStorage.getItem('verificationToken');
        if (token) {
            setVerificationToken(token);
            setInitialCodeSent(true);
            setMessageType('success');
            setMessage('Verification code sent to your email!');
        } else {
            navigate('/signup');
        }
    };

    fetchUserDetails();
}, [navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const sendVerificationCode = async (token: string) => {
        try {
            const response = await authService.resendVerification(token);
            
            if (response.success) {
                setMessageType('success');
                setMessage('Verification code sent to your email!');
                setTimeLeft(60);
                setCanResend(false);
            } else {
                setMessageType('error');
                setMessage(response.message || 'Failed to send verification code');
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Failed to send verification code');
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split('');
            const newCode = [...verificationCode];
            pastedCode.forEach((char, i) => {
                if (i < 6) newCode[i] = char;
            });
            setVerificationCode(newCode);
            
            const lastFilledIndex = Math.min(pastedCode.length, 5);
            if (lastFilledIndex < 6) {
                inputRefs.current[lastFilledIndex]?.focus();
            }
        } else {
            if (/^\d*$/.test(value)) {
                const newCode = [...verificationCode];
                newCode[index] = value;
                setVerificationCode(newCode);

                if (value && index < 5) {
                    inputRefs.current[index + 1]?.focus();
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

const handleVerify = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6) {
        setMessageType('error');
        setMessage('Please enter the 6-digit verification code');
        return;
    }

    setLoading(true);
    setMessage('');
    
    const startTime = Date.now();

    try {
        const response = await fetch(`${API_URL}/auth/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken, code })
        });
        
        const data = await response.json();

        if (data.success) {
            setMessageType('success');
            setMessage('Email verified successfully! Please login to continue.');
            
   
            sessionStorage.removeItem('verificationToken');
            
        
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 2000 - elapsedTime);
            
  
            if (data.requiresProfileCompletion && data.profileToken) {
          
                sessionStorage.setItem('profileToken', data.profileToken);
                if (data.email) {
                    sessionStorage.setItem('googleUserEmail', data.email);
                }
                
                setTimeout(() => {
                    setLoading(false);
                    navigate('/complete-profile');
                }, remainingTime);
            } else {
               
                setTimeout(() => {
                    setLoading(false);
                    navigate('/login', { 
                        state: { 
                            message: 'Email verified successfully! Please login with your credentials.' 
                        } 
                    });
                }, remainingTime);
            }
        } else {
            setMessageType('error');
            setMessage(data.message || 'Invalid verification code');
            setVerificationCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setLoading(false);
        }
    } catch (error) {
        console.error('Verification error:', error);
        setMessageType('error');
        setMessage('Failed to verify code');
        setLoading(false);
    }
};

    const handleResend = async () => {
        if (!canResend || !verificationToken) return;
        
        setResending(true);
        await sendVerificationCode(verificationToken);
        setResending(false);
    };

    const handleRetry = async () => {
    if (!verificationToken) {
  
        authService.googleLogin();
        return;
    }
    
    setLoading(true);
    await sendVerificationCode(verificationToken);
    setLoading(false);
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
                className="w-full max-w-[500px] overflow-hidden shadow-2xl rounded-[2.5rem] m-4 border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950 relative"
            >
                    {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
            <Loader1 />
        </div>
    )}
                <div className="p-8 md:p-12">
                    <div className="mb-8 text-center">
                        <Link to="/">
                            <img 
                                src="https://res.cloudinary.com/dgb5a5fmm/image/upload/v1772526888/Adobe_Express_-_file_fftjzj.png" 
                                alt="Make Me Trend Logo" 
                                className="h-16 sm:h-20 w-auto object-contain mx-auto mb-6"
                                referrerPolicy="no-referrer"
                            />
                        </Link>
                        
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
                                <Mail className="h-10 w-10 text-brand" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Verify Your Email
                        </h1>
                        
                        <p className="text-zinc-500 dark:text-zinc-400">
                            We've sent a 6-digit verification code to your email.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center">
                                Enter Verification Code
                            </label>
                            <div className="flex justify-center gap-2 sm:gap-3 md:gap-4">
                                {verificationCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 text-center text-lg sm:text-xl md:text-2xl font-semibold border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                        inputMode="numeric"
                                        pattern="\d*"
                                    />
                                ))}
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl flex items-start space-x-3 ${
                                messageType === 'success' 
                                    ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50' 
                                    : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50'
                            }`}>
                                {messageType === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <p className={`text-sm ${
                                    messageType === 'success' 
                                        ? 'text-green-800 dark:text-green-300' 
                                        : 'text-red-800 dark:text-red-300'
                                }`}>
                                    {message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                        >
                            <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
                            {!loading && <ArrowRight className="h-5 w-5" />}
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Didn't receive the code?{' '}
                                {canResend ? (
                                    <button
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="text-brand hover:underline font-medium disabled:opacity-50"
                                    >
                                        {resending ? 'Sending...' : 'Resend Code'}
                                    </button>
                                ) : (
                                    <span className="text-zinc-400">
                                        Resend in {timeLeft}s
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Wrong email?{' '}
                                <Link to="/signup" className="text-brand hover:underline font-medium">
                                    Sign up again
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-zinc-900">
                        <span>© 2025 Make Me Trend.</span>
                        <div className="space-x-4">
                            <Link to="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EmailVerification;
