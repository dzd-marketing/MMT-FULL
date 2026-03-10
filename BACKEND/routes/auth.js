const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const emailService = require('../services/email.service');

module.exports = (pool) => {
    // Helper function to get real IP address
    const getRealIp = (req) => {
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIp = req.headers['x-real-ip'];

        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }
        if (realIp) {
            return realIp;
        }
        return req.ip || req.connection.remoteAddress || '0.0.0.0';
    };

    // Helper function to get user agent
    const getUserAgent = (req) => {
        return req.headers['user-agent'] || 'Unknown';
    };

    // Helper function to log login attempts
    const logLoginAttempt = async (email, req, success) => {
        try {
            const ipAddress = getRealIp(req);
            const userAgent = getUserAgent(req);

            await pool.execute(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [email || 'unknown', ipAddress, userAgent, success]
            );
        } catch (error) {
            console.error('Failed to log login attempt:', error);
        }
    };

    // Helper function to log signup attempts
    const logSignupAttempt = async (email, req, success, failureReason = null) => {
        try {
            const ipAddress = getRealIp(req);
            const userAgent = getUserAgent(req);

            await pool.execute(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [`SIGNUP: ${email || 'unknown'}${failureReason ? ` - ${failureReason}` : ''}`, ipAddress, userAgent, success]
            );
        } catch (error) {
            console.error('Failed to log signup attempt:', error);
        }
    };

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const fullName = profile.displayName;
            const googleId = profile.id;
            const profilePicture = profile.photos[0]?.value;

            const [existingUsers] = await pool.execute(
                'SELECT * FROM users WHERE email = ? OR google_id = ?',
                [email, googleId]
            );

            if (existingUsers.length > 0) {
                const user = existingUsers[0];

                if (!user.google_id) {
                    await pool.execute(
                        'UPDATE users SET google_id = ?, profile_picture = ? WHERE id = ?',
                        [googleId, profilePicture, user.id]
                    );
                }

                // Create token for existing user
                const token = jwt.sign(
                    { userId: user.id, email: user.email, name: user.full_name },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRE }
                );

                await logLoginAttempt(email, req, true);

                return done(null, { ...user, token, email_verified: user.email_verified });
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO users (full_name, email, google_id, profile_picture, email_verified, password, auth_provider) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [fullName, email, googleId, profilePicture, false, await bcrypt.hash(googleId + process.env.JWT_SECRET, 10), 'google']
                );

                const token = jwt.sign(
                    { userId: result.insertId, email: email, name: fullName },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRE }
                );

                const newUser = {
                    id: result.insertId,
                    full_name: fullName,
                    email: email,
                    profile_picture: profilePicture,
                    token,
                    email_verified: false
                };

                await logSignupAttempt(email, req, true, 'google_signup');

                return done(null, newUser);
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));

    // Test route
    router.get('/test', (req, res) => {
        res.json({
            success: true,
            message: 'Auth routes are working',
            timestamp: new Date().toISOString()
        });
    });

    // Signup Route
    router.post('/signup', [
        body('name').trim().notEmpty().withMessage('Full name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('phone').notEmpty().withMessage('Phone number is required'),
        body('whatsapp').notEmpty().withMessage('WhatsApp number is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ], async (req, res) => {
        try {
            const { name, email, phone, whatsapp, password } = req.body;

            await logSignupAttempt(email, req, false, 'attempt');

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                await logSignupAttempt(email, req, false, 'validation_failed');
                return res.status(400).json({
                    success: false,
                    errors: errors.array().reduce((acc, err) => {
                        acc[err.path] = err.msg;
                        return acc;
                    }, {})
                });
            }

            const [existingUsers] = await pool.execute(
                'SELECT id, email, full_name FROM users WHERE email = ? OR phone = ? OR full_name = ?',
                [email, phone, name] // Add name to the check
            );

            if (existingUsers.length > 0) {
                const existing = existingUsers[0];
                if (existing.email === email) {
                    await logSignupAttempt(email, req, false, 'email_exists');
                    return res.status(400).json({
                        success: false,
                        errors: { email: 'Email already registered' }
                    });
                }
                if (existing.phone === phone) {
                    await logSignupAttempt(email, req, false, 'phone_exists');
                    return res.status(400).json({
                        success: false,
                        errors: { phone: 'Phone number already registered' }
                    });
                }

                if (existing.full_name === name) {
                    await logSignupAttempt(email, req, false, 'name_exists');
                    return res.status(400).json({
                        success: false,
                        errors: { name: 'Full name already taken. Please choose another.' }
                    });
                }
            }

            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

            const [result] = await pool.execute(
                `INSERT INTO users (full_name, email, phone, whatsapp, password, auth_provider, email_verified) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, email, phone, whatsapp, hashedPassword, 'local', false]
            );


            // --- WALLET CREATION START ---
            await pool.execute(
                'INSERT INTO wallets (user_id, email, available_balance, spent_balance, total_history_balance) VALUES (?, ?, ?, ?, ?)',
                [result.insertId, email, 0.00, 0.00, 0.00]
            );
            // --- WALLET CREATION END ---

            const token = jwt.sign(
                { userId: result.insertId, email: email, name: name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            // Create user session
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await pool.execute(
                'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
                [result.insertId, token, getRealIp(req), getUserAgent(req), expiresAt]
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            // Generate verification token
            const tempToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 10);

            await pool.execute(
                'INSERT INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)',
                [email, tempToken, tokenExpiresAt]
            );

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            await pool.execute(
                'INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
                [email, verificationCode, tokenExpiresAt]
            );

            await emailService.sendVerificationCode(email, verificationCode);

            await logSignupAttempt(email, req, true, 'success');

            res.status(201).json({
                success: true,
                message: 'Account created successfully. Please verify your email.',
                requiresVerification: true,
                token: tempToken,
                user: {
                    id: result.insertId,
                    name: name,
                    email: email,
                    phone: phone,
                    whatsapp: whatsapp
                }
            });

        } catch (error) {
            console.error('Signup error:', error);
            await logSignupAttempt(req.body.email || 'unknown', req, false, 'server_error');
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again.'
            });
        }
    });

    // Login Route
    router.post('/login', [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ], async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().reduce((acc, err) => {
                        acc[err.path] = err.msg;
                        return acc;
                    }, {})
                });
            }

            const { email, password, rememberMe } = req.body;

            const [users] = await pool.execute(
                'SELECT id, full_name, email, phone, whatsapp, password, is_active, email_verified FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                await logLoginAttempt(email, req, false);
                return res.status(401).json({
                    success: false,
                    errors: {
                        email: 'Invalid email or password',
                        password: 'Invalid email or password'
                    }
                });
            }

            const user = users[0];

            if (!user.is_active) {
                await logLoginAttempt(email, req, false);
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }

            if (!user.password) {
                await logLoginAttempt(email, req, false);
                return res.status(401).json({
                    success: false,
                    errors: {
                        password: 'This account uses Google Sign-In. Please use the Google button to login.'
                    }
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                await logLoginAttempt(email, req, false);
                return res.status(401).json({
                    success: false,
                    errors: {
                        password: 'Invalid email or password'
                    }
                });
            }

            await logLoginAttempt(email, req, true);
            await pool.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            );

            const tokenExpiry = rememberMe ? process.env.JWT_REMEMBER_EXPIRE : process.env.JWT_EXPIRE;
            const token = jwt.sign(
                { userId: user.id, email: user.email, name: user.full_name },
                process.env.JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

            await pool.execute(
                'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
                [user.id, token, getRealIp(req), getUserAgent(req), expiresAt]
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
            });

            res.cookie('user', JSON.stringify({
                id: user.id,
                name: user.full_name,
                email: user.email
            }), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
            });

            if (!user.email_verified) {
                const tempToken = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Increase to 30 minutes

                // Check if there's an existing token and update it
                await pool.execute(
                    'DELETE FROM verification_tokens WHERE email = ? AND used = false',
                    [user.email]
                );

                await pool.execute(
                    'INSERT INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)',
                    [email, tempToken, expiresAt]
                );

                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

                    await pool.execute(
        'DELETE FROM email_verification_codes WHERE email = ? AND used = false',
        [user.email]
    );
    
    await pool.execute(
        'INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [user.email, verificationCode, expiresAt]
    );
                return res.json({
                    success: true,
                    requiresVerification: true,
                    token: tempToken,
                    message: 'Please verify your email first',
                    user: {
                        id: user.id,
                        name: user.full_name,
                        email: user.email,
                        email_verified: user.email_verified
                    }
                });
            }

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    whatsapp: user.whatsapp,
                    email_verified: user.email_verified
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            await logLoginAttempt(req.body.email || 'unknown', req, false);
            res.status(500).json({
                success: false,
                message: 'Internal server error. Please try again.'
            });
        }
    });

    // Google OAuth routes
    router.get('/google', (req, res, next) => {
        console.log('📌 Google auth route accessed');
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account'
        })(req, res, next);
    });

router.get('/google/callback', (req, res, next) => {
    console.log('📌 Google callback route accessed');
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
        session: false
    }, async (err, user, info) => {
        if (err) {
            console.error('Google auth error:', err);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
        }

                    // --- WALLET CHECK/CREATE FOR GOOGLE USER ---
            const [wallets] = await pool.execute('SELECT id FROM wallets WHERE user_id = ?', [user.id]);
            if (wallets.length === 0) {
                await pool.execute(
                    'INSERT INTO wallets (user_id, email, available_balance, spent_balance, total_history_balance) VALUES (?, ?, ?, ?, ?)',
                    [user.id, user.email, 0.00, 0.00, 0.00]
                );
            }
            // -------------------------------------------

        // 🔥 OPTIONAL: Invalidate all previous sessions for this user (security)
        await pool.execute(
            'UPDATE user_sessions SET is_valid = false WHERE user_id = ?',
            [user.id]
        );

        // 🔥 CREATE NEW SESSION FOR THIS LOGIN
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await pool.execute(
            'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
            [user.id, user.token, getRealIp(req), getUserAgent(req), expiresAt]
        );

        res.cookie('token', user.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.cookie('user', JSON.stringify({
            id: user.id,
            name: user.full_name,
            email: user.email
        }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Check if email needs verification
        if (!user.email_verified) {
            // Clean up any existing unused tokens for this email
            await pool.execute(
                'DELETE FROM verification_tokens WHERE email = ? AND used = false',
                [user.email]
            );
            
            await pool.execute(
                'DELETE FROM email_verification_codes WHERE email = ? AND used = false',
                [user.email]
            );

            const tempToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Increased to 30 minutes

            await pool.execute(
                'INSERT INTO verification_tokens (email, token, expires_at) VALUES (?, ?, ?)',
                [user.email, tempToken, expiresAt]
            );

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            await pool.execute(
                'INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
                [user.email, verificationCode, expiresAt]
            );

            await emailService.sendVerificationCode(user.email, verificationCode);

            // Pass email in URL for recovery
            return res.redirect(`${process.env.FRONTEND_URL}/verify-email?token=${tempToken}`);
        }

        // Check if user needs to complete profile (first time Google users)
        const [userDetails] = await pool.execute(
            'SELECT phone, whatsapp, full_name FROM users WHERE id = ?',
            [user.id]
        );

        const needsProfileCompletion = !userDetails[0].phone || !userDetails[0].whatsapp || !userDetails[0].full_name;

        if (needsProfileCompletion) {
            // Clean up any existing temp sessions
            await pool.execute(
                'DELETE FROM temp_user_sessions WHERE email = ? AND used = false',
                [user.email]
            );

            const profileToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 60); // Increased to 60 minutes

            await pool.execute(
                'INSERT INTO temp_user_sessions (email, name, token, expires_at) VALUES (?, ?, ?, ?)',
                [user.email, user.full_name || '', profileToken, expiresAt]
            );

            // Pass email and name in URL for recovery
            return res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${profileToken}`);
        }

        // User exists with complete profile - redirect to homepage with token
        res.redirect(`${process.env.FRONTEND_URL}/?token=${user.token}`);
    })(req, res, next);
});

