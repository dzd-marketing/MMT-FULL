import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, Mail, Lock, Eye, EyeOff,
    AlertCircle, CheckCircle, Search, ChevronDown
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    parsePhoneNumber,
    isValidPhoneNumber,
    getCountries,
    getCountryCallingCode,
    AsYouType,
    CountryCode
} from 'libphonenumber-js';
import Loader1 from '../components/LoadingScreen2';

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
        flag: code
            .toUpperCase()
            .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = ALL_COUNTRIES.find(c => c.code === 'LK')!;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldErrors {
    name?: string;
    phone?: string;
    whatsapp?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

// ─── Custom Phone Input ───────────────────────────────────────────────────────

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

    // Close on outside click
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

    // Focus search when dropdown opens
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
        const full = `${country.dialCode}${input.replace(/\D/g, '')}`;
        onChange(full);
    };

    const handleCountrySelect = (c: Country) => {
        onCountryChange(c);
        setOpen(false);
        setSearch('');
        // Re-emit with new dial code
        const full = `${c.dialCode}${raw.replace(/\D/g, '')}`;
        onChange(full);
    };

    const borderClass = hasError
        ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400'
        : 'border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Input row */}
            <div className={`flex items-center border rounded-xl bg-zinc-50 dark:bg-zinc-900 transition-all overflow-visible ${borderClass}`}>
                {/* Country button */}
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className="flex items-center gap-2 px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-l-xl transition-colors shrink-0"
                >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">{country.dialCode}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {/* Number input */}
                <input
                    type="tel"
                    value={raw}
                    onChange={handleRawChange}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder-zinc-400 min-w-0"
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
                        {/* Search box */}
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
                        <ul className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
                            {filtered.length === 0 ? (
                                <li className="px-4 py-3 text-sm text-zinc-400 text-center">No countries found</li>
                            ) : (
                                filtered.map(c => (
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
                                ))
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface FormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '', email: '', password: '', confirmPassword: ''
    });

    // Phone state — country + raw E.164
    const [phoneCountry, setPhoneCountry] = useState<Country>(DEFAULT_COUNTRY);
    const [phoneE164, setPhoneE164] = useState('');

    const [waCountry, setWaCountry] = useState<Country>(DEFAULT_COUNTRY);
    const [waE164, setWaE164] = useState('');

    // ── Fetch user from token ────────────────────────────────────────────────

    useEffect(() => {
        const init = async () => {
            const params = new URLSearchParams(window.location.search);
            const urlToken = params.get('token');

            if (urlToken) {
                sessionStorage.setItem('profileToken', urlToken);
                try {
                    const res = await fetch(
                        `http://localhost:5000/api/auth/get-user-from-token?token=${urlToken}`
                    );
                    const data = await res.json();
                    if (data.success) {
                        setFormData(p => ({ ...p, email: data.email, name: data.name || '' }));
                        sessionStorage.setItem('googleUserEmail', data.email);
                        if (data.name) sessionStorage.setItem('googleUserName', data.name);
                    }
                } catch {
                    navigate('/signup');
                }
            } else {
                if (!sessionStorage.getItem('profileToken')) { navigate('/signup'); return; }
                const e = sessionStorage.getItem('googleUserEmail');
                const n = sessionStorage.getItem('googleUserName');
                if (e) setFormData(p => ({ ...p, email: e }));
                if (n) setFormData(p => ({ ...p, name: n }));
            }
        };
        init();
    }, [navigate]);

    // ── Password validation ──────────────────────────────────────────────────

    const validatePassword = (pass: string) => {
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
        setPasswordErrors(formData.password ? validatePassword(formData.password) : []);
    }, [formData.password]);

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
        if (fieldErrors[name as keyof FieldErrors])
            setFieldErrors(p => ({ ...p, [name]: undefined }));
    };

    // ── Validation ───────────────────────────────────────────────────────────

    const validateForm = (): boolean => {
        const errors: FieldErrors = {};

        if (!formData.name.trim()) errors.name = 'Full name is required';

        if (!phoneE164 || phoneE164 === phoneCountry.dialCode) {
            errors.phone = 'Phone number is required';
        } else if (!isValidPhoneNumber(phoneE164)) {
            errors.phone = `Enter a valid ${phoneCountry.name} phone number`;
        }

        if (!waE164 || waE164 === waCountry.dialCode) {
            errors.whatsapp = 'WhatsApp number is required';
        } else if (!isValidPhoneNumber(waE164)) {
            errors.whatsapp = `Enter a valid ${waCountry.name} WhatsApp number`;
        }

        if (!formData.password) errors.password = 'Password is required';
        else if (passwordErrors.length > 0) errors.password = 'Please meet all password requirements';

        if (formData.password !== formData.confirmPassword)
            errors.confirmPassword = 'Passwords do not match';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setFieldErrors({});
        setSuccessMessage('');
        const startTime = Date.now();

        try {
            const res = await fetch('http://localhost:5000/api/auth/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    phone: phoneE164,
                    whatsapp: waE164,
                    password: formData.password
                })
            });

            const data = await res.json();
            const delay = Math.max(0, 2000 - (Date.now() - startTime));

            if (res.ok && data.success) {
                setSuccessMessage('Profile completed! Redirecting to dashboard...');
                sessionStorage.removeItem('googleUserEmail');
                sessionStorage.removeItem('googleUserName');
                setTimeout(() => {
                    setLoading(false);
                    if (data.token) localStorage.setItem('token', data.token);
                    window.location.href = '/';
                }, delay);
            } else {
                if (data.errors && typeof data.errors === 'object') setFieldErrors(data.errors);
                else setFieldErrors({ general: data.message || 'Something went wrong. Please try again.' });
                setLoading(false);
            }
        } catch {
            setFieldErrors({ general: 'Network error. Please check your connection and try again.' });
            setLoading(false);
        }
    };

    // ── UI helpers ───────────────────────────────────────────────────────────

    const FieldError = ({ error }: { error?: string }) =>
        error ? (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
            </p>
        ) : null;

    const textInputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-3 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
            fieldErrors[field]
                ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
                : 'border-zinc-200 dark:border-zinc-800 focus:ring-brand'
        }`;

    const pwInputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-10 py-2.5 border rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
            fieldErrors[field]
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
                className="w-full max-w-[600px] shadow-2xl rounded-[2.5rem] m-4 border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-950 relative"
                style={{ overflow: 'visible' }}
            >
                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
                        <Loader1 />
                    </div>
                )}

                <div className="p-8 md:p-12">
                    {/* Header */}
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

                    {/* General error */}
                    <AnimatePresence>
                        {fieldErrors.general && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50"
                            >
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-red-800 dark:text-red-300">{fieldErrors.general}</p>
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
                                    className={textInputClass('name')}
                                    placeholder="John Doe"
                                />
                            </div>
                            <FieldError error={fieldErrors.name} />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <PhoneField
                                value={phoneE164}
                                onChange={v => {
                                    setPhoneE164(v);
                                    if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: undefined }));
                                }}
                                country={phoneCountry}
                                onCountryChange={setPhoneCountry}
                                placeholder="Enter phone number"
                                hasError={!!fieldErrors.phone}
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                                Click the flag to select your country
                            </p>
                            <FieldError error={fieldErrors.phone} />
                        </div>

                        {/* WhatsApp Number */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                WhatsApp Number <span className="text-red-500">*</span>
                            </label>
                            <PhoneField
                                value={waE164}
                                onChange={v => {
                                    setWaE164(v);
                                    if (fieldErrors.whatsapp) setFieldErrors(p => ({ ...p, whatsapp: undefined }));
                                }}
                                country={waCountry}
                                onCountryChange={setWaCountry}
                                placeholder="Enter WhatsApp number"
                                hasError={!!fieldErrors.whatsapp}
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                                Click the flag to select your country
                            </p>
                            <FieldError error={fieldErrors.whatsapp} />
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
                                    className={pwInputClass('password')}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FieldError error={fieldErrors.password} />

                            {formData.password && (
                                <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                        Password must contain:
                                    </p>
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
                                                <span>{met ? '✓' : '○'}</span> {label}
                                            </li>
                                        ))}
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
                                    className={pwInputClass('confirmPassword')}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(p => !p)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <FieldError error={fieldErrors.confirmPassword} />
                        </div>

                        {/* Submit */}
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
