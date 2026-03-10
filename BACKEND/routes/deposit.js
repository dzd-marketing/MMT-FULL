const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service'); 

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/receipts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'receipt-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

module.exports = (pool) => {
    // Middleware to verify token
    const verifyToken = async (req, res, next) => {
        try {
            const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const [sessions] = await pool.execute(
                'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW() AND is_valid = true',
                [token]
            );

            if (sessions.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid or expired session' });
            }

            req.userId = decoded.userId;
            req.userEmail = decoded.email;
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
    };

    // Create new deposit request
    router.post('/create', verifyToken, upload.single('receipt'), async (req, res) => {
        const connection = await pool.getConnection(); // Transaction එකට connection එකක් ගන්න
        
        try {
            await connection.beginTransaction();

            const { amount } = req.body;
            const userId = req.userId;
            const userEmail = req.userEmail;

            if (!amount || !req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and receipt are required'
                });
            }

            // Get user full name
            const [users] = await connection.execute(
                'SELECT full_name FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const fullName = users[0].full_name;
            const receiptPath = `/uploads/receipts/${req.file.filename}`;
            const receiptFilename = req.file.originalname;

            // Insert deposit record
            const [result] = await connection.execute(
                `INSERT INTO deposits 
                    (user_id, full_name, email, amount, receipt_url, receipt_filename, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [userId, fullName, userEmail, amount, receiptPath, receiptFilename]
            );

            await connection.commit();

            // ===========================================
            // EMAIL NOTIFICATIONS - එකතු කළ කොටස
            // ===========================================
            try {
                const depositData = {
                    id: result.insertId,
                    amount: parseFloat(amount),
                    receipt_url: receiptPath,
                    created_at: new Date()
                };

                const userData = {
                    name: fullName,
                    email: userEmail,
                    id: userId
                };

                // Admin ට email එක
                await emailService.sendDepositNotification(depositData, userData);
                
                // User ට confirmation email එක
                await emailService.sendDepositConfirmationToUser(depositData, userData);

                console.log(`✅ Deposit emails sent for deposit #${result.insertId}`);
            } catch (emailError) {
                // Email fails උනාට deposit එක fail වෙන්නේ නැහැ
                console.error('❌ Error sending deposit emails:', emailError.message);
            }
            // ===========================================

            res.json({
                success: true,
                message: 'Deposit request submitted successfully',
                deposit_id: result.insertId
            });

        } catch (error) {
            await connection.rollback();
            console.error('Deposit creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create deposit request'
            });
        } finally {
            connection.release();
        }
    });

    // Get user's deposit history
    router.get('/history', verifyToken, async (req, res) => {
        try {
            const [deposits] = await pool.execute(
                `SELECT id, amount, status, receipt_url, created_at 
                FROM deposits 
                WHERE user_id = ?
                ORDER BY created_at DESC`,
                [req.userId]
            );

            res.json({
                success: true,
                deposits: deposits
            });

        } catch (error) {
            console.error('Deposit history error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit history'
            });
        }
    });

    return router;
};
