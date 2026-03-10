// routes/spin.js
const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Auth middleware
    const authMiddleware = async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user data with wallet info
            const [users] = await pool.execute(`
                SELECT 
                    u.id,
                    u.full_name as name,
                    u.email,
                    u.balance,
                    u.total_spins,
                    u.last_spin_date,
                    w.available_balance,
                    w.currency
                FROM users u
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE u.id = ?
            `, [decoded.userId]);

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            req.user = users[0];
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'Please authenticate'
            });
        }
    };

    // Check if user can spin today
    router.get('/can-spin', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;
            const today = new Date().toISOString().split('T')[0];

            // Check if user already spun today
            const [todaySpin] = await pool.execute(`
                SELECT prize_value, prize_amount, result_type 
                FROM spin_history 
                WHERE user_id = ? AND spin_date = ?
            `, [user_id, today]);

            const canSpin = todaySpin.length === 0;

            res.json({
                success: true,
                can_spin: canSpin,
                last_spin_date: req.user.last_spin_date,
                today_spin_result: todaySpin[0] || null
            });

        } catch (error) {
            console.error('Error checking spin status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check spin status'
            });
        }
    });

    // Get spin statistics
    router.get('/stats', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;

            // Get today's spin
            const today = new Date().toISOString().split('T')[0];
            const [todaySpin] = await pool.execute(`
                SELECT prize_value, prize_amount, result_type 
                FROM spin_history 
                WHERE user_id = ? AND spin_date = ?
            `, [user_id, today]);

            // Get total stats
            const [totalStats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_spins,
                    SUM(CASE WHEN result_type = 'win' THEN 1 ELSE 0 END) as total_wins,
                    SUM(prize_amount) as total_win_amount
                FROM spin_history 
                WHERE user_id = ?
            `, [user_id]);

            // Get last 10 spins for history
            const [recentSpins] = await pool.execute(`
                SELECT 
                    prize_value,
                    prize_amount,
                    result_type,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as spin_time,
                    spin_date
                FROM spin_history 
                WHERE user_id = ?
                ORDER BY created_at DESC 
                LIMIT 10
            `, [user_id]);

            res.json({
                success: true,
                stats: {
                    today_spin: todaySpin[0] || null,
                    total_spins: totalStats[0].total_spins || 0,
                    total_wins: totalStats[0].total_wins || 0,
                    total_win_amount: parseFloat(totalStats[0].total_win_amount || 0).toFixed(2),
                    win_rate: totalStats[0].total_spins > 0 
                        ? ((totalStats[0].total_wins / totalStats[0].total_spins) * 100).toFixed(1)
                        : 0
                },
                recent_spins: recentSpins,
                available_balance: req.user.available_balance || 0,
                currency: req.user.currency || 'LKR'
            });

        } catch (error) {
            console.error('Error fetching spin stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch spin statistics'
            });
        }
    });

    // Process spin result (one per day)
    router.post('/spin-result', authMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const { result, amount } = req.body;
            const user_id = req.user.id;
            
            if (!result) {
                return res.status(400).json({
                    success: false,
                    message: 'Result is required'
                });
            }

            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Check if user already spun today
            const [existingSpin] = await connection.execute(`
                SELECT id FROM spin_history 
                WHERE user_id = ? AND spin_date = ?
            `, [user_id, today]);

            if (existingSpin.length > 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'You have already spun the wheel today. Come back tomorrow!',
                    can_spin: false
                });
            }

            // Determine if it's a win or loss
            const isWin = !result.includes('Luck');
            const prizeAmount = isWin ? parseFloat(amount) || 0 : 0;

            // Insert into spin history
            await connection.execute(`
                INSERT INTO spin_history (
                    user_id,
                    prize_value,
                    prize_amount,
                    result_type,
                    spin_date,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                user_id,
                result,
                prizeAmount,
                isWin ? 'win' : 'loss',
                today
            ]);

            // Update user's total spins and last spin date
            await connection.execute(`
                UPDATE users 
                SET 
                    total_spins = total_spins + 1,
                    last_spin_date = ?
                WHERE id = ?
            `, [today, user_id]);

            // If win, add to wallet balance
            if (isWin && prizeAmount > 0) {
                await connection.execute(`
                    UPDATE wallets 
                    SET 
                        available_balance = available_balance + ?,
                        total_history_balance = total_history_balance + ?,
                        last_updated = NOW()
                    WHERE user_id = ?
                `, [prizeAmount, prizeAmount, user_id]);

                // Also update users table balance (for consistency)
                await connection.execute(`
                    UPDATE users 
                    SET balance = balance + ?
                    WHERE id = ?
                `, [prizeAmount, user_id]);
            }

            await connection.commit();

            // Get updated wallet balance
            const [updatedWallet] = await connection.execute(`
                SELECT available_balance, currency 
                FROM wallets 
                WHERE user_id = ?
            `, [user_id]);

            res.json({
                success: true,
                message: isWin ? `Congratulations! You won ${result}!` : 'Better luck next time!',
                result: {
                    prize: result,
                    amount: prizeAmount,
                    is_win: isWin
                },
                new_balance: updatedWallet[0]?.available_balance || 0,
                currency: updatedWallet[0]?.currency || 'LKR',
                can_spin: false // Already spun today
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error processing spin result:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process spin result'
            });
        } finally {
            connection.release();
        }
    });

    // Get spin leaderboard (top winners)
    router.get('/leaderboard', async (req, res) => {
        try {
            const [leaderboard] = await pool.execute(`
                SELECT 
                    u.full_name as name,
                    COUNT(sh.id) as total_spins,
                    SUM(CASE WHEN sh.result_type = 'win' THEN 1 ELSE 0 END) as total_wins,
                    SUM(sh.prize_amount) as total_won,
                    MAX(sh.prize_amount) as biggest_win
                FROM spin_history sh
                JOIN users u ON sh.user_id = u.id
                GROUP BY sh.user_id
                ORDER BY total_won DESC
                LIMIT 10
            `);

            res.json({
                success: true,
                leaderboard
            });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard'
            });
        }
    });

    return router;
};