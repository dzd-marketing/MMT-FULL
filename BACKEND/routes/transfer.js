const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    // Middleware to verify token
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
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
    };

    // Search user by email or username
    router.get('/search', verifyToken, async (req, res) => {
        try {
            const { query } = req.query;
            
            if (!query || query.length < 3) {
                return res.json({
                    success: true,
                    users: []
                });
            }

            // Search users by email or full_name (username)
            const [users] = await pool.execute(
                `SELECT 
                    id, 
                    full_name as name, 
                    email 
                FROM users 
                WHERE (email LIKE ? OR full_name LIKE ?) AND id != ?
                LIMIT 5`,
                [`%${query}%`, `%${query}%`, req.userId]
            );

            res.json({
                success: true,
                users: users
            });

        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search users'
            });
        }
    });

    // Transfer funds
    router.post('/send', verifyToken, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const senderId = req.userId;
            const { receiverEmail, amount } = req.body;

            // Validation
            if (!receiverEmail || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Receiver email and amount are required'
                });
            }

            const transferAmount = parseFloat(amount);
            if (isNaN(transferAmount) || transferAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }

            // Check if receiver exists
            const [receivers] = await connection.execute(
                'SELECT id, full_name, email FROM users WHERE email = ?',
                [receiverEmail]
            );

            if (receivers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this email'
                });
            }

            const receiver = receivers[0];

            // Check if sending to self
            if (receiver.id === senderId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot transfer funds to yourself'
                });
            }

            // Get sender's wallet
            const [senderWallets] = await connection.execute(
                'SELECT id, available_balance FROM wallets WHERE user_id = ?',
                [senderId]
            );

            if (senderWallets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sender wallet not found'
                });
            }

            const senderBalance = parseFloat(senderWallets[0].available_balance);

            // Check if sender has sufficient balance
            if (senderBalance < transferAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }

            // Get receiver's wallet (create if not exists)
            let [receiverWallets] = await connection.execute(
                'SELECT id, available_balance FROM wallets WHERE user_id = ?',
                [receiver.id]
            );

            if (receiverWallets.length === 0) {
                // Create wallet for receiver
                const [result] = await connection.execute(
                    'INSERT INTO wallets (user_id, email, available_balance, spent_balance, total_history_balance) VALUES (?, ?, ?, ?, ?)',
                    [receiver.id, receiver.email, 0.00, 0.00, 0.00]
                );
                
                receiverWallets = [{
                    id: result.insertId,
                    available_balance: 0
                }];
            }

            // Deduct from sender
            await connection.execute(
                'UPDATE wallets SET available_balance = available_balance - ? WHERE user_id = ?',
                [transferAmount, senderId]
            );

            // Add to receiver
            await connection.execute(
                'UPDATE wallets SET available_balance = available_balance + ? WHERE user_id = ?',
                [transferAmount, receiver.id]
            );

            // Record transaction for sender (optional - if you have transactions table)
            try {
                await connection.execute(
                    `INSERT INTO transactions 
                    (user_id, type, amount, description, status, created_at) 
                    VALUES (?, 'transfer_out', ?, ?, 'completed', NOW())`,
                    [senderId, transferAmount, `Transfer to ${receiver.email}`]
                );

                await connection.execute(
                    `INSERT INTO transactions 
                    (user_id, type, amount, description, status, created_at) 
                    VALUES (?, 'transfer_in', ?, ?, 'completed', NOW())`,
                    [receiver.id, transferAmount, `Transfer from ${req.userEmail}`]
                );
            } catch (txError) {
                console.log('Transactions table not available, skipping record');
            }

            await connection.commit();

            // Get updated balances
            const [updatedSender] = await connection.execute(
                'SELECT available_balance FROM wallets WHERE user_id = ?',
                [senderId]
            );

            res.json({
                success: true,
                message: `Successfully transferred ${transferAmount.toFixed(2)} to ${receiver.full_name}`,
                new_balance: parseFloat(updatedSender[0].available_balance || 0).toFixed(2),
                receiver: {
                    name: receiver.full_name,
                    email: receiver.email
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Transfer error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to transfer funds: ' + error.message
            });
        } finally {
            connection.release();
        }
    });

    return router;
};
