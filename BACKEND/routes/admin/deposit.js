const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const emailService = require('../../services/email.service'); 

module.exports = (pool) => {
    const adminAuth = require('../admin-auth')(pool);

    // Helper function to delete receipt image
    const deleteReceiptImage = async (receiptUrl) => {
        if (!receiptUrl) return false;
        
        try {
            // Remove leading '/api' if present (for safety)
            const cleanPath = receiptUrl.replace(/^\/api/, '');
            
            // Construct full file path
            const filePath = path.join(__dirname, '../../', cleanPath);
            
            console.log(`Attempting to delete receipt: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Receipt deleted successfully: ${cleanPath}`);
                return true;
            } else {
                console.log(`⚠️ Receipt file not found: ${filePath}`);
                return false;
            }
        } catch (error) {
            console.error('❌ Error deleting receipt:', error.message);
            return false;
        }
    };

    // ===========================================
    // 1. GET PENDING DEPOSITS
    // ===========================================
    router.get('/pending', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            console.log('Fetching pending deposits...');
            
            const [deposits] = await pool.execute(
                `SELECT 
                    d.id,
                    d.user_id,
                    d.full_name,
                    d.email,
                    d.amount,
                    d.receipt_url,
                    d.receipt_filename,
                    d.status,
                    d.created_at,
                    COALESCE(w.available_balance, 0) as current_balance
                FROM deposits d
                LEFT JOIN wallets w ON d.user_id = w.user_id
                WHERE d.status = 'pending'
                ORDER BY d.created_at DESC`
            );

            console.log(`Found ${deposits.length} pending deposits`);

            res.json({
                success: true,
                deposits: deposits
            });

        } catch (error) {
            console.error('Get pending deposits error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending deposits',
                error: error.message
            });
        }
    });

    // ===========================================
    // 2. GET ALL DEPOSITS WITH FILTERS
    // ===========================================
    router.get('/all', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { status, from_date, to_date } = req.query;
            
            let query = `
                SELECT 
                    d.id,
                    d.user_id,
                    d.full_name,
                    d.email,
                    d.amount,
                    d.receipt_url,
                    d.receipt_filename,
                    d.status,
                    d.reject_reason,
                    d.created_at,
                    d.approved_at,
                    COALESCE(w.available_balance, 0) as current_balance
                FROM deposits d
                LEFT JOIN wallets w ON d.user_id = w.user_id
                WHERE 1=1
            `;
            
            let params = [];

            if (status && status !== 'all') {
                query += ' AND d.status = ?';
                params.push(status);
            }

            if (from_date) {
                query += ' AND DATE(d.created_at) >= ?';
                params.push(from_date);
            }

            if (to_date) {
                query += ' AND DATE(d.created_at) <= ?';
                params.push(to_date);
            }

            query += ' ORDER BY d.created_at DESC';

            const [deposits] = await pool.execute(query, params);

            res.json({
                success: true,
                deposits: deposits
            });

        } catch (error) {
            console.error('Get all deposits error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposits',
                error: error.message
            });
        }
    });

    // ===========================================
    // 3. GET SINGLE DEPOSIT DETAILS
    // ===========================================
    router.get('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { id } = req.params;

            const [deposits] = await pool.execute(
                `SELECT 
                    d.*,
                    COALESCE(w.available_balance, 0) as current_balance
                FROM deposits d
                LEFT JOIN wallets w ON d.user_id = w.user_id
                WHERE d.id = ?`,
                [id]
            );

            if (deposits.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Deposit not found'
                });
            }

            res.json({
                success: true,
                deposit: deposits[0]
            });

        } catch (error) {
            console.error('Get deposit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit'
            });
        }
    });

    // ===========================================
    // 4. REJECT DEPOSIT (WITH EMAIL + AUTO-DELETE)
    // ===========================================
    router.post('/:id/reject', adminAuth.adminAuthMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const depositId = req.params.id;
            const { reason } = req.body;

            console.log(`Rejecting deposit ID: ${depositId}. Reason: ${reason || 'No reason provided'}`);

            const [deposits] = await connection.execute(
                'SELECT d.*, u.full_name as user_name, u.email as user_email FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.id = ? AND d.status = "pending"',
                [depositId]
            );

            if (deposits.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Pending deposit not found'
                });
            }

            const deposit = deposits[0];
            const receiptUrl = deposit.receipt_url;

            await connection.execute(
                `UPDATE deposits 
                SET status = 'rejected', 
                    reject_reason = ? 
                WHERE id = ? AND status = 'pending'`,
                [reason || 'Rejected by admin', depositId]
            );

            await connection.commit();

            console.log(`Deposit ${depositId} rejected successfully`);

            // ===========================================
            // AUTO-DELETE RECEIPT IMAGE
            // ===========================================
            if (receiptUrl) {
                await deleteReceiptImage(receiptUrl);
            }
            // ===========================================

            try {
                const depositData = {
                    id: deposit.id,
                    amount: parseFloat(deposit.amount),
                    receipt_url: deposit.receipt_url
                };

                const userData = {
                    name: deposit.user_name || deposit.full_name,
                    email: deposit.user_email || deposit.email,
                    id: deposit.user_id
                };

                await emailService.sendDepositRejectedEmail(depositData, userData, reason);
                console.log(`✅ Rejection email sent to user ${deposit.user_id}`);
            } catch (emailError) {
                console.error('❌ Error sending rejection email:', emailError.message);
            }

            res.json({
                success: true,
                message: 'Deposit rejected successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Reject deposit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject deposit',
                error: error.message
            });
        } finally {
            connection.release();
        }
    });

    // ===========================================
    // 5. GET DEPOSIT STATISTICS
    // ===========================================
    router.get('/stats/summary', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_approved_amount
                FROM deposits
            `);

            res.json({
                success: true,
                stats: stats[0]
            });

        } catch (error) {
            console.error('Get deposit stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit statistics'
            });
        }
    });

    // ===========================================
    // 6. APPROVE DEPOSIT (ADMIN ID CHECK REMOVED + AUTO-DELETE)
    // ===========================================
    router.post('/:id/approve', adminAuth.adminAuthMiddleware, async (req, res) => {
        console.log('🟢 Approve endpoint hit!');

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const depositId = req.params.id;
            const { amount } = req.body;
            
            console.log(`📝 Approving deposit ID: ${depositId}`);
            console.log(`💰 Amount from request body: ${amount}`);

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid amount is required'
                });
            }

            const [deposits] = await connection.execute(
                'SELECT d.*, u.full_name as user_name, u.email as user_email FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.id = ? AND d.status = "pending"',
                [depositId]
            );

            if (deposits.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Pending deposit not found'
                });
            }

            const deposit = deposits[0];
            const userId = deposit.user_id;
            const receiptUrl = deposit.receipt_url;
            
            console.log(`👤 User ID: ${userId}`);
            console.log(`💰 Original amount: ${deposit.amount}`);
            console.log(`💰 New amount: ${amount}`);

            // Update deposit — no adminId required
            await connection.execute(
                `UPDATE deposits 
                SET status = 'approved', 
                    amount = ?,
                    approved_at = NOW() 
                WHERE id = ?`,
                [amount, depositId]
            );

            const [wallets] = await connection.execute(
                'SELECT * FROM wallets WHERE user_id = ?',
                [userId]
            );

            if (wallets.length === 0) {
                await connection.execute(
                    `INSERT INTO wallets (user_id, email, available_balance, total_history_balance) 
                     SELECT ?, email, ?, ? FROM users WHERE id = ?`,
                    [userId, amount, amount, userId]
                );
                console.log(`🆕 New wallet created for user ${userId}`);
            } else {
                await connection.execute(
                    `UPDATE wallets 
                    SET available_balance = available_balance + ?,
                        total_history_balance = total_history_balance + ?
                    WHERE user_id = ?`,
                    [amount, amount, userId]
                );
                console.log(`💰 Wallet updated for user ${userId}: +${amount}`);
            }

            await connection.commit();

            const [updatedWallet] = await connection.execute(
                'SELECT available_balance FROM wallets WHERE user_id = ?',
                [userId]
            );

            // ===========================================
            // AUTO-DELETE RECEIPT IMAGE
            // ===========================================
            if (receiptUrl) {
                await deleteReceiptImage(receiptUrl);
            }
            // ===========================================

            res.json({
                success: true,
                message: 'Deposit approved successfully',
                amount: amount,
                user_id: userId,
                new_balance: updatedWallet[0]?.available_balance || 0
            });

        } catch (error) {
            await connection.rollback();
            console.error('❌ Approve deposit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve deposit',
                error: error.message
            });
        } finally {
            connection.release();
        }
    });

    // ===========================================
    // 7. DELETE RECEIPT (MANUAL DELETE - OPTIONAL)
    // ===========================================
    router.post('/:id/delete-receipt', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const depositId = req.params.id;

            const [deposits] = await pool.execute(
                'SELECT receipt_url FROM deposits WHERE id = ?',
                [depositId]
            );

            if (deposits.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Deposit not found'
                });
            }

            const receiptUrl = deposits[0].receipt_url;
            
            if (!receiptUrl) {
                return res.json({
                    success: true,
                    message: 'No receipt to delete'
                });
            }

            const deleted = await deleteReceiptImage(receiptUrl);

            if (deleted) {
                // Optionally remove receipt_url from database
                await pool.execute(
                    'UPDATE deposits SET receipt_url = NULL WHERE id = ?',
                    [depositId]
                );
            }

            res.json({
                success: true,
                message: deleted ? 'Receipt deleted successfully' : 'Receipt file not found'
            });

        } catch (error) {
            console.error('Delete receipt error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete receipt',
                error: error.message
            });
        }
    });

    return router;
};