router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Get user ID from token before invalidating
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
            
            // Clear user's cache
            cache.del(CACHE_KEYS.USER_PROFILE(decoded.userId));
            cache.del(CACHE_KEYS.USER_WALLET(decoded.userId));
            cache.del(CACHE_KEYS.USER_DATA(decoded.userId));
            
            await pool.execute(
                'UPDATE user_sessions SET is_valid = false WHERE token = ?',
                [token]
            );
        }

        res.clearCookie('token');
        res.clearCookie('user');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
});

// Verify Token Route - FIXED VERSION
router.get('/verify', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Step 1: Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            // Token invalid - clear it from frontend
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Step 2: Check if user exists and is active (MOST IMPORTANT)
        const [users] = await pool.execute(
            'SELECT id, full_name, email, phone, whatsapp, email_verified FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Step 3: Check session but DON'T fail if missing - recreate it
        const [sessions] = await pool.execute(
            'SELECT user_id, is_valid FROM user_sessions WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        // If session missing or invalid, create a new one automatically
        if (sessions.length === 0 || !sessions[0].is_valid) {
            console.log('🔄 Session missing but user valid - creating new session for user:', decoded.userId);
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            await pool.execute(
                'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
                [decoded.userId, token, getRealIp(req), getUserAgent(req), expiresAt]
            );
        }

        // Always return user data if JWT and user are valid
        res.json({
            success: true,
            user: {
                id: users[0].id,
                name: users[0].full_name,
                email: users[0].email,
                phone: users[0].phone,
                whatsapp: users[0].whatsapp,
                email_verified: users[0].email_verified
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

    // Send verification code
    router.post('/send-verification-code', async (req, res) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification token is required'
                });
            }

            const [tokenRecords] = await pool.execute(
                'SELECT email FROM verification_tokens WHERE token = ? AND expires_at > NOW() AND used = false',
                [token]
            );

            if (tokenRecords.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification session'
                });
            }

            const email = tokenRecords[0].email;

            const [users] = await pool.execute(
                'SELECT id, full_name, email_verified FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];

            if (user.email_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already verified'
                });
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await pool.execute(
                'INSERT INTO email_verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
                [email, verificationCode, expiresAt]
            );

            await emailService.sendVerificationCode(email, verificationCode);

            res.json({
                success: true,
                message: 'Verification code sent successfully'
            });

        } catch (error) {
            console.error('Send verification code error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send verification code'
            });
        }
    });

    // Verify code
    router.post('/verify-code', async (req, res) => {
        try {
            const { token, code } = req.body;

            const [tokens] = await pool.execute(
                'SELECT email FROM verification_tokens WHERE token = ? AND expires_at > NOW() AND used = false',
                [token]
            );

            if (tokens.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }

            const email = tokens[0].email;

            const [codes] = await pool.execute(
                'SELECT * FROM email_verification_codes WHERE email = ? AND code = ? AND expires_at > NOW() AND used = false',
                [email, code]
            );

            if (codes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid verification code'
                });
            }

            await pool.execute('UPDATE email_verification_codes SET used = true WHERE id = ?', [codes[0].id]);
            await pool.execute('UPDATE verification_tokens SET used = true WHERE token = ?', [token]);
            await pool.execute('UPDATE users SET email_verified = true WHERE email = ?', [email]);

            const [users] = await pool.execute(
                'SELECT id, full_name, email, phone, whatsapp FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];
            const needsProfileCompletion = !user.phone || !user.whatsapp || !user.full_name || user.full_name === '';

            if (needsProfileCompletion) {
                const profileToken = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 30);

                await pool.execute(
                    'INSERT INTO temp_user_sessions (email, name, token, expires_at) VALUES (?, ?, ?, ?)',
                    [user.email, user.full_name || '', profileToken, expiresAt]
                );

                return res.json({
                    success: true,
                    message: 'Email verified',
                    requiresProfileCompletion: true,
                    profileToken: profileToken,
                    email: user.email,
                    name: user.full_name
                });
            }

            res.json({ success: true, message: 'Email verified' });

        } catch (error) {
            console.error('Verify error:', error);
            res.status(500).json({ success: false, message: 'Verification failed' });
        }
    });

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check daily attempt limit
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        const [attempts] = await pool.execute(
            'SELECT COUNT(*) as count FROM password_reset_attempts WHERE email = ? AND attempted_at >= ? AND attempted_at < ?',
            [email, today, tomorrow]
        );

        if (attempts[0].count >= 3) {
            return res.status(429).json({
                success: false,
                message: 'Too many password reset attempts today. Please try again tomorrow.'
            });
        }

        // Log this attempt
        await pool.execute(
            'INSERT INTO password_reset_attempts (email, ip_address, user_agent) VALUES (?, ?, ?)',
            [email, getRealIp(req), getUserAgent(req)]
        );

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, full_name FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                message: 'If your email is registered, you will receive a reset code'
            });
        }

        const user = users[0];

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await pool.execute(
            'DELETE FROM password_resets WHERE email = ? AND used = false',
            [email]
        );

        await pool.execute(
            'INSERT INTO password_resets (email, code, token, expires_at) VALUES (?, ?, ?, ?)',
            [email, resetCode, resetToken, expiresAt]
        );

        await emailService.sendPasswordResetCode(email, user.full_name, resetCode);

        await pool.execute(
            'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
            [`PASSWORD_RESET_REQUEST: ${email}`, getRealIp(req), getUserAgent(req), true]
        );

        res.json({
            success: true,
            message: 'Reset code sent to your email',
            token: resetToken,
            attemptsRemaining: 2 - attempts[0].count // Send remaining attempts to frontend
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request'
        });
    }
});

    // Verify reset code
    router.post('/verify-reset-code', async (req, res) => {
        try {
            const { token, code } = req.body;

            if (!token || !code) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and code are required'
                });
            }

            const [resets] = await pool.execute(
                'SELECT * FROM password_resets WHERE token = ? AND code = ? AND expires_at > NOW() AND used = false',
                [token, code]
            );

            if (resets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset code'
                });
            }

            res.json({
                success: true,
                message: 'Code verified successfully',
                token: token
            });

        } catch (error) {
            console.error('Verify reset code error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify code'
            });
        }
    });

    // Get user from token
    router.get('/get-user-from-token', async (req, res) => {
        try {
            const { token } = req.query;

            const [sessions] = await pool.execute(
                'SELECT email, name FROM temp_user_sessions WHERE token = ? AND expires_at > NOW() AND used = false',
                [token]
            );

            if (sessions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }

            res.json({
                success: true,
                email: sessions[0].email,
                name: sessions[0].name
            });

        } catch (error) {
            console.error('Get user from token error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user details'
            });
        }
    });

    // Reset password
    router.post('/reset-password', [
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ], async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array().reduce((acc, err) => {
                        acc[err.path] = err.msg;
                        return acc;
                    }, {})
                });
            }

            const { token, password } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Reset token is required'
                });
            }

            const [resets] = await pool.execute(
                'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() AND used = false',
                [token]
            );

            if (resets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset session'
                });
            }

            const resetRecord = resets[0];
            const email = resetRecord.email;

            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

            await pool.execute(
                'UPDATE users SET password = ? WHERE email = ?',
                [hashedPassword, email]
            );

            await pool.execute(
                'UPDATE password_resets SET used = true WHERE id = ?',
                [resetRecord.id]
            );

            const [users] = await pool.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (users.length > 0) {
                await pool.execute(
                    'UPDATE user_sessions SET is_valid = false WHERE user_id = ?',
                    [users[0].id]
                );
            }

            await pool.execute(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [`PASSWORD_RESET_SUCCESS: ${email}`, getRealIp(req), getUserAgent(req), true]
            );

            res.json({
                success: true,
                message: 'Password reset successfully. You can now login with your new password.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    });

    // Complete profile for Google users
    router.post('/complete-profile', [
        body('name').trim().notEmpty().withMessage('Full name is required'),
        body('phone').notEmpty().withMessage('Phone number is required'),
        body('whatsapp').notEmpty().withMessage('WhatsApp number is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ], async (req, res) => {
        try {
            console.log('📝 Complete profile request received:', req.body);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log('Validation errors:', errors.array());
                return res.status(400).json({
                    success: false,
                    errors: errors.array().reduce((acc, err) => {
                        acc[err.path] = err.msg;
                        return acc;
                    }, {})
                });
            }

            const { email, name, phone, whatsapp, password } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const [users] = await pool.execute(
                'SELECT id, full_name FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                console.log('User not found:', email);
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];
            console.log('User found:', user);

            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

            const [updateResult] = await pool.execute(
                `UPDATE users 
                 SET full_name = ?, phone = ?, whatsapp = ?, password = ?, auth_provider = 'both' 
                 WHERE email = ?`,
                [name, phone, whatsapp, hashedPassword, email]
            );

            console.log('Update result:', updateResult);

            const [updatedUsers] = await pool.execute(
                'SELECT id, full_name, email, phone, whatsapp FROM users WHERE email = ?',
                [email]
            );

            const token = jwt.sign(
                { userId: updatedUsers[0].id, email: email, name: name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            // Create user session
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await pool.execute(
                'INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
                [updatedUsers[0].id, token, getRealIp(req), getUserAgent(req), expiresAt]
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.cookie('user', JSON.stringify({
                id: updatedUsers[0].id,
                name: updatedUsers[0].full_name,
                email: updatedUsers[0].email
            }), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const profileToken = req.headers['profile-token'] || req.body.profileToken;
            if (profileToken) {
                await pool.execute(
                    'UPDATE temp_user_sessions SET used = true WHERE token = ?',
                    [profileToken]
                );
            }

            await pool.execute(
                'INSERT INTO login_attempts (email, ip_address, user_agent, success) VALUES (?, ?, ?, ?)',
                [`PROFILE_COMPLETED: ${email}`, getRealIp(req), getUserAgent(req), true]
            );

            console.log('Profile completed successfully for:', email);

            res.json({
                success: true,
                message: 'Profile completed successfully',
                token,
                user: updatedUsers[0]
            });

        } catch (error) {
            console.error('❌ Complete profile error:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Failed to complete profile: ' + error.message
            });
        }
    });

    return router;
};