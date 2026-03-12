import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import authService from '../services/auth';

const GoogleAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const error = params.get('error');
            const requiresVerification = params.get('requiresVerification');

            if (error) {
                console.error('Google auth error:', error);
                navigate('/login?error=google_auth_failed');
                return;
            }

        
            if (requiresVerification === 'true' && token) {
                sessionStorage.setItem('verificationToken', token);
                navigate('/verify-email');
                return;
            }

            if (params.get('profile')) {
                const email = params.get('email');
                const name = params.get('name');
                if (email) {
                    sessionStorage.setItem('googleUserEmail', email);
                    sessionStorage.setItem('googleUserName', name || '');
                    navigate('/complete-profile');
                }
                return;
            }

            if (!token) {
                navigate('/login?error=no_token');
                return;
            }

            try {
           
                localStorage.setItem('token', token);
                
             
                window.dispatchEvent(new Event('auth-change'));
                const result = await authService.handleGoogleCallback(token);
                
                if (result.success) {
                   
                    navigate('/');
                } else {
                    navigate('/login?error=auth_failed');
                }
            } catch (error) {
                console.error('Google callback error:', error);
                navigate('/login?error=callback_failed');
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]"
        >
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                    Completing Google Sign In
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Please wait while we redirect you...
                </p>
            </div>
        </motion.div>
    );
};

export default GoogleAuthCallback;
