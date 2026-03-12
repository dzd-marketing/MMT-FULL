import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, AlertCircle, CheckCircle, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Loader1 from '../components/LoadingScreen2'; // Adjust path as needed

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const API_URL = process.env.REACT_APP_API_URL || 'https://mmtsmmpanel.cyberservice.online/api';

    // Password validation function
    const validatePassword = (pass: string) => {
        const errors = [];
        if (pass.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(pass)) errors.push('At least one uppercase letter');
        if (!/[a-z]/.test(pass)) errors.push('At least one lowercase letter');
        if (!/[0-9]/.test(pass)) errors.push('At least one number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('At least one special character');
        if (/\s/.test(pass)) errors.push('No spaces allowed');
        return errors;
    };

    useEffect(() => {
        if (password) {
            setPasswordErrors(validatePassword(password));
        } else {
            setPasswordErrors([]);
        }
    }, [password]);

const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setMessageType('error');
        setMessage('Please enter your email');
        return;
    }

    setLoading(true);
    setMessage('');

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            setMessageType('success');
            setMessage('If this email exists in our system, you will receive a reset code.');
            
            // Store remaining attempts if provided
            if (data.attemptsRemaining !== undefined) {
                setAttemptsRemaining(data.attemptsRemaining);
            }
            
            if (data.token) {
                setResetToken(data.token);
                setStep(2);
                startResendTimer();
            }
        } else {
            setMessageType('error');
            setMessage(data.message || 'Failed to process request');
            
            // Handle rate limit error (429)
            if (response.status === 429) {
                setMessageType('error');
                setMessage('You have reached the maximum of 3 password reset attempts today. Please try again tomorrow.');
            }
        }
    } catch (error) {
        setMessageType('error');
        setMessage('Network error. Please try again.');
    } finally {
        setLoading(false);
    }
};

    const startResendTimer = () => {
        setTimeLeft(60);
        setCanResend(false);
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendCode = async () => {
        if (!canResend) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessageType('success');
                setMessage('New reset code sent!');
                if (data.token) {
                    setResetToken(data.token);
                }
                setCode(['', '', '', '', '', '']);
                startResendTimer();
            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to send reset code');
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        // Only allow single digit
        if (/^\d*$/.test(value) && value.length <= 1) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Auto-focus next input
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace to go to previous input
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        // Only allow digits and limit to 6 characters
        const digits = pastedData.replace(/\D/g, '').slice(0, 6);
        
        if (digits) {
            const newCode = [...code];
            for (let i = 0; i < digits.length; i++) {
                newCode[i] = digits[i];
            }
            setCode(newCode);
            
            // Focus the next empty input or last input
            const focusIndex = Math.min(digits.length, 5);
            inputRefs.current[focusIndex]?.focus();
        }
    };

    const handleVerifyCode = async () => {
        const enteredCode = code.join('');
        if (enteredCode.length !== 6) {
            setMessageType('error');
            setMessage('Please enter the 6-digit code');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, code: enteredCode })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessageType('success');
                setMessage('Code verified! Please set your new password.');
                setStep(3);
                setCode(['', '', '', '', '', '']);
            } else {
                setMessageType('error');
                setMessage(data.message || 'Invalid or expired code');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        // Validate password
        const errors = validatePassword(password);
        if (errors.length > 0) {
            setMessageType('error');
            setMessage('Please meet all password requirements');
            return;
        }

        if (password !== confirmPassword) {
            setMessageType('error');
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token: resetToken, 
                    password, 
                    confirmPassword 
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessageType('success');
                setMessage('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login?reset=success');
                }, 2000);
            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to reset password');
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Network error');
        } finally {
            setLoading(false);
        }
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
                                {step === 1 && <Mail className="h-10 w-10 text-brand" />}
                                {step === 2 && <KeyRound className="h-10 w-10 text-brand" />}
                                {step === 3 && <Lock className="h-10 w-10 text-brand" />}
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            {step === 1 && 'Forgot Password'}
                            {step === 2 && 'Enter Reset Code'}
                            {step === 3 && 'Create New Password'}
                        </h1>
                        
                        <p className="text-zinc-500 dark:text-zinc-400">
                            {step === 1 && 'Enter your email to receive a reset code'}
                            {step === 2 && `Enter the 6-digit code sent to your email`}
                            {step === 3 && 'Create a new strong password for your account'}
                        </p>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-start space-x-3 ${
                                    messageType === 'success' 
                                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50' 
                                        : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50'
                                }`}>
                                    {messageType === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
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
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                            >
                                <span>{loading ? 'Sending...' : 'Send Reset Code'}</span>
                                {!loading && <ArrowRight className="h-5 w-5" />}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm text-brand hover:underline">
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center">
                                    Enter 6-Digit Code
                                </label>
                                <div className="flex justify-center gap-2">
                                    {code.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            onPaste={handlePaste}
                                            className="w-12 h-12 text-center text-xl font-semibold border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                            inputMode="numeric"
                                            pattern="\d*"
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mt-2">
                                    Code expires in {timeLeft} seconds
                                </p>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-start space-x-3 ${
                                    messageType === 'success' 
                                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50' 
                                        : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50'
                                }`}>
                                    {messageType === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
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
                                onClick={handleVerifyCode}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Didn't receive code?{' '}
                                    {canResend ? (
                                        <button
                                            onClick={handleResendCode}
                                            disabled={loading}
                                            className="text-brand hover:underline font-medium disabled:opacity-50"
                                        >
                                            Resend
                                        </button>
                                    ) : (
                                        <span className="text-zinc-400">Resend in {timeLeft}s</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                
                                {/* Password requirements */}
                                {password && (
                                    <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                            Password must contain:
                                        </p>
                                        <ul className="space-y-1">
                                            <li className={`text-xs flex items-center ${password.length >= 8 ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                                            </li>
                                            <li className={`text-xs flex items-center ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{/[A-Z]/.test(password) ? '✓' : '○'}</span> One uppercase letter
                                            </li>
                                            <li className={`text-xs flex items-center ${/[a-z]/.test(password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{/[a-z]/.test(password) ? '✓' : '○'}</span> One lowercase letter
                                            </li>
                                            <li className={`text-xs flex items-center ${/[0-9]/.test(password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{/[0-9]/.test(password) ? '✓' : '○'}</span> One number
                                            </li>
                                            <li className={`text-xs flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'}</span> One special character
                                            </li>
                                            <li className={`text-xs flex items-center ${!/\s/.test(password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span className="mr-2">{!/\s/.test(password) ? '✓' : '○'}</span> No spaces
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                )}
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-start space-x-3 ${
                                    messageType === 'success' 
                                        ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50' 
                                        : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50'
                                }`}>
                                    {messageType === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
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
                                onClick={handleResetPassword}
                                disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
                                className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    )}

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

export default ForgotPassword;
