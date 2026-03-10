const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = (pool) => {
const adminAuth = require('../admin-auth')(pool);

    // Get all users with pagination and filters
    router.get('/all', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const search = req.query.search || '';
            const status = req.query.status || 'all';
            const provider = req.query.provider || 'all';

            let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
            let query = `
                SELECT 
                    u.id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.whatsapp,
                    u.profile_picture,
                    u.auth_provider,
                    u.admin_type,
                    u.is_active,
                    u.email_verified,
                    u.created_at,
                    u.last_login,
                    u.login_ip,
                    u.apikey,
                    u.currency,
                    COALESCE(w.available_balance, 0) as balance,
                    COALESCE(w.spent_balance, 0) as spent,
                    COALESCE(w.total_history_balance, 0) as total_history
                FROM users u
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE 1=1
            `;
            
            let countParams = [];
            let queryParams = [];

            // Add search filter
            if (search) {
                const searchPattern = `%${search}%`;
                countQuery += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
                query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
                countParams.push(searchPattern, searchPattern, searchPattern);
                queryParams.push(searchPattern, searchPattern, searchPattern);
            }

            // Add status filter
            if (status !== 'all') {
                const isActive = status === 'active' ? 1 : 0;
                countQuery += ' AND u.is_active = ?';
                query += ' AND u.is_active = ?';
                countParams.push(isActive);
                queryParams.push(isActive);
            }

            // Add provider filter
            if (provider !== 'all') {
                countQuery += ' AND u.auth_provider = ?';
                query += ' AND u.auth_provider = ?';
                countParams.push(provider);
                queryParams.push(provider);
            }

            // Get total count
            const [countResult] = await pool.execute(countQuery, countParams);
            const totalUsers = countResult[0].total;
            const totalPages = Math.ceil(totalUsers / limit);

            // Get users for current page
            query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
            queryParams.push(limit, offset);

            const [users] = await pool.execute(query, queryParams);

            // Get user stats for each user
            for (let user of users) {
                // Get total orders
                const [orders] = await pool.execute(
                    'SELECT COUNT(*) as total_orders FROM orders WHERE user_id = ?',
                    [user.id]
                );
                user.total_orders = orders[0].total_orders;

                // Get total deposits
                const [deposits] = await pool.execute(
                    'SELECT COUNT(*) as total_deposits, COALESCE(SUM(amount), 0) as total_deposit_amount FROM deposits WHERE user_id = ?',
                    [user.id]
                );
                user.total_deposits = deposits[0].total_deposits;
                user.total_deposit_amount = deposits[0].total_deposit_amount;
            }

            res.json({
                success: true,
                users: users,
                pagination: {
                    page,
                    limit,
                    total: totalUsers,
                    pages: totalPages
                }
            });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch users'
            });
        }
    });

    // Get single user by ID
    router.get('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { id } = req.params;

            const [users] = await pool.execute(
                `SELECT 
                    u.*,
                    COALESCE(w.available_balance, 0) as balance,
                    COALESCE(w.spent_balance, 0) as spent,
                    COALESCE(w.total_history_balance, 0) as total_history
                FROM users u
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE u.id = ?`,
                [id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];

            // Get orders
            const [orders] = await pool.execute(
                `SELECT 
                    order_id, 
                    order_quantity, 
                    order_charge, 
                    order_status, 
                    order_create 
                FROM orders 
                WHERE user_id = ? 
                ORDER BY order_create DESC 
                LIMIT 10`,
                [id]
            );
            user.recent_orders = orders;

            // Get deposits
            const [deposits] = await pool.execute(
                `SELECT 
                    id, 
                    amount, 
                    status, 
                    created_at 
                FROM deposits 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 10`,
                [id]
            );
            user.recent_deposits = deposits;

            // Get stats
            const [stats] = await pool.execute(
                `SELECT 
                    (SELECT COUNT(*) FROM orders WHERE user_id = ?) as total_orders,
                    (SELECT COUNT(*) FROM deposits WHERE user_id = ?) as total_deposits,
                    (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE user_id = ? AND status = 'approved') as total_deposit_amount
                `,
                [id, id, id]
            );
            user.stats = stats[0];

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user'
            });
        }
    });

    // Search users by email/name
    router.get('/search/:query', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { query } = req.params;
            const searchPattern = `%${query}%`;

            const [users] = await pool.execute(
                `SELECT 
                    id, 
                    full_name, 
                    email, 
                    phone, 
                    profile_picture,
                    is_active,
                    created_at
                FROM users 
                WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?
                LIMIT 20`,
                [searchPattern, searchPattern, searchPattern]
            );

            res.json({
                success: true,
                users
            });

        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search users'
            });
        }
    });

    // Update user
    router.put('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { 
                full_name, 
                phone, 
                whatsapp, 
                email_verified, 
                is_active, 
                admin_type,
                balance,
                password 
            } = req.body;

            // Check if user exists
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Build update query
            let updateFields = [];
            let queryParams = [];

            if (full_name) {
                updateFields.push('full_name = ?');
                queryParams.push(full_name);
            }

            if (phone !== undefined) {
                updateFields.push('phone = ?');
                queryParams.push(phone);
            }

            if (whatsapp !== undefined) {
                updateFields.push('whatsapp = ?');
                queryParams.push(whatsapp);
            }

            if (email_verified !== undefined) {
                updateFields.push('email_verified = ?');
                queryParams.push(email_verified);
            }

            if (is_active !== undefined) {
                updateFields.push('is_active = ?');
                queryParams.push(is_active);
            }

            if (admin_type !== undefined) {
                updateFields.push('admin_type = ?');
                queryParams.push(admin_type);
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
                updateFields.push('password = ?');
                queryParams.push(hashedPassword);
            }

            if (updateFields.length > 0) {
                queryParams.push(id);
                await connection.execute(
                    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                    queryParams
                );
            }

            // Update wallet balance if provided
            if (balance !== undefined) {
                await connection.execute(
                    'UPDATE wallets SET available_balance = ? WHERE user_id = ?',
                    [balance, id]
                );
            }

            await connection.commit();

            res.json({
                success: true,
                message: 'User updated successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        } finally {
            connection.release();
        }
    });

    // Delete user
    router.delete('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            // Check if user exists
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Delete user's sessions
            await connection.execute(
                'DELETE FROM user_sessions WHERE user_id = ?',
                [id]
            );

            // Delete user's wallet
            await connection.execute(
                'DELETE FROM wallets WHERE user_id = ?',
                [id]
            );

            // Delete user's deposits
            await connection.execute(
                'DELETE FROM deposits WHERE user_id = ?',
                [id]
            );

            // Delete user's orders
            await connection.execute(
                'DELETE FROM orders WHERE user_id = ?',
                [id]
            );

            // Finally delete user
            await connection.execute(
                'DELETE FROM users WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete user'
            });
        } finally {
            connection.release();
        }
    });

    // Toggle user status
    router.patch('/:id/toggle-status', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            await pool.execute(
                'UPDATE users SET is_active = ? WHERE id = ?',
                [is_active, id]
            );

            // Invalidate sessions if deactivating
            if (is_active === 0) {
                await pool.execute(
                    'UPDATE user_sessions SET is_valid = false WHERE user_id = ?',
                    [id]
                );
            }

            res.json({
                success: true,
                message: `User ${is_active === 1 ? 'activated' : 'deactivated'} successfully`
            });

        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle user status'
            });
        }
    });

    // Get user statistics
    router.get('/stats/summary', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
                    SUM(CASE WHEN auth_provider = 'google' THEN 1 ELSE 0 END) as google_users,
                    SUM(CASE WHEN auth_provider = 'local' THEN 1 ELSE 0 END) as local_users,
                    SUM(CASE WHEN admin_type = '1' THEN 1 ELSE 0 END) as admin_users
                FROM users
            `);

            const [balanceStats] = await pool.execute(`
                SELECT 
                    COALESCE(SUM(available_balance), 0) as total_balance,
                    COALESCE(SUM(spent_balance), 0) as total_spent,
                    COALESCE(SUM(total_history_balance), 0) as total_history
                FROM wallets
            `);

            res.json({
                success: true,
                stats: {
                    ...stats[0],
                    ...balanceStats[0]
                }
            });

        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user statistics'
            });
        }
    });

    return router;
};