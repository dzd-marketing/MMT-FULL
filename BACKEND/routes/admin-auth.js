
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

module.exports = (pool) => {

    const loginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        skipSuccessfulRequests: true,
        handler: (req, res) => {
            logAttempt(pool, req, '', false, 'login', 'IP rate limited');
            res.status(429).json({
                success: false,
                message: 'Too many requests from your IP. Please wait 15 minutes.',
                locked: true,
                retryAfter: 15 * 60
            });
        }
    });

    const otpLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: 'Too many requests from your IP. Please wait 15 minutes.',
                locked: true,
                retryAfter: 15 * 60
            });
        }
    });

    const ATTEMPT_LIMITS = {
        login:        { max: 5, lockMinutes: 30 },
        email_verify: { max: 5, lockMinutes: 30 },
        '2fa':        { max: 50, lockMinutes: 60 }
    };

    const checkAttempts = async (ip, type) => {
        const config = ATTEMPT_LIMITS[type];
        const windowStart = new Date(Date.now() - config.lockMinutes * 60 * 1000);

        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count, MAX(attempt_time) as last_attempt
            FROM admin_login_logs
            WHERE ip_address = ?
              AND attempt_type = ?
              AND success = 0
              AND attempt_time > ?
        `, [ip, type, windowStart]);

        const count = rows[0].count;
        const lastAttempt = rows[0].last_attempt;

        if (count >= config.max) {
            const lockExpires = new Date(new Date(lastAttempt).getTime() + config.lockMinutes * 60 * 1000);
            const retryAfter = Math.ceil((lockExpires - Date.now()) / 1000);
            return {
                allowed: false,
                attemptsLeft: 0,
                retryAfter: retryAfter > 0 ? retryAfter : 0,
                lockMinutes: config.lockMinutes
            };
        }

        return {
            allowed: true,
            attemptsLeft: config.max - count,
            retryAfter: 0
        };
    };

    const getIP = (req) =>
        req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.connection?.remoteAddress
        || req.ip
        || 'unknown';

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });


    const logAttempt = async (pool, req, email, success, type = 'login', errorMsg = null) => {
        try {
            const ip = getIP(req);
            const userAgent = req.headers['user-agent'] || 'unknown';
            await pool.execute(`
                INSERT INTO admin_login_logs
                    (email, ip_address, user_agent, success, attempt_type, error_message, attempt_time)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [email || '', ip, userAgent, success ? 1 : 0, type, errorMsg || null]);
        } catch (err) {
            console.error('Failed to log attempt:', err.message);
        }
    };

    const generateOTP = () => crypto.randomInt(100000, 999999).toString();

    const sendOTPEmail = async (toEmail, otp) => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;">
          <div style="max-width:480px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0f2a1a,#0a0a0a);padding:32px 40px;border-bottom:1px solid #222;">
              <span style="color:#fff;font-size:18px;font-weight:900;">SMM <span style="color:#4ade80;">Admin</span></span>
              <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Security Verification Required</p>
            </div>
            <div style="padding:32px 40px;">
              <p style="color:#9ca3af;font-size:13px;margin:0 0 24px;">Your one-time login code:</p>
              <div style="background:#0f0f0f;border:1px solid #4ade8030;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="color:#4ade80;font-size:40px;font-weight:900;letter-spacing:12px;">${otp}</span>
              </div>
              <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">Expires in <strong style="color:#9ca3af;">10 minutes</strong></p>
              <p style="color:#6b7280;font-size:12px;margin:0;">If you did not request this, your account may be under attack.</p>
            </div>
            <div style="padding:16px 40px;border-top:1px solid #1f1f1f;background:#0a0a0a;">
              <p style="color:#374151;font-size:11px;margin:0;text-align:center;">All admin access is monitored and logged.</p>
            </div>
          </div>
        </body>
        </html>`;

        await transporter.sendMail({
            from: `"SMM Admin Security" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `[${otp}] Admin Login Verification Code`,
            html
        });
    };

    const adminAuthMiddleware = async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);

            if (decoded.role !== 'admin' || decoded.step !== 'complete') {
                return res.status(403).json({ success: false, message: 'Invalid admin token' });
            }

            const [revoked] = await pool.execute(
                'SELECT id FROM admin_revoked_tokens WHERE token_jti = ?',
                [decoded.jti]
            );
            if (revoked.length > 0) {
                return res.status(401).json({ success: false, message: 'Token has been revoked' });
            }

            req.admin = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
            }
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
    };


    router.post('/login', loginLimiter, async (req, res) => {
        try {
            const ip = getIP(req);

            const attemptCheck = await checkAttempts(ip, 'login');
            if (!attemptCheck.allowed) {
                const mins = Math.ceil(attemptCheck.retryAfter / 60);
                return res.status(429).json({
                    success: false,
                    message: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
                    locked: true,
                    retryAfter: attemptCheck.retryAfter
                });
            }

            const { email, username, password } = req.body;

            if (!email || !username || !password) {
                return res.status(400).json({ success: false, message: 'All fields are required' });
            }

            if (typeof email !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
                return res.status(400).json({ success: false, message: 'Invalid input' });
            }

            const cleanEmail = email.trim().toLowerCase().slice(0, 255);
            const cleanUsername = username.trim().slice(0, 100);

            const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
            const adminUsername = process.env.ADMIN_USERNAME;
            const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

            if (!adminEmail || !adminUsername || !adminPasswordHash) {
                console.error('CRITICAL: Admin credentials not configured in .env');
                return res.status(500).json({ success: false, message: 'Server configuration error' });
            }

            const emailMatch = crypto.timingSafeEqual(
                Buffer.from(cleanEmail.padEnd(255)),
                Buffer.from(adminEmail.padEnd(255))
            );
            const usernameMatch = crypto.timingSafeEqual(
                Buffer.from(cleanUsername.padEnd(100)),
                Buffer.from(adminUsername.padEnd(100))
            );
            const passwordMatch = await bcrypt.compare(password, adminPasswordHash);

            if (!emailMatch || !usernameMatch || !passwordMatch) {
                await logAttempt(pool, req, cleanEmail, false, 'login', 'Invalid credentials');

                const afterCheck = await checkAttempts(ip, 'login');
                const attemptsLeft = afterCheck.attemptsLeft;

                let message = 'Invalid credentials';
                if (!afterCheck.allowed) {
                    message = 'Invalid credentials. Account locked for 30 minutes.';
                } else if (attemptsLeft === 1) {
                    message = 'Invalid credentials. Warning: 1 attempt left before 30-minute lockout.';
                } else if (attemptsLeft <= 2) {
                    message = `Invalid credentials. ${attemptsLeft} attempts remaining.`;
                }

                return res.status(401).json({ success: false, message, attemptsLeft });
            }

            const otp = generateOTP();
            const otpHash = await bcrypt.hash(otp, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await pool.execute(`
                INSERT INTO admin_otp_store (email, otp_hash, expires_at, used, created_at)
                VALUES (?, ?, ?, 0, NOW())
                ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), used = 0
            `, [cleanEmail, otpHash, expiresAt]);

            try {
                await sendOTPEmail(cleanEmail, otp);
            } catch (emailErr) {
                console.error('Email send failed:', emailErr.message);
                return res.status(500).json({ success: false, message: 'Failed to send verification email. Check SMTP config.' });
            }

            const tempToken = jwt.sign(
                { role: 'admin', step: 'email_verify', email: cleanEmail, jti: crypto.randomUUID() },
                process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            await logAttempt(pool, req, cleanEmail, true, 'login');

            res.json({ success: true, message: 'Verification code sent to your email', tempToken });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Login failed' });
        }
    });


    router.post('/verify-email', otpLimiter, async (req, res) => {
        try {
            const ip = getIP(req);

            const attemptCheck = await checkAttempts(ip, 'email_verify');
            if (!attemptCheck.allowed) {
                const mins = Math.ceil(attemptCheck.retryAfter / 60);
                return res.status(429).json({
                    success: false,
                    message: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
                    locked: true,
                    retryAfter: attemptCheck.retryAfter
                });
            }

            const { code, tempToken } = req.body;

            if (!code || !tempToken) {
                return res.status(400).json({ success: false, message: 'Code and token are required' });
            }

            let decoded;
            try {
                decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);
            } catch {
                return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
            }

            if (decoded.role !== 'admin' || decoded.step !== 'email_verify') {
                return res.status(401).json({ success: false, message: 'Invalid session step' });
            }

            const email = decoded.email;

            const [rows] = await pool.execute(`
                SELECT * FROM admin_otp_store
                WHERE email = ? AND used = 0 AND expires_at > NOW()
                ORDER BY created_at DESC LIMIT 1
            `, [email]);

            if (rows.length === 0) {
                await logAttempt(pool, req, email, false, 'email_verify', 'OTP expired or not found');
                return res.status(400).json({ success: false, message: 'Code expired or already used. Request a new one.' });
            }

            const otpMatch = await bcrypt.compare(code.trim(), rows[0].otp_hash);
            if (!otpMatch) {
                await logAttempt(pool, req, email, false, 'email_verify', 'Wrong OTP');

                const afterCheck = await checkAttempts(ip, 'email_verify');
                const attemptsLeft = afterCheck.attemptsLeft;

                let message = 'Invalid code. Please try again.';
                if (!afterCheck.allowed) {
                    message = 'Invalid code. Account locked for 30 minutes.';
                } else if (attemptsLeft === 1) {
                    message = 'Invalid code. Warning: 1 attempt left before 30-minute lockout.';
                } else if (attemptsLeft <= 2) {
                    message = `Invalid code. ${attemptsLeft} attempts remaining.`;
                }

                return res.status(400).json({ success: false, message, attemptsLeft });
            }

            await pool.execute('UPDATE admin_otp_store SET used = 1 WHERE id = ?', [rows[0].id]);

            const newTempToken = jwt.sign(
                { role: 'admin', step: '2fa', email, jti: crypto.randomUUID() },
                process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET,
                { expiresIn: '10m' }
            );

            await logAttempt(pool, req, email, true, 'email_verify');

            res.json({ success: true, message: 'Email verified. Enter your 2FA code.', tempToken: newTempToken });

        } catch (error) {
            console.error('Email verify error:', error);
            res.status(500).json({ success: false, message: 'Verification failed' });
        }
    });

    router.post('/resend-email-code', otpLimiter, async (req, res) => {
        try {
            const { tempToken } = req.body;

            let decoded;
            try {
                decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);
            } catch {
                return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
            }

            if (decoded.role !== 'admin' || decoded.step !== 'email_verify') {
                return res.status(401).json({ success: false, message: 'Invalid session' });
            }

            const [recent] = await pool.execute(`
                SELECT created_at FROM admin_otp_store
                WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
                ORDER BY created_at DESC LIMIT 1
            `, [decoded.email]);

            if (recent.length > 0) {
                return res.status(429).json({
                    success: false,
                    message: 'Please wait 60 seconds before requesting a new code'
                });
            }

            const otp = generateOTP();
            const otpHash = await bcrypt.hash(otp, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await pool.execute(`
                INSERT INTO admin_otp_store (email, otp_hash, expires_at, used, created_at)
                VALUES (?, ?, ?, 0, NOW())
                ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), used = 0, created_at = NOW()
            `, [decoded.email, otpHash, expiresAt]);

            await sendOTPEmail(decoded.email, otp);

            res.json({ success: true, message: 'New code sent to your email' });

        } catch (error) {
            console.error('Resend error:', error);
            res.status(500).json({ success: false, message: 'Failed to resend code' });
        }
    });


    router.post('/verify-2fa', otpLimiter, async (req, res) => {
        try {
            const ip = getIP(req);

            const attemptCheck = await checkAttempts(ip, '2fa');
            if (!attemptCheck.allowed) {
                const mins = Math.ceil(attemptCheck.retryAfter / 60);
                return res.status(429).json({
                    success: false,
                    message: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
                    locked: true,
                    retryAfter: attemptCheck.retryAfter
                });
            }

            const { code, tempToken } = req.body;

            if (!code || !tempToken) {
                return res.status(400).json({ success: false, message: 'Code and token are required' });
            }

            let decoded;
            try {
                decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);
            } catch {
                return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
            }

            if (decoded.role !== 'admin' || decoded.step !== '2fa') {
                return res.status(401).json({ success: false, message: 'Invalid session step' });
            }

            const totpSecret = process.env.TOTP_SECRET;
            if (!totpSecret) {
                console.error('CRITICAL: TOTP_SECRET not set in .env');
                return res.status(500).json({ success: false, message: 'Server configuration error' });
            }

            const isValid = speakeasy.totp.verify({
                secret: totpSecret,
                encoding: 'base32',
                token: code.trim(),
                window: 1
            });

            if (!isValid) {
                await logAttempt(pool, req, decoded.email, false, '2fa', 'Invalid TOTP code');

                const afterCheck = await checkAttempts(ip, '2fa');
                const attemptsLeft = afterCheck.attemptsLeft;

                let message = 'Invalid authenticator code. Make sure your device time is correct.';
                if (!afterCheck.allowed) {
                    message = 'Invalid code. Account locked for 60 minutes.';
                } else if (attemptsLeft === 1) {
                    message = 'Invalid code. Warning: 1 attempt left before 60-minute lockout.';
                } else if (attemptsLeft <= 2) {
                    message = `Invalid code. ${attemptsLeft} attempts remaining before lockout.`;
                }

                return res.status(400).json({ success: false, message, attemptsLeft });
            }

            const cleanCode = code.trim();
            const [alreadyUsed] = await pool.execute(
                'SELECT id FROM admin_used_totp WHERE code = ?',
                [cleanCode]
            );
            if (alreadyUsed.length > 0) {
                await logAttempt(pool, req, decoded.email, false, '2fa', 'Replayed TOTP code');
                return res.status(400).json({ success: false, message: 'This code has already been used. Wait for the next code.' });
            }

            await pool.execute('INSERT INTO admin_used_totp (code, used_at) VALUES (?, NOW())', [cleanCode]);
            await pool.execute('DELETE FROM admin_used_totp WHERE used_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)');

            const jti = crypto.randomUUID();
            const adminToken = jwt.sign(
                { role: 'admin', step: 'complete', email: decoded.email, jti },
                process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            await pool.execute(`
                INSERT INTO admin_sessions (jti, email, ip_address, user_agent, created_at, expires_at)
                VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR))
            `, [jti, decoded.email, ip, req.headers['user-agent'] || 'unknown']);

            await logAttempt(pool, req, decoded.email, true, '2fa');

            res.json({ success: true, message: 'Authentication successful', token: adminToken });

        } catch (error) {
            console.error('2FA verify error:', error);
            res.status(500).json({ success: false, message: '2FA verification failed' });
        }
    });

    router.post('/logout', adminAuthMiddleware, async (req, res) => {
        try {
            await pool.execute(
                'INSERT INTO admin_revoked_tokens (token_jti, revoked_at) VALUES (?, NOW())',
                [req.admin.jti]
            );
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ success: false, message: 'Logout failed' });
        }
    });

    router.get('/verify', adminAuthMiddleware, (req, res) => {
        res.json({ success: true, message: 'Token is valid', admin: req.admin });
    });

    router.adminAuthMiddleware = adminAuthMiddleware;

    return router;
};
