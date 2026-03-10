import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    User, Mail, Lock, Eye, EyeOff, Phone, MessageCircle,
    ArrowRight, AlertCircle, CheckCircle, Save
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import Loader1 from '../components/LoadingScreen2';

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchUserDetails = async () => {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token');

            if (urlToken) {
                sessionStorage.setItem('profileToken', urlToken);

                // Fetch user details from backend using token
                try {
                    const response = await fetch(`http://localhost:5000/api/auth/get-user-from-token?token=${urlToken}`);
                    const data = await response.json();

                    if (data.success) {
                        setFormData(prev => ({
                            ...prev,
                            email: data.email,
                            name: data.name || ''
                        }));
                        sessionStorage.setItem('googleUserEmail', data.email);
                        if (data.name) {
                            sessionStorage.setItem('googleUserName', data.name);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch user details:', error);
                    navigate('/signup');
                }
            } else {
                // Fallback to sessionStorage
                const profileToken = sessionStorage.getItem('profileToken');
                const userEmail = sessionStorage.getItem('googleUserEmail');
                const userName = sessionStorage.getItem('googleUserName');

                if (!profileToken) {
                    navigate('/signup');
                    return;
                }

                if (userEmail) {
                    setFormData(prev => ({ ...prev, email: userEmail }));
                }
                if (userName) {
                    setFormData(prev => ({ ...prev, name: userName }));
                }
            }
        };

        fetchUserDetails();
    }, [navigate]);

    // Password validation function
    const validatePassword = (pass: string) => {
        const errors = [];
        if (pass.length < 8) errors.push('At least 8 characters');
        if (!/[A-Z]/.test(pass)) errors.push('One uppercase letter');
        if (!/[a-z]/.test(pass)) errors.push('One lowercase letter');
        if (!/[0-9]/.test(pass)) errors.push('One number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('One special character');
        if (/\s/.test(pass)) errors.push('No spaces allowed');
        return errors;
    };

    useEffect(() => {
        if (formData.password) {
            setPasswordErrors(validatePassword(formData.password));
        } else {
            setPasswordErrors([]);
        }
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setMessageType('error');
            setMessage('Full name is required');
            return false;
        }

        if (!formData.phone.trim()) {
            setMessageType('error');
            setMessage('Phone number is required');
            return false;
        }

        if (!formData.whatsapp.trim()) {
            setMessageType('error');
            setMessage('WhatsApp number is required');
            return false;
        }

        if (!formData.password) {
            setMessageType('error');
            setMessage('Password is required');
            return false;
        }

        if (passwordErrors.length > 0) {
            setMessageType('error');
            setMessage('Please meet all password requirements');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessageType('error');
            setMessage('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setMessage('');

        const startTime = Date.now();

        try {
            const response = await fetch(`http://localhost:5000/api/auth/complete-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    whatsapp: formData.whatsapp,
                    password: formData.password
                })
            });

            const data = await response.json();

            // Calculate elapsed time
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 2000 - elapsedTime); // 2 second minimum

            if (response.ok && data.success) {
                setMessageType('success');
                setMessage('Profile completed successfully! Redirecting to dashboard...');

                // Clear session storage
                sessionStorage.removeItem('googleUserEmail');
                sessionStorage.removeItem('googleUserName');

                setTimeout(() => {
                    setLoading(false);
                    // Store token but DON'T dispatch event yet
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                    }
                    window.location.href = '/';
                }, remainingTime);

            } else {
                setMessageType('error');
                setMessage(data.message || 'Failed to complete profile');
                setLoading(false);
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Network error. Please try again.');
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
                className="w-full max-w-[600px] overflow-hidden shadow-2xl rounded-[2.5rem] m-4 border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950 relative"
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
                                <User className="h-10 w-10 text-brand" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                            Complete Your Profile
                        </h1>

                        <p className="text-zinc-500 dark:text-zinc-400">
                            Please provide additional information to complete your account setup
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    readOnly
                                    className="block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-not-allowed border-zinc-200 dark:border-zinc-700"
                                />
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                WhatsApp Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MessageCircle className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Create Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                    placeholder="••••••••"
                                    required
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
                            {formData.password && (
                                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Password must contain:
                                    </p>
                                    <ul className="space-y-1">
                                        <li className={`text-xs flex items-center ${formData.password.length >= 8 ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{formData.password.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                                        </li>
                                        <li className={`text-xs flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span> One uppercase letter
                                        </li>
                                        <li className={`text-xs flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{/[a-z]/.test(formData.password) ? '✓' : '○'}</span> One lowercase letter
                                        </li>
                                        <li className={`text-xs flex items-center ${/[0-9]/.test(formData.password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{/[0-9]/.test(formData.password) ? '✓' : '○'}</span> One number
                                        </li>
                                        <li className={`text-xs flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'}</span> One special character
                                        </li>
                                        <li className={`text-xs flex items-center ${!/\s/.test(formData.password) ? 'text-green-500' : 'text-zinc-500'}`}>
                                            <span className="mr-2">{!/\s/.test(formData.password) ? '✓' : '○'}</span> No spaces
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none border-zinc-200 dark:border-zinc-800"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                            )}
                        </div>

                        {/* Message Display */}
                        {message && (
                            <div className={`p-4 rounded-xl flex items-start space-x-3 ${messageType === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50'
                                    : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50'
                                }`}>
                                {messageType === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                )}
                                <p className={`text-sm ${messageType === 'success'
                                        ? 'text-green-800 dark:text-green-300'
                                        : 'text-red-800 dark:text-red-300'
                                    }`}>
                                    {message}
                                </p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Complete Profile'}
                            </button>
                        </div>
                    </form>

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

export default CompleteProfile;