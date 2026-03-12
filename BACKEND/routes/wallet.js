const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { cache, CACHE_KEYS } = require('../utils/cache');

module.exports = (pool) => {

    const verifyToken = async (req, res, next) => {
        try {
            const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const [sessions] = await pool.execute(
                'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW() AND is_valid = true',
                [token]
            );

            if (sessions.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }

            req.userId = decoded.userId;
            req.userEmail = decoded.email;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            return res.status(500).json({ success: false, message: 'Authentication failed' });
        }
    };

   
    router.get('/details', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
    
            const cacheKey = CACHE_KEYS.USER_WALLET(userId);
            const cachedWallet = cache.get(cacheKey);
            
            if (cachedWallet) {
                console.log(`💰 [CACHE] Wallet hit for user ${userId}`);
                return res.json({
                    success: true,
                    wallet: cachedWallet,
                    cached: true
                });
            }
            
            console.log(`💰 [CACHE] Wallet miss for user ${userId} - fetching from DB`);

         
            const [wallets] = await pool.execute(
                `SELECT 
                    id,
                    user_id,
                    email,
                    available_balance,
                    spent_balance,
                    total_history_balance
                FROM wallets 
                WHERE user_id = ?`,
                [userId]
            );

            let walletData;

            if (wallets.length === 0) {
         
                const [users] = await pool.execute(
                    'SELECT email FROM users WHERE id = ?',
                    [userId]
                );

                if (users.length > 0) {
                    const [result] = await pool.execute(
                        'INSERT INTO wallets (user_id, email, available_balance, spent_balance, total_history_balance) VALUES (?, ?, ?, ?, ?)',
                        [userId, users[0].email, 0.00, 0.00, 0.00]
                    );

                    walletData = {
                        id: result.insertId,
                        user_id: userId,
                        email: users[0].email,
                        available_balance: "0.00",
                        spent_balance: "0.00",
                        total_history_balance: "0.00"
                    };
                }
            } else {
                const wallet = wallets[0];
                walletData = {
                    id: wallet.id,
                    user_id: wallet.user_id,
                    email: wallet.email,
                    available_balance: parseFloat(wallet.available_balance || 0).toFixed(2),
                    spent_balance: parseFloat(wallet.spent_balance || 0).toFixed(2),
                    total_history_balance: parseFloat(wallet.total_history_balance || 0).toFixed(2)
                };
            }

            cache.set(cacheKey, walletData, 2);
            console.log(`💰 [CACHE] Cached wallet for user ${userId}`);

            res.json({
                success: true,
                wallet: walletData
            });

        } catch (error) {
            console.error('Get wallet details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get wallet details'
            });
        }
    });

    router.get('/balance', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
            
            // Check cache first
            const cacheKey = CACHE_KEYS.USER_WALLET(userId);
            const cachedWallet = cache.get(cacheKey);
            
            if (cachedWallet) {
                return res.json({
                    success: true,
                    balance: cachedWallet.available_balance,
                    cached: true
                });
            }

            const [wallets] = await pool.execute(
                'SELECT available_balance FROM wallets WHERE user_id = ?',
                [userId]
            );

            if (wallets.length === 0) {
                return res.json({
                    success: true,
                    balance: "0.00"
                });
            }

            res.json({
                success: true,
                balance: parseFloat(wallets[0].available_balance || 0).toFixed(2)
            });

        } catch (error) {
            console.error('Get balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get balance'
            });
        }
    });

    router.get('/transactions', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
            const limit = parseInt(req.query.limit) || 10;

 
            const cacheKey = `user:${userId}:transactions:${limit}`;
            const cachedTransactions = cache.get(cacheKey);
            
            if (cachedTransactions) {
                return res.json({
                    success: true,
                    transactions: cachedTransactions,
                    cached: true
                });
            }

    
            const [transactions] = await pool.execute(
                `SELECT 
                    id,
                    type,
                    amount,
                    description,
                    status,
                    created_at
                FROM transactions 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?`,
                [userId, limit]
            );

            cache.set(cacheKey, transactions, 120);

            res.json({
                success: true,
                transactions: transactions
            });

        } catch (error) {
            console.error('Get transactions error:', error);
            
            res.json({
                success: true,
                transactions: []
            });
        }
    });


    router.post('/update-balance', verifyToken, async (req, res) => {
        try {
            const { amount, type } = req.body; // type: 'add' or 'spend'
            const userId = req.userId;

            if (!amount || !type) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount and type are required'
                });
            }

            const cacheKey = CACHE_KEYS.USER_WALLET(userId);
            cache.del(cacheKey);
            console.log(`🧹 [CACHE] Cleared wallet cache for user ${userId} before update`);

            let query = '';
            if (type === 'add') {
                query = 'UPDATE wallets SET available_balance = available_balance + ?, total_history_balance = total_history_balance + ? WHERE user_id = ?';
            } else if (type === 'spend') {
                query = 'UPDATE wallets SET available_balance = available_balance - ?, spent_balance = spent_balance + ? WHERE user_id = ?';
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Use "add" or "spend"'
                });
            }

            await pool.execute(query, [amount, amount, userId]);

            // Get updated balance
            const [wallets] = await pool.execute(
                'SELECT available_balance FROM wallets WHERE user_id = ?',
                [userId]
            );

            const newBalance = parseFloat(wallets[0]?.available_balance || 0).toFixed(2);

     
            const [fullWallet] = await pool.execute(
                `SELECT 
                    id,
                    user_id,
                    email,
                    available_balance,
                    spent_balance,
                    total_history_balance
                FROM wallets 
                WHERE user_id = ?`,
                [userId]
            );

            if (fullWallet.length > 0) {
                const wallet = fullWallet[0];
                const walletData = {
                    id: wallet.id,
                    user_id: wallet.user_id,
                    email: wallet.email,
                    available_balance: parseFloat(wallet.available_balance || 0).toFixed(2),
                    spent_balance: parseFloat(wallet.spent_balance || 0).toFixed(2),
                    total_history_balance: parseFloat(wallet.total_history_balance || 0).toFixed(2)
                };
                cache.set(cacheKey, walletData, 300);
                console.log(`💰 [CACHE] Updated wallet cache for user ${userId} after balance change`);
            }

            res.json({
                success: true,
                message: 'Balance updated successfully',
                new_balance: newBalance
            });

        } catch (error) {
            console.error('Update balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update balance'
            });
        }
    });

    router.post('/clear-cache', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;
            const cacheKey = CACHE_KEYS.USER_WALLET(userId);
            cache.del(cacheKey);
            
            res.json({
                success: true,
                message: 'Wallet cache cleared successfully'
            });
        } catch (error) {
            console.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clear cache'
            });
        }
    });

    return router;
};

