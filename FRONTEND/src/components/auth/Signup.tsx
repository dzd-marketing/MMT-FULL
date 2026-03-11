import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Mail, Lock, Eye, EyeOff, User, ArrowRight,
    AlertCircle, CheckCircle, Search, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import Loader1 from '../LoadingScreen2';
import {
    getCountries,
    getCountryCallingCode,
    isValidPhoneNumber,
    CountryCode
} from 'libphonenumber-js';

// ─── Country data ─────────────────────────────────────────────────────────────

const COUNTRY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

interface Country {
    code: CountryCode;
    name: string;
    dialCode: string;
    flag: string;
}

const ALL_COUNTRIES: Country[] = getCountries()
    .map(code => ({
        code,
        name: COUNTRY_NAMES.of(code) ?? code,
        dialCode: `+${getCountryCallingCode(code)}`,
        flag: code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = ALL_COUNTRIES.find(c => c.code === 'LK')!;

// ─── Inline PhoneField ────────────────────────────────────────────────────────

interface PhoneFieldProps {
    value: string;
    onChange: (e164: string) => void;
    country: Country;
    onCountryChange: (c: Country) => void;
    placeholder?: string;
    hasError?: boolean;
}

const PhoneField: React.FC<PhoneFieldProps> = ({
    value, onChange, country, onCountryChange, placeholder = 'Enter number', hasError
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [raw, setRaw] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    const filtered = search.trim()
        ? ALL_COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.dialCode.includes(search)
          )
        : ALL_COUNTRIES;

    const handleRawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/[^\d\s\-().+]/g, '');
        setRaw(input);
        onChange(`${country.dialCode}${input.replace(/\D/g, '')}`);
    };

    const handleCountrySelect = (c: Country) => {
        onCountryChange(c);
        setOpen(false);
        setSearch('');
        onChange(`${c.dialCode}${raw.replace(/\D/g, '')}`);
    };

    const borderClass = hasError
        ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400'
        : 'border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent';

    return (
        <div className="relative" ref={dropdownRef}>
            <div className={`flex items-center border rounded-xl bg-zinc-50 dark:bg-zinc-900 transition-all ${borderClass}`}>
                {/* Country button */}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex items-center gap-1.5 px-2.5 py-2.5 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-l-xl transition-colors shrink-0"
                >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{country.dialCode}</span>
                    <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Number input */}
                <input
                    type="tel"
                    value={raw}
                    onChange={handleRawChange}
                    placeholder={placeholder}
                    className="flex-1 px-2.5 py-2.5 bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder-zinc-400 min-w-0"
                />
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1.5 w-72 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search country..."
                                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 rounded-lg outline-none border border-zinc-200 dark:border-zinc-700 focus:border-brand focus:ring-1 focus:ring-brand"
                                />
                            </div>
                        </div>

                        {/* Country list */}
                        <ul className="max-h-52 overflow-y-auto py-1">
                            {filtered.length === 0 ? (
                                <li className="px-4 py-3 text-sm text-zinc-400 text-center">No countries found</li>
                            ) : filtered.map(c => (
                                <li key={c.code}>
                                    <button
                                        type="button"
                                        onClick={() => handleCountrySelect(c)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                                            c.code === country.code
                                                ? 'bg-brand/10 text-brand font-medium'
                                                : 'text-zinc-800 dark:text-zinc-200'
                                        }`}
                                    >
                                        <span className="text-base leading-none w-6 text-center">{c.flag}</span>
                                        <span className="flex-1 truncate">{c.name}</span>
                                        <span className="text-zinc-400 dark:text-zinc-500 text-xs shrink-0">{c.dialCode}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldErrors {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

// ─── Signup Component ─────────────────────────────────────────────────────────

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);
    const [phoneE164, setPhoneE164] = useState('');

    const [waCountry, setWaCountry] = useState<Country>(DEFAULT_COUNTRY);
    const [waE164, setWaE164] = useState('');

    // ── Password strength ────────────────────────────────────────────────────

    const checkPassword = (pass: string) => {
        const errs: string[] = [];
        if (pass.length < 8)                          errs.push('At least 8 characters');
        if (!/[A-Z]/.test(pass))                      errs.push('One uppercase letter');
        if (!/[a-z]/.test(pass))                      errs.push('One lowercase letter');
        if (!/[0-9]/.test(pass))                      errs.push('One number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass))    errs.push('One special character');
        if (/\s/.test(pass))                          errs.push('No spaces allowed');
        return errs;
    };

    useEffect(() => {
        setPasswordErrors(formData.password ? checkPassword(formData.password) : []);
    }, [formData.password]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof FieldErrors])
            setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    // ── Validation ───────────────────────────────────────────────────────────

    const validateForm = (): boolean => {
        const e: FieldErrors = {};

        if (!formData.name.trim())
            e.name = 'Full name is required';

        if (!formData.email)
            e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email))
            e.email = 'Email is invalid';

        if (!phoneE164 || phoneE164 === phoneCountry.dialCode)
            e.phone = 'Phone number is required';
        else if (!isValidPhoneNumber(phoneE164))
            e.phone = `Enter a valid ${phoneCountry.name} phone number`;

        if (!waE164 || waE164 === waCountry.dialCode)
            e.whatsapp = 'WhatsApp number is required';
        else if (!isValidPhoneNumber(waE164))
            e.whatsapp = `Enter a valid ${waCountry.name} WhatsApp number`;

        if (!formData.password)
            e.password = 'Password is required';
        else if (passwordErrors.length > 0)
            e.password = 'Please meet all password requirements';

        if (formData.password !== formData.confirmPassword)
            e.confirmPassword = 'Passwords do not match';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: phoneE164,        // E.164 e.g. "+94776121326"
                    whatsapp: waE164,        // E.164
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('Account created! Redirecting to verification...');
                window.dispatchEvent(new Event('auth-change'));

                // Store verification token so verify-email page can use it
                if (data.requiresVerification && data.token) {
                    sessionStorage.setItem('verificationToken', data.token);
                    sessionStorage.setItem('verificationEmail', formData.email);
                }

                setTimeout(() => {
                    setLoading(false);
                    navigate(data.requiresVerification ? '/verify-email' : '/dashboard');
                }, 1500);
            } else {
                // Map backend field errors directly onto inputs
                if (data.errors && typeof data.errors === 'object') {
                    setErrors(data.errors);
                } else {
                    setErrors({ general: data.message || 'Failed to create account. Please try again.' });
                }
                setLoading(false);
            }
        } catch {
            setErrors({ general: 'Network error. Please check your connection and try again.' });
            setLoading(false);
        }
    };

    const handleGoogleSignup = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        authService.googleLogin();
    };

    // ── UI helpers ───────────────────────────────────────────────────────────

    const FieldError = ({ error }: { error?: string }) =>
        error ? (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
            </p>
        ) : null;

    const inputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
            errors[field]
                ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                : 'border-zinc-200 dark:border-zinc-800 focus:ring-brand'
        }`;

    const pwClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
            errors[field]
                ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                : 'border-zinc-200 dark:border-zinc-800 focus:ring-brand'
        }`;

    // ── Render ───────────────────────────────────────────────────────────────

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
                className="w-full max-w-[1100px] flex shadow-2xl rounded-[2.5rem] m-4 border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950 relative"
                style={{ overflow: 'visible' }}
            >
                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
                        <Loader1 />
                    </div>
                )}

                {/* ── Left: Form ──────────────────────────────────────────── */}
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
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Create Account</h1>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Join Make Me Trend and start growing your business today.
                        </p>
                    </div>

                    {/* General error banner */}
                    <AnimatePresence>
                        {errors.general && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50"
                            >
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-red-800 dark:text-red-300">{errors.general}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success banner */}
                    <AnimatePresence>
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50"
                            >
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Username */}
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
                                    className={inputClass('name')}
                                    placeholder="John Doe"
                                />
                            </div>
                            <FieldError error={errors.name} />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-400" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputClass('email')}
                                    placeholder="name@company.com"
                                />
                            </div>
                            <FieldError error={errors.email} />
                        </div>

                        {/* Phone + WhatsApp side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <PhoneField
                                    value={phoneE164}
                                    onChange={v => {
                                        setPhoneE164(v);
                                        if (errors.phone) setErrors(p => ({ ...p, phone: undefined }));
                                    }}
                                    country={phoneCountry}
                                    onCountryChange={setPhoneCountry}
                                    placeholder="Phone number"
                                    hasError={!!errors.phone}
                                />
                                <FieldError error={errors.phone} />
                            </div>

                            {/* WhatsApp */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    WhatsApp Number <span className="text-red-500">*</span>
                                </label>
                                <PhoneField
                                    value={waE164}
                                    onChange={v => {
                                        setWaE164(v);
                                        if (errors.whatsapp) setErrors(p => ({ ...p, whatsapp: undefined }));
                                    }}
                                    country={waCountry}
                                    onCountryChange={setWaCountry}
                                    placeholder="WhatsApp number"
                                    hasError={!!errors.whatsapp}
                                />
                                <FieldError error={errors.whatsapp} />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Password <span className="text-red-500">*</span>
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
                                    className={pwClass('password')}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FieldError error={errors.password} />

                            {/* Live password checklist */}
                            {formData.password && (
                                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">Password must contain:</p>
                                    <ul className="space-y-1">
                                        {([
                                            ['At least 8 characters',    formData.password.length >= 8],
                                            ['One uppercase letter',     /[A-Z]/.test(formData.password)],
                                            ['One lowercase letter',     /[a-z]/.test(formData.password)],
                                            ['One number',               /[0-9]/.test(formData.password)],
                                            ['One special character',    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)],
                                            ['No spaces',                !/\s/.test(formData.password)],
                                        ] as [string, boolean][]).map(([label, met]) => (
                                            <li key={label} className={`text-xs flex items-center gap-1.5 ${met ? 'text-green-500' : 'text-zinc-500'}`}>
                                                <span>{met ? '✓' : '○'}</span>{label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Retype Password <span className="text-red-500">*</span>
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
                                    className={pwClass('confirmPassword')}
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FieldError error={errors.confirmPassword} />
                        </div>

                        {/* Terms */}
                        <div className="flex items-start">
                            <input
                                id="terms" name="terms" type="checkbox" required
                                className="h-4 w-4 text-brand focus:ring-brand border-zinc-300 rounded mt-0.5"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm text-zinc-700 dark:text-zinc-300">
                                I agree to the{' '}
                                <Link to="/terms" className="text-brand hover:underline">Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.
                            </label>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-3 px-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500">Or Sign Up With</span>
                        </div>
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogleSignup} type="button"
                        className="w-full py-3 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                        <span>Google</span>
                    </button>

                    <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Already Have An Account?{' '}
                        <Link to="/login" className="font-semibold text-brand hover:underline">Log In Now.</Link>
                    </p>

                    <div className="mt-12 pt-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-t border-zinc-100 dark:border-zinc-900">
                        <span>© 2025 Make Me Trend.</span>
                        <div className="space-x-4">
                            <Link to="/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                </div>

                {/* ── Right: Branding ──────────────────────────────────────── */}
                <div className="hidden lg:flex lg:w-1/2 bg-brand p-12 flex-col justify-center relative overflow-hidden rounded-r-[2.5rem]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                            Join the future of trend management.
                        </h2>
                        <p className="text-white/80 text-lg mb-12">
                            Create an account today and get access to powerful tools designed to help your business thrive.
                        </p>
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                            <img
                                src="https://picsum.photos/seed/signup/800/600"
                                alt="Signup Preview"
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

export default Signup;
