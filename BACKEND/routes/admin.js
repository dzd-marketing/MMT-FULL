const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const adminAuth = async (req, res, next) => {
        try {
            const token = req.cookies.adminToken
                || req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);

            if (decoded.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            if (decoded.step !== 'complete') {
                return res.status(403).json({ success: false, message: 'Authentication incomplete' });
            }

            const [revoked] = await pool.execute(
                'SELECT id FROM admin_revoked_tokens WHERE token_jti = ?',
                [decoded.jti]
            );
            if (revoked.length > 0) {
                return res.status(401).json({ success: false, message: 'Token has been revoked' });
            }

            req.adminEmail = decoded.email;
            next();
        } catch (error) {
            console.error('Admin auth error:', error);
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
    };

    router.get('/test', adminAuth, async (req, res) => {
        res.json({ success: true, message: 'Admin routes are working' });
    });

    router.get('/dashboard/stats', adminAuth, async (req, res) => {
        try {
            const [ordersCount] = await pool.execute('SELECT COUNT(*) as total FROM orders');
            const [usersCount] = await pool.execute('SELECT COUNT(*) as total FROM users');
            const [servicesCount] = await pool.execute(
                'SELECT COUNT(*) as total FROM services WHERE service_deleted = "0" AND service_type = "2"'
            );
            const [totalBalance] = await pool.execute('SELECT SUM(available_balance) as total FROM wallets');
            const [activeTickets] = await pool.execute(
                "SELECT COUNT(*) as total FROM tickets WHERE status IN ('open', 'in_progress', 'waiting')"
            );

            const [securityToday] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
                FROM login_attempts 
                WHERE DATE(attempt_time) = CURDATE()
            `);

            const [platformSummary] = await pool.execute(`
                SELECT 
                    c.platform,
                    COUNT(s.service_id) as service_count
                FROM categories c
                LEFT JOIN services s ON c.id = s.category_id AND s.service_deleted = '0' AND s.service_type = '2'
                GROUP BY c.platform
                ORDER BY service_count DESC
                LIMIT 3
            `);

            const [recentOrders] = await pool.execute(`
                SELECT 
                    o.order_id,
                    o.api_orderid,
                    o.order_status,
                    o.order_charge,
                    o.order_create,
                    u.full_name as user_name,
                    COALESCE(s.service_name, CONCAT('Service #', o.service_id)) as service_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN services s ON o.service_id = s.service_id
                ORDER BY o.order_create DESC
                LIMIT 5
            `);

            res.json({
                success: true,
                stats: {
                    totalOrders: ordersCount[0].total,
                    totalUsers: usersCount[0].total,
                    totalServices: servicesCount[0].total,
                    totalBalance: parseFloat(totalBalance[0].total || 0).toFixed(2),
                    activeTickets: activeTickets[0].total,
                    security: {
                        todayAttempts: securityToday[0].total || 0,
                        successRate: securityToday[0].total > 0
                            ? Math.round((securityToday[0].successful / securityToday[0].total) * 100)
                            : 100
                    },
                    topPlatforms: platformSummary
                },
                recentOrders: recentOrders
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats'
            });
        }
    });
    router.get('/orders', adminAuth, async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    o.*,
                    u.full_name as user_name,
                    s.service_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE 1=1
            `;
            const params = [];

            if (status && status !== 'all') {
                query += ` AND o.order_status = ?`;
                params.push(status);
            }

            query += ` ORDER BY o.order_create DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [orders] = await pool.execute(query, params);

            let countQuery = `SELECT COUNT(*) as total FROM orders WHERE 1=1`;
            const countParams = [];
            if (status && status !== 'all') {
                countQuery += ` AND order_status = ?`;
                countParams.push(status);
            }
            const [totalCount] = await pool.execute(countQuery, countParams);

            res.json({
                success: true,
                orders: orders,
                pagination: {
                    total: totalCount[0].total,
                    page: page,
                    limit: limit,
                    pages: Math.ceil(totalCount[0].total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
    });

router.get('/orders/stats', adminAuth, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN order_status = 'inprogress' THEN 1 ELSE 0 END) as inprogress,
                SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN order_status = 'partial' THEN 1 ELSE 0 END) as partial,
                SUM(CASE WHEN order_status = 'canceled' THEN 1 ELSE 0 END) as canceled,
                SUM(CASE WHEN order_status = 'fail' THEN 1 ELSE 0 END) as fail,
                SUM(CASE WHEN order_status = 'cronpending' THEN 1 ELSE 0 END) as cronpending,
                SUM(CASE WHEN order_status = 'queued' THEN 1 ELSE 0 END) as queued
            FROM orders
        `);

        res.json({ success: true, stats: stats[0] });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
    }
});

    router.get('/orders/recent', adminAuth, async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 5;

            const [orders] = await pool.execute(`
                SELECT 
                    o.order_id,
                    o.api_orderid,
                    o.order_status,
                    o.order_charge,
                    o.order_create,
                    o.order_url,
                    u.full_name as user_name,
                    u.email as user_email,
                    COALESCE(s.service_name, CONCAT('Service #', o.service_id)) as service_name
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN services s ON o.service_id = s.service_id
                ORDER BY o.order_create DESC
                LIMIT ?
            `, [limit]);

            res.json({
                success: true,
                orders: orders
            });
        } catch (error) {
            console.error('Error fetching recent orders:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent orders'
            });
        }
    });

    router.get('/orders/services-with-counts', adminAuth, async (req, res) => {
        try {
            const [services] = await pool.execute(`
                SELECT 
                    s.service_id,
                    s.service_name,
                    COUNT(o.order_id) as order_count
                FROM services s
                LEFT JOIN orders o ON s.service_id = o.service_id
                WHERE s.service_deleted = '0' AND s.service_type = '2'
                GROUP BY s.service_id
                ORDER BY order_count DESC
                LIMIT 50
            `);

            res.json({
                success: true,
                services: services
            });
        } catch (error) {
            console.error('Error fetching services with counts:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch services' });
        }
    });

    router.post('/orders/:id/status', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await pool.execute(
                'UPDATE orders SET order_status = ? WHERE order_id = ?',
                [status, id]
            );

            res.json({ success: true, message: 'Order status updated' });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ success: false, message: 'Failed to update order status' });
        }
    });

    router.put('/orders/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { start_count, remains, status } = req.body;

            await pool.execute(
                'UPDATE orders SET order_start = ?, order_remains = ?, order_status = ? WHERE order_id = ?',
                [start_count, remains, status, id]
            );

            res.json({ success: true, message: 'Order updated successfully' });
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(500).json({ success: false, message: 'Failed to update order' });
        }
    });

    router.post('/orders/:id/update-url', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { url } = req.body;

            await pool.execute(
                'UPDATE orders SET order_url = ? WHERE order_id = ?',
                [url, id]
            );

            res.json({ success: true, message: 'Order URL updated' });
        } catch (error) {
            console.error('Error updating order URL:', error);
            res.status(500).json({ success: false, message: 'Failed to update order URL' });
        }
    });

    router.post('/orders/:id/update-start', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { start_count } = req.body;

            await pool.execute(
                'UPDATE orders SET order_start = ? WHERE order_id = ?',
                [start_count, id]
            );

            res.json({ success: true, message: 'Start count updated' });
        } catch (error) {
            console.error('Error updating start count:', error);
            res.status(500).json({ success: false, message: 'Failed to update start count' });
        }
    });

    router.post('/orders/:id/partial', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { quantity, remains } = req.body;

            const [orders] = await connection.execute(
                'SELECT * FROM orders WHERE order_id = ?',
                [id]
            );

            if (orders.length === 0) {
                throw new Error('Order not found');
            }

            const order = orders[0];

            const perUnitPrice = order.order_charge / order.order_quantity;
            const refundAmount = remains * perUnitPrice;
            const newCharge = order.order_charge - refundAmount;

            await connection.execute(
                'UPDATE orders SET order_remains = ?, order_charge = ?, order_status = ? WHERE order_id = ?',
                [remains, newCharge, 'partial', id]
            );

            await connection.execute(
                'UPDATE wallets SET available_balance = available_balance + ? WHERE user_id = ?',
                [refundAmount, order.user_id]
            );

            await connection.execute(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [refundAmount, order.user_id]
            );

            await connection.commit();
            res.json({
                success: true,
                message: 'Partial processed successfully',
                refund_amount: refundAmount,
                new_charge: newCharge
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error processing partial:', error);
            res.status(500).json({ success: false, message: 'Failed to process partial' });
        } finally {
            connection.release();
        }
    });

    router.post('/orders/:id/cancel', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { refund } = req.body;

            const [orders] = await connection.execute(
                'SELECT * FROM orders WHERE order_id = ?',
                [id]
            );

            if (orders.length === 0) {
                throw new Error('Order not found');
            }

            const order = orders[0];

            if (refund) {
                await connection.execute(
                    'UPDATE wallets SET available_balance = available_balance + ? WHERE user_id = ?',
                    [order.order_charge, order.user_id]
                );

                await connection.execute(
                    'UPDATE users SET balance = balance + ? WHERE id = ?',
                    [order.order_charge, order.user_id]
                );
            }

            await connection.execute(
                'UPDATE orders SET order_status = ?, order_remains = 0 WHERE order_id = ?',
                ['canceled', id]
            );

            await connection.commit();
            res.json({ success: true, message: 'Order canceled' });
        } catch (error) {
            await connection.rollback();
            console.error('Error canceling order:', error);
            res.status(500).json({ success: false, message: 'Failed to cancel order' });
        } finally {
            connection.release();
        }
    });

    router.post('/orders/:id/cancel-queued', adminAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE order_id = ?', [id]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];

        if (order.order_status !== 'queued') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Order is not in queued status' });
        }

        // Full refund since order was never sent to provider
        await connection.execute(
            'UPDATE wallets SET available_balance = available_balance + ?, spent_balance = GREATEST(0, spent_balance - ?) WHERE user_id = ?',
            [order.order_charge, order.order_charge, order.user_id]
        );

        await connection.execute(
            'UPDATE users SET balance = balance + ? WHERE id = ?',
            [order.order_charge, order.user_id]
        );

        await connection.execute(
            'UPDATE orders SET order_status = "canceled", order_remains = 0, last_check = NOW() WHERE order_id = ?',
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: `Order #${id} cancelled. Rs ${parseFloat(order.order_charge).toFixed(2)} refunded to user.`,
            refund_amount: order.order_charge
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling queued order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    } finally {
        connection.release();
    }
});

router.post('/orders/:id/resend', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [orders] = await pool.execute(`
            SELECT o.*, s.service_api, s.api_service, sa.api_key, sa.api_url 
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.service_id
            LEFT JOIN service_api sa ON s.service_api = sa.id
            WHERE o.order_id = ?
        `, [id]);

        if (orders.length === 0)
            return res.status(404).json({ success: false, message: 'Order not found' });

        const order = orders[0];

        if (!order.api_key || !order.api_url)
            return res.status(400).json({ success: false, message: 'API configuration not found for this service' });

        const axios = require('axios');
        const formData = new URLSearchParams();
        formData.append('key', order.api_key);
        formData.append('action', 'add');
        formData.append('service', order.api_service);
        formData.append('link', order.order_url);

        if (order.dripfeed === '2') {
            formData.append('quantity', order.order_quantity);
            if (order.dripfeed_runs) formData.append('runs', order.dripfeed_runs);
            if (order.dripfeed_interval) formData.append('interval', order.dripfeed_interval);
        } else {
            formData.append('quantity', order.order_quantity);
        }

        if (order.order_extras) {
            try {
                const extras = JSON.parse(order.order_extras);
                if (extras.comments && extras.comments.length > 0) {
                    formData.append('comments', extras.comments.join("\n"));
                }
            } catch (e) {}
        }

        const response = await axios.post(order.api_url, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 30000
        });

        if (response.data && response.data.order) {
            await pool.execute(
                `UPDATE orders SET 
                    api_orderid = ?, 
                    order_detail = ?, 
                    order_error = '-',
                    order_status = 'processing',
                    last_check = NOW()
                WHERE order_id = ?`,
                [response.data.order, JSON.stringify(response.data), id]
            );

            res.json({ success: true, message: 'Order sent to provider successfully', api_order_id: response.data.order });
        } else {
            const errMsg = response.data?.error || 'No order ID returned from provider';

            await pool.execute(
                `UPDATE orders SET order_error = ?, order_detail = ?, last_check = NOW() WHERE order_id = ?`,
                [errMsg, JSON.stringify(response.data), id]
            );

            res.status(400).json({ success: false, message: `Provider error: ${errMsg}` });
        }
    } catch (error) {
        console.error('Error resending order:', error);
        res.status(500).json({ success: false, message: 'Failed to resend order: ' + error.message });
    }
});

    router.post('/orders/bulk-action', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { action, order_ids } = req.body;

            if (action === 'canceled') {
                for (const orderId of order_ids) {
                    const [orders] = await connection.execute(
                        'SELECT user_id, order_charge FROM orders WHERE order_id = ?',
                        [orderId]
                    );

                    if (orders.length > 0) {
                        const order = orders[0];

                        await connection.execute(
                            'UPDATE wallets SET available_balance = available_balance + ? WHERE user_id = ?',
                            [order.order_charge, order.user_id]
                        );

                        await connection.execute(
                            'UPDATE users SET balance = balance + ? WHERE id = ?',
                            [order.order_charge, order.user_id]
                        );
                    }
                }
            }

            const placeholders = order_ids.map(() => '?').join(',');
            await connection.execute(
                `UPDATE orders SET order_status = ? WHERE order_id IN (${placeholders})`,
                [action, ...order_ids]
            );

            await connection.commit();
            res.json({ success: true, message: 'Bulk action completed' });
        } catch (error) {
            await connection.rollback();
            console.error('Error in bulk action:', error);
            res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
        } finally {
            connection.release();
        }
    });

    router.get('/services', adminAuth, async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const category = req.query.category;
            const status = req.query.status;
            const packageType = req.query.package;
            const search = req.query.search;
            const secret = req.query.secret;
            const refill = req.query.refill;
            const cancel = req.query.cancel;
            const offset = (page - 1) * limit;

            let query = `
            SELECT 
                s.*,
                c.category_name,
                c.category_name_lang,
                sa.api_name as provider_name,
                sa.currency as provider_currency
            FROM services s
            LEFT JOIN categories_real c ON s.category_id = c.category_id
            LEFT JOIN service_api sa ON s.service_api = sa.id
            WHERE s.service_deleted = '0'
        `;

            const conditions = [];
            const params = [];

            if (category && category !== 'all' && category !== 'null' && category !== 'undefined') {
                const categoryId = parseInt(category);
                if (!isNaN(categoryId)) {
                    conditions.push(`s.category_id = ?`);
                    params.push(categoryId);
                }
            }

            if (status === 'active') {
                conditions.push(`s.service_type = '2'`);
            } else if (status === 'inactive') {
                conditions.push(`s.service_type = '1'`);
            }
            if (packageType && packageType !== 'all') {
                conditions.push(`s.service_package = ?`);
                params.push(packageType);
            }

            if (secret === 'secret') {
                conditions.push(`s.service_secret = '1'`);
            } else if (secret === 'public') {
                conditions.push(`s.service_secret = '2'`);
            }

            if (refill === 'true') {
                conditions.push(`s.show_refill = 'true'`);
            } else if (refill === 'false') {
                conditions.push(`s.show_refill = 'false'`);
            }

            if (cancel === '1') {
                conditions.push(`s.cancelbutton = '1'`);
            } else if (cancel === '2') {
                conditions.push(`s.cancelbutton = '2'`);
            }

            if (search && search.trim() !== '') {
                const searchTerm = `%${search.trim()}%`;
                if (!isNaN(parseInt(search)) && search.trim().match(/^\d+$/)) {
             
                    conditions.push(`(s.service_id = ? OR s.service_name LIKE ?)`);
                    params.push(parseInt(search), searchTerm);
                } else {
                    conditions.push(`s.service_name LIKE ?`);
                    params.push(searchTerm);
                }
            }

            if (conditions.length > 0) {
                query += ' AND ' + conditions.join(' AND ');
            }

            console.log('Search Query:', search);
            console.log('Conditions:', conditions);
            console.log('Params:', params);

            const countQuery = query.replace(
                'SELECT s.*, c.category_name, c.category_name_lang, sa.api_name as provider_name, sa.currency as provider_currency',
                'SELECT COUNT(*) as total'
            );

            console.log('Count Query:', countQuery);

            const [countResult] = await pool.execute(countQuery, params);
            const total = countResult && countResult[0] ? countResult[0].total : 0;

            query += ` ORDER BY c.category_line ASC, s.service_line ASC LIMIT ? OFFSET ?`;
            const queryParams = [...params, limit, offset];

            console.log('Final Query:', query);
            console.log('Final Params:', queryParams);

            const [services] = await pool.execute(query, queryParams);

            res.json({
                success: true,
                services: services,
                pagination: {
                    total: total,
                    page: page,
                    limit: limit,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch services' });
        }
    });

    router.get('/services/stats', adminAuth, async (req, res) => {
        try {
            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN service_type = '2' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN service_type = '1' THEN 1 ELSE 0 END) as inactive,
                    SUM(CASE WHEN service_secret = '1' THEN 1 ELSE 0 END) as secret,
                    SUM(CASE WHEN service_secret = '2' THEN 1 ELSE 0 END) as public,
                    SUM(CASE WHEN show_refill = 'true' THEN 1 ELSE 0 END) as refill_enabled,
                    SUM(CASE WHEN cancelbutton = '1' THEN 1 ELSE 0 END) as cancel_enabled,
                    COUNT(DISTINCT category_id) as categories
                FROM services 
                WHERE service_deleted = '0'
            `);

            const [packageStats] = await pool.execute(`
                SELECT 
                    service_package,
                    COUNT(*) as count
                FROM services 
                WHERE service_deleted = '0'
                GROUP BY service_package
            `);

            res.json({
                success: true,
                stats: {
                    ...stats[0],
                    by_package: packageStats
                }
            });
        } catch (error) {
            console.error('Error fetching service stats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch service stats' });
        }
    });

    router.get('/services/providers', adminAuth, async (req, res) => {
        try {
            const [providers] = await pool.execute(`
                SELECT * FROM service_api ORDER BY api_name ASC
            `);

            res.json({
                success: true,
                providers: providers
            });
        } catch (error) {
            console.error('Error fetching providers:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch providers' });
        }
    });

router.post('/services/providers', adminAuth, async (req, res) => {
    try {
        const { api_name, api_url, api_key, currency, status } = req.body;
        if (!api_name || !api_url || !api_key) {
            return res.status(400).json({ success: false, message: 'Name, URL and API key are required' });
        }
        const [result] = await pool.execute(
            'INSERT INTO service_api (api_name, api_url, api_key, currency, status) VALUES (?, ?, ?, ?, ?)',
            [api_name, api_url, api_key, currency || 'USD', status || '2']
        );
        res.json({ success: true, message: 'Provider added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding provider:', error);
        res.status(500).json({ success: false, message: 'Failed to add provider' });
    }
});

router.put('/services/providers/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { api_name, api_url, api_key, currency, status } = req.body;
        await pool.execute(
            'UPDATE service_api SET api_name = ?, api_url = ?, api_key = ?, currency = ?, status = ? WHERE id = ?',
            [api_name, api_url, api_key, currency || 'USD', status || '2', id]
        );
        res.json({ success: true, message: 'Provider updated successfully' });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ success: false, message: 'Failed to update provider' });
    }
});

router.delete('/services/providers/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const [services] = await pool.execute(
            'SELECT COUNT(*) as count FROM services WHERE service_api = ? AND service_deleted = "0"',
            [id]
        );
        if (services[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot delete — ${services[0].count} active services use this provider` 
            });
        }
        await pool.execute('DELETE FROM service_api WHERE id = ?', [id]);
        res.json({ success: true, message: 'Provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting provider:', error);
        res.status(500).json({ success: false, message: 'Failed to delete provider' });
    }
});

router.post('/services/providers/:id/test', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const axios = require('axios');
        const [providers] = await pool.execute('SELECT * FROM service_api WHERE id = ?', [id]);
        if (providers.length === 0) {
            return res.status(404).json({ success: false, message: 'Provider not found' });
        }
        const provider = providers[0];
        const formData = new URLSearchParams();
        formData.append('key', provider.api_key);
        formData.append('action', 'balance');
        const response = await axios.post(provider.api_url, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });
        res.json({ success: true, message: 'Connection successful', balance: response.data.balance || response.data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Connection failed: ' + error.message });
    }
});

    router.get('/services/providers/:id/fetch-services', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;

            const [providers] = await pool.execute(
                'SELECT * FROM service_api WHERE id = ?',
                [id]
            );

            if (providers.length === 0) {
                return res.status(404).json({ success: false, message: 'Provider not found' });
            }

            const provider = providers[0];

            const axios = require('axios');
            const formData = new URLSearchParams();
            formData.append('key', provider.api_key);
            formData.append('action', 'services');

            const response = await axios.post(provider.api_url, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000
            });

            let services = [];
            if (Array.isArray(response.data)) {
                services = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                services = response.data.data;
            } else if (response.data.services && Array.isArray(response.data.services)) {
                services = response.data.services;
            }

            services = services.map(service => ({
                ...service,
                rate: typeof service.rate === 'string'
                    ? parseFloat(service.rate.replace(/,/g, ''))
                    : service.rate
            }));

            res.json({
                success: true,
                services: services,
                provider: provider
            });
        } catch (error) {
            console.error('Error fetching provider services:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch provider services' });
        }
    });

    router.get('/services/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;

            const [services] = await pool.execute(`
                SELECT 
                    s.*,
                    c.category_name,
                    sa.api_name as provider_name,
                    sa.currency as provider_currency
                FROM services s
                LEFT JOIN categories_real c ON s.category_id = c.category_id
                LEFT JOIN service_api sa ON s.service_api = sa.id
                WHERE s.service_id = ? AND s.service_deleted = '0'
            `, [id]);

            if (services.length === 0) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }

            res.json({
                success: true,
                service: services[0]
            });
        } catch (error) {
            console.error('Error fetching service:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch service' });
        }
    });

    router.post('/services', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const {
                name, description, time, category_id, package_type, price, min, max,
                provider_id, api_service_id, secret, show_refill, cancelbutton,
                speed, dripfeed, instagram_second, start_count, instagram_private,
                want_username, refill_days, refill_hours, autotime, autopost, overflow, sync
            } = req.body;

            const [lastService] = await connection.execute(
                'SELECT MAX(service_line) as max_line FROM services WHERE category_id = ?',
                [category_id]
            );
            const service_line = (lastService[0].max_line || 0) + 1;

            const defaultLang = Object.keys(name)[0] || 'en';
            const service_name = name[defaultLang] || '';

            const [result] = await connection.execute(`
                INSERT INTO services SET
                    service_name = ?,
                    name_lang = ?,
                    service_description = ?,
                    description_lang = ?,
                    time = ?,
                    time_lang = ?,
                    category_id = ?,
                    service_package = ?,
                    service_price = ?,
                    service_min = ?,
                    service_max = ?,
                    service_api = ?,
                    api_service = ?,
                    api_detail = ?,
                    service_secret = ?,
                    show_refill = ?,
                    cancelbutton = ?,
                    service_speed = ?,
                    service_dripfeed = ?,
                    instagram_second = ?,
                    start_count = ?,
                    instagram_private = ?,
                    want_username = ?,
                    refill_days = ?,
                    refill_hours = ?,
                    service_autotime = ?,
                    service_autopost = ?,
                    service_overflow = ?,
                    service_sync = ?,
                    service_line = ?,
                    service_profit = ?,
                    service_type = '2',
                    service_deleted = '0',
                    price_type = 'normal',
                    avg_days = 0,
                    avg_hours = 0,
                    avg_minutes = 0,
                    avg_many = 0,
                    price_profit = 0
            `, [
                service_name,
                JSON.stringify(name),
                description?.[defaultLang] || '',
                JSON.stringify(description || {}),
                time?.[defaultLang] || 'Not enough data',
                JSON.stringify(time || {}),
                category_id,
                package_type,
                price,
                min,
                max,
                provider_id || 0,
                api_service_id || 0,
                JSON.stringify({}),
                secret || '2',
                show_refill || 'false',
                cancelbutton || '2',
                speed || '1',
                dripfeed || '1',
                instagram_second || '2',
                start_count || 'none',
                instagram_private || '1',
                want_username || '1',
                refill_days || '30',
                refill_hours || '24',
                autotime || 0,
                autopost || 0,
                overflow || 0,
                sync || '1',
                service_line,
                req.body.service_profit || ''
            ]);

            await connection.commit();
            res.json({ success: true, message: 'Service created successfully', id: result.insertId });
        } catch (error) {
            await connection.rollback();
            console.error('Error creating service:', error);
            res.status(500).json({ success: false, message: 'Failed to create service' });
        } finally {
            connection.release();
        }
    });

    router.put('/services/:id', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const {
                name, description, time, category_id, package_type, price, min, max,
                provider_id, api_service_id, secret, show_refill, cancelbutton,
                speed, dripfeed, instagram_second, start_count, instagram_private,
                want_username, refill_days, refill_hours, autotime, autopost, overflow, sync
            } = req.body;

            const [oldData] = await connection.execute(
                'SELECT * FROM services WHERE service_id = ?',
                [id]
            );
            const oldService = oldData[0];

            const defaultLang = Object.keys(name)[0] || 'en';
            const service_name = name[defaultLang] || '';

            let service_line = oldService.service_line;
            if (oldService.category_id != category_id) {
                await connection.execute(
                    'UPDATE services SET service_line = service_line - 1 WHERE category_id = ? AND service_line > ?',
                    [oldService.category_id, oldService.service_line]
                );

                const [lastService] = await connection.execute(
                    'SELECT MAX(service_line) as max_line FROM services WHERE category_id = ?',
                    [category_id]
                );
                service_line = (lastService[0].max_line || 0) + 1;
            }

            await connection.execute(`
                UPDATE services SET
                    service_name = ?,
                    name_lang = ?,
                    service_description = ?,
                    description_lang = ?,
                    time = ?,
                    time_lang = ?,
                    category_id = ?,
                    service_package = ?,
                    service_price = ?,
                    service_min = ?,
                    service_max = ?,
                    service_api = ?,
                    api_service = ?,
                    service_secret = ?,
                    show_refill = ?,
                    cancelbutton = ?,
                    service_speed = ?,
                    service_dripfeed = ?,
                    instagram_second = ?,
                    start_count = ?,
                    instagram_private = ?,
                    want_username = ?,
                    refill_days = ?,
                    refill_hours = ?,
                    service_autotime = ?,
                    service_autopost = ?,
                    service_overflow = ?,
                    service_sync = ?,
                    service_line = ?
                WHERE service_id = ?
            `, [
                service_name,
                JSON.stringify(name),
                description?.[defaultLang] || '',
                JSON.stringify(description || {}),
                time?.[defaultLang] || 'Not enough data',
                JSON.stringify(time || {}),
                category_id,
                package_type,
                price,
                min,
                max,
                provider_id || 0,
                api_service_id || 0,
                secret || '2',
                show_refill || 'false',
                cancelbutton || '2',
                speed || '1',
                dripfeed || '1',
                instagram_second || '2',
                start_count || 'none',
                instagram_private || '1',
                want_username || '1',
                refill_days || '30',
                refill_hours || '24',
                autotime || 0,
                autopost || 0,
                overflow || 0,
                sync || '1',
                service_line,
                id
            ]);

            await connection.commit();
            res.json({ success: true, message: 'Service updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error updating service:', error);
            res.status(500).json({ success: false, message: 'Failed to update service' });
        } finally {
            connection.release();
        }
    });

    router.post('/services/import-from-provider', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { provider_id, services, category_id, profit_percentage, auto_create_categories } = req.body;

            const [provider] = await connection.execute(
                'SELECT * FROM service_api WHERE id = ?',
                [provider_id]
            );

            const categoryMap = new Map();

            for (const apiService of services) {
                let targetCategoryId = category_id;

                if (auto_create_categories && apiService.category) {
                    if (!categoryMap.has(apiService.category)) {
                        const [existingCat] = await connection.execute(
                            'SELECT category_id FROM categories_real WHERE category_name = ? AND category_deleted = "0"',
                            [apiService.category]
                        );

                        if (existingCat.length > 0) {
                            categoryMap.set(apiService.category, existingCat[0].category_id);
                        } else {
                            const [maxLine] = await connection.execute(
                                'SELECT MAX(category_line) as max_line FROM categories_real WHERE category_deleted = "0"'
                            );
                            const newLine = (maxLine[0].max_line || 0) + 1;

                            const [result] = await connection.execute(`
                                INSERT INTO categories_real SET
                                    category_name = ?,
                                    category_line = ?,
                                    category_type = '2',
                                    category_secret = '2',
                                    is_refill = '1',
                                    category_deleted = '0',
                                    category_icon = '{}'
                            `, [apiService.category, newLine]);

                            categoryMap.set(apiService.category, result.insertId);
                        }
                    }
                    targetCategoryId = categoryMap.get(apiService.category);
                }

                const baseRate = parseFloat(apiService.converted_rate ?? apiService.rate);
let price = baseRate * (1 + profit_percentage / 100);

                const [lastService] = await connection.execute(
                    'SELECT MAX(service_line) as max_line FROM services WHERE category_id = ?',
                    [targetCategoryId]
                );
                const service_line = (lastService[0].max_line || 0) + 1;

                const nameObj = { en: apiService.name };
                const descObj = { en: apiService.desc || '' };

                let package_type = '1';
                if (apiService.type) {
                    const typeStr = apiService.type.toString().toLowerCase();

                    if (typeStr === 'default' || typeStr === '1' || typeStr === 'normal') {
                        package_type = '1';
                    } else if (typeStr === '2' || typeStr === 'custom') {
                        package_type = '2';
                    } else if (typeStr === '3' || typeStr === 'comments') {
                        package_type = '3';
                    } else if (typeStr === '4' || typeStr === 'package') {
                        package_type = '4';
                    } else if (typeStr === '5') {
                        package_type = '5';
                    } else if (typeStr === '6' || typeStr === 'dripfeed') {
                        package_type = '6';
                    } else if (typeStr === '7' || typeStr === 'subscription') {
                        package_type = '7';
                    } else if (typeStr === '11') {
                        package_type = '11';
                    } else if (typeStr === '12') {
                        package_type = '12';
                    } else if (typeStr === '14') {
                        package_type = '14';
                    } else if (typeStr === '15') {
                        package_type = '15';
                    } else {
                        const num = parseInt(typeStr);
                        if (!isNaN(num) && num >= 1 && num <= 17) {
                            package_type = num.toString();
                        }
                    }
                }

                let show_refill = 'false';
                if (apiService.refill === '1' || apiService.refill === true || apiService.refill === 'true') {
                    show_refill = 'true';
                }

                let want_username = '1';
                if (apiService.type === '2' || apiService.type === 'custom' ||
                    apiService.name?.toLowerCase().includes('comment') ||
                    apiService.name?.toLowerCase().includes('custom')) {
                    want_username = '2';
                }

                await connection.execute(`
                    INSERT INTO services SET
                        service_name = ?,
                        name_lang = ?,
                        service_description = ?,
                        description_lang = ?,
                        time = ?,
                        time_lang = ?,
                        service_api = ?,
                        api_service = ?,
                        api_detail = ?,
                        category_id = ?,
                        service_line = ?,
                        service_package = ?,
                        service_price = ?,
                        service_min = ?,
                        service_max = ?,
                        show_refill = ?,
                        service_profit = ?,
                        want_username = ?,
                        service_type = '2',
                        service_deleted = '0',
                        service_speed = '1',
                        service_dripfeed = '1',
                        instagram_second = '2',
                        start_count = 'none',
                        instagram_private = '1',
                        refill_days = '30',
                        refill_hours = '24',
                        service_autotime = 0,
                        service_autopost = 0,
                        service_overflow = 0,
                        service_sync = '1',
                        price_type = 'normal',
                        avg_days = 0,
                        avg_hours = 0,
                        avg_minutes = 0,
                        avg_many = 0,
                        price_profit = 0,
                        cancelbutton = '2'
                `, [
                    apiService.name,
                    JSON.stringify(nameObj),
                    apiService.desc || '',
                    JSON.stringify(descObj),
                    apiService.desc || 'Not enough data',
                    JSON.stringify({ en: apiService.desc || 'Not enough data' }),
                    provider_id,
                    apiService.service,
                    JSON.stringify(apiService),
                    targetCategoryId,
                    service_line,
                    package_type,
                    price.toFixed(4),
                    apiService.min || 10,
                    apiService.max || 10000,
                    show_refill,
                    profit_percentage,
                    want_username
                ]);
            }

            await connection.commit();
            res.json({
                success: true,
                message: 'Services imported successfully',
                categories_created: auto_create_categories ? categoryMap.size : 0
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error importing services:', error);
            res.status(500).json({ success: false, message: 'Failed to import services' });
        } finally {
            connection.release();
        }
    });

    router.post('/services/reorder', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { category_id, services } = req.body;

            for (const service of services) {
                await connection.execute(
                    'UPDATE services SET service_line = ? WHERE service_id = ? AND category_id = ?',
                    [service.line, service.id, category_id]
                );
            }

            await connection.commit();
            res.json({ success: true, message: 'Services reordered successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error reordering services:', error);
            res.status(500).json({ success: false, message: 'Failed to reorder services' });
        } finally {
            connection.release();
        }
    });

    router.post('/services/:id/toggle-status', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await pool.execute(
                'UPDATE services SET service_type = ? WHERE service_id = ?',
                [status, id]
            );

            res.json({ success: true, message: `Service ${status === '2' ? 'activated' : 'deactivated'}` });
        } catch (error) {
            console.error('Error toggling service status:', error);
            res.status(500).json({ success: false, message: 'Failed to toggle service status' });
        }
    });

    router.post('/services/:id/toggle-secret', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { secret } = req.body;

            await pool.execute(
                'UPDATE services SET service_secret = ? WHERE service_id = ?',
                [secret, id]
            );

            res.json({ success: true, message: `Service marked as ${secret === '1' ? 'secret' : 'public'}` });
        } catch (error) {
            console.error('Error toggling secret:', error);
            res.status(500).json({ success: false, message: 'Failed to toggle secret status' });
        }
    });

    router.post('/services/:id/toggle-refill', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { enabled } = req.body;

            await pool.execute(
                'UPDATE services SET show_refill = ? WHERE service_id = ?',
                [enabled, id]
            );

            res.json({ success: true, message: `Refill button ${enabled === 'true' ? 'enabled' : 'disabled'}` });
        } catch (error) {
            console.error('Error toggling refill:', error);
            res.status(500).json({ success: false, message: 'Failed to toggle refill button' });
        }
    });

    router.post('/services/:id/toggle-cancel', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { enabled } = req.body;

            await pool.execute(
                'UPDATE services SET cancelbutton = ? WHERE service_id = ?',
                [enabled, id]
            );

            res.json({ success: true, message: `Cancel button ${enabled === '1' ? 'enabled' : 'disabled'}` });
        } catch (error) {
            console.error('Error toggling cancel:', error);
            res.status(500).json({ success: false, message: 'Failed to toggle cancel button' });
        }
    });

    router.delete('/services/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;

            await pool.execute(
                'UPDATE services SET service_deleted = ? WHERE service_id = ?',
                ['1', id]
            );

            res.json({ success: true, message: 'Service deleted successfully' });
        } catch (error) {
            console.error('Error deleting service:', error);
            res.status(500).json({ success: false, message: 'Failed to delete service' });
        }
    });

    router.post('/services/bulk-action', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { action, service_ids } = req.body;

            switch (action) {
                case 'activate':
                    await connection.execute(
                        `UPDATE services SET service_type = '2' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'deactivate':
                    await connection.execute(
                        `UPDATE services SET service_type = '1' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'secret':
                    await connection.execute(
                        `UPDATE services SET service_secret = '1' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'public':
                    await connection.execute(
                        `UPDATE services SET service_secret = '2' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'refill-enable':
                    await connection.execute(
                        `UPDATE services SET show_refill = 'true' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'refill-disable':
                    await connection.execute(
                        `UPDATE services SET show_refill = 'false' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'cancel-enable':
                    await connection.execute(
                        `UPDATE services SET cancelbutton = '1' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'cancel-disable':
                    await connection.execute(
                        `UPDATE services SET cancelbutton = '2' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                case 'delete':
                    await connection.execute(
                        `UPDATE services SET service_deleted = '1' WHERE service_id IN (${service_ids.map(() => '?').join(',')})`,
                        service_ids
                    );
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await connection.commit();
            res.json({ success: true, message: 'Bulk action completed' });
        } catch (error) {
            await connection.rollback();
            console.error('Error in bulk action:', error);
            res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
        } finally {
            connection.release();
        }
    });
    router.get('/categories', adminAuth, async (req, res) => {
        try {
            const [categories] = await pool.execute(`
                SELECT 
                    c.*,
                    COUNT(s.service_id) as service_count,
                    SUM(CASE WHEN s.service_type = '2' THEN 1 ELSE 0 END) as active_services
                FROM categories_real c
                LEFT JOIN services s ON c.category_id = s.category_id AND s.service_deleted = '0'
                WHERE c.category_deleted = '0'
                GROUP BY c.category_id
                ORDER BY c.category_line ASC
            `);

            res.json({
                success: true,
                categories: categories
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch categories' });
        }
    });

    router.post('/categories', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { name, icon_type, icon_class, image_id, position } = req.body;

            let category_line;
            if (position === 'top') {
                const [first] = await connection.execute(
                    'SELECT MIN(category_line) as min_line FROM categories_real WHERE category_deleted = "0"'
                );
                category_line = (first[0].min_line || 0) - 1;
            } else {
                const [last] = await connection.execute(
                    'SELECT MAX(category_line) as max_line FROM categories_real WHERE category_deleted = "0"'
                );
                category_line = (last[0].max_line || 0) + 1;
            }

            const icon = JSON.stringify({
                icon_type: icon_type,
                icon_class: icon_class,
                image_id: image_id
            });

            const [result] = await connection.execute(`
                INSERT INTO categories_real SET
                    category_name = ?,
                    category_line = ?,
                    category_icon = ?,
                    category_type = '2',
                    category_secret = '2',
                    is_refill = '1',
                    category_deleted = '0'
            `, [name, category_line, icon]);

            await connection.commit();
            res.json({ success: true, message: 'Category created successfully', id: result.insertId });
        } catch (error) {
            await connection.rollback();
            console.error('Error creating category:', error);
            res.status(500).json({ success: false, message: 'Failed to create category' });
        } finally {
            connection.release();
        }
    });

    router.put('/categories/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, name_lang, icon_type, icon_class, image_id } = req.body;

            const icon = JSON.stringify({
                icon_type: icon_type,
                icon_class: icon_class,
                image_id: image_id
            });

            await pool.execute(`
                UPDATE categories_real SET
                    category_name = ?,
                    category_name_lang = ?,
                    category_icon = ?
                WHERE category_id = ?
            `, [name, JSON.stringify(name_lang || {}), icon, id]);

            res.json({ success: true, message: 'Category updated successfully' });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ success: false, message: 'Failed to update category' });
        }
    });

    router.post('/categories/:id/toggle-status', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            await pool.execute(
                'UPDATE categories_real SET category_type = ? WHERE category_id = ?',
                [status, id]
            );

            res.json({ success: true, message: `Category ${status === '2' ? 'activated' : 'deactivated'}` });
        } catch (error) {
            console.error('Error toggling category status:', error);
            res.status(500).json({ success: false, message: 'Failed to toggle category status' });
        }
    });

    router.delete('/categories/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;

            await pool.execute(
                'UPDATE categories_real SET category_deleted = "1" WHERE category_id = ?',
                [id]
            );

            res.json({ success: true, message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ success: false, message: 'Failed to delete category' });
        }
    });

    router.post('/categories/reorder', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { categories } = req.body;

            for (const category of categories) {
                await connection.execute(
                    'UPDATE categories_real SET category_line = ? WHERE category_id = ?',
                    [category.line, category.id]
                );
            }

            await connection.commit();
            res.json({ success: true, message: 'Categories reordered successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error reordering categories:', error);
            res.status(500).json({ success: false, message: 'Failed to reorder categories' });
        } finally {
            connection.release();
        }
    });

    router.get('/orders/count', adminAuth, async (req, res) => {
        try {
            const [result] = await pool.execute('SELECT COUNT(*) as total FROM orders');
            res.json({ success: true, total: result[0].total });
        } catch (error) {
            console.error('Error fetching orders count:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch orders count' });
        }
    });

    router.get('/users/count', adminAuth, async (req, res) => {
        try {
            const [result] = await pool.execute('SELECT COUNT(*) as total FROM users');
            res.json({ success: true, total: result[0].total });
        } catch (error) {
            console.error('Error fetching users count:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch users count' });
        }
    });

    router.get('/services/count', adminAuth, async (req, res) => {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as total FROM services WHERE service_deleted = "0" AND service_type = "2"'
            );
            res.json({ success: true, total: result[0].total });
        } catch (error) {
            console.error('Error fetching services count:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch services count' });
        }
    });

    router.get('/wallets/total-balance', adminAuth, async (req, res) => {
        try {
            const [result] = await pool.execute('SELECT SUM(available_balance) as total FROM wallets');
            res.json({ success: true, total: parseFloat(result[0].total || 0).toFixed(2) });
        } catch (error) {
            console.error('Error fetching total balance:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch total balance' });
        }
    });

    router.get('/tickets/active-count', adminAuth, async (req, res) => {
        try {
            const [result] = await pool.execute(
                "SELECT COUNT(*) as total FROM tickets WHERE status IN ('open', 'in_progress', 'waiting')"
            );
            res.json({ success: true, total: result[0].total });
        } catch (error) {
            console.error('Error fetching active tickets:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch active tickets' });
        }
    });

    router.get('/security/analytics', adminAuth, async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 50;

            const [todayAttempts] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
                FROM login_attempts 
                WHERE DATE(attempt_time) = CURDATE()
            `);

            const [allAttempts] = await pool.execute(`
                SELECT 
                    id,
                    CASE 
                        WHEN email LIKE 'PASSWORD_RESET_REQUEST:%' THEN REPLACE(email, 'PASSWORD_RESET_REQUEST:', '')
                        WHEN email LIKE 'PASSWORD_RESET_SUCCESS:%' THEN REPLACE(email, 'PASSWORD_RESET_SUCCESS:', '')
                        WHEN email LIKE 'SIGNUP:%' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(email, ': ', -1), ' -', 1)
                        ELSE email
                    END as clean_email,
                    email as raw_email,
                    ip_address,
                    user_agent,
                    DATE_FORMAT(attempt_time, '%Y-%m-%d %H:%i:%s') as attempt_time,
                    success,
                    CASE 
                        WHEN email LIKE '%PASSWORD%' THEN 'password_reset'
                        WHEN email LIKE '%SIGNUP%' THEN 'signup'
                        ELSE 'login'
                    END as attempt_type
                FROM login_attempts 
                ORDER BY attempt_time DESC
                LIMIT ? 
            `, [limit]);

            const [totalCount] = await pool.execute(`
                SELECT COUNT(*) as total FROM login_attempts
            `);

            const [topFailedIPs] = await pool.execute(`
                SELECT 
                    la.ip_address,
                    la.email,
                    COUNT(*) as attempts,
                    MAX(la.attempt_time) as last_attempt
                FROM login_attempts la
                WHERE la.success = 0 
                GROUP BY la.ip_address, la.email
                ORDER BY attempts DESC 
                LIMIT 10
            `);

            const [weeklyStats] = await pool.execute(`
                SELECT 
                    DATE(attempt_time) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
                FROM login_attempts 
                WHERE attempt_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(attempt_time)
                ORDER BY date DESC
            `);

            const [hourlyData] = await pool.execute(`
                SELECT 
                    HOUR(attempt_time) as hour,
                    COUNT(*) as attempts,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
                FROM login_attempts 
                WHERE attempt_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY HOUR(attempt_time)
                ORDER BY hour
            `);

            res.json({
                success: true,
                analytics: {
                    today: {
                        total: todayAttempts[0].total || 0,
                        successful: todayAttempts[0].successful || 0,
                        failed: todayAttempts[0].failed || 0,
                        success_rate: todayAttempts[0].total > 0
                            ? Math.round((todayAttempts[0].successful / todayAttempts[0].total) * 100)
                            : 100
                    },
                    all_attempts: allAttempts,
                    total_records: totalCount[0].total,
                    top_failed_ips: topFailedIPs,
                    weekly_stats: weeklyStats,
                    hourly_distribution: hourlyData
                }
            });
        } catch (error) {
            console.error('Error fetching security analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch security analytics'
            });
        }
    });

    router.get('/platforms/distribution', adminAuth, async (req, res) => {
        try {
            const [serviceCounts] = await pool.execute(`
                SELECT 
                    c.platform,
                    COUNT(s.service_id) as service_count
                FROM categories c
                LEFT JOIN services s ON c.id = s.category_id AND s.service_deleted = '0' AND s.service_type = '2'
                GROUP BY c.platform
                HAVING service_count > 0
                ORDER BY service_count DESC
            `);

            const platformColors = {
                'tiktok': '#00f2ea',
                'instagram': '#E1306C',
                'facebook': '#4267B2',
                'youtube': '#FF0000',
                'twitter': '#1DA1F2',
                'whatsapp': '#25D366',
                'telegram': '#0088cc',
                'other': '#9CA3AF'
            };

            let distribution = [];

            if (serviceCounts.length > 0) {
                distribution = serviceCounts.map(item => ({
                    name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
                    value: parseInt(item.service_count) || 0,
                    color: platformColors[item.platform.toLowerCase()] || platformColors.other
                }));
            } else {
                const [categoryCounts] = await pool.execute(`
                    SELECT 
                        platform,
                        COUNT(*) as category_count
                    FROM categories 
                    WHERE is_active = 1
                    GROUP BY platform
                    ORDER BY category_count DESC
                `);

                if (categoryCounts.length > 0) {
                    distribution = categoryCounts.map(item => ({
                        name: item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
                        value: parseInt(item.category_count) || 0,
                        color: platformColors[item.platform.toLowerCase()] || platformColors.other
                    }));
                } else {
                    distribution = [
                        { name: 'Facebook', value: 6, color: '#4267B2' },
                        { name: 'Instagram', value: 4, color: '#E1306C' },
                        { name: 'TikTok', value: 0, color: '#00f2ea' },
                        { name: 'Other', value: 0, color: '#9CA3AF' }
                    ];
                }
            }

            res.json({
                success: true,
                distribution: distribution
            });
        } catch (error) {
            console.error('Error fetching platform distribution:', error);
            res.json({
                success: true,
                distribution: [
                    { name: 'Facebook', value: 6, color: '#4267B2' },
                    { name: 'Instagram', value: 4, color: '#E1306C' },
                    { name: 'TikTok', value: 0, color: '#00f2ea' },
                    { name: 'Other', value: 0, color: '#9CA3AF' }
                ]
            });
        }
    });

    router.get('/revenue/daily', adminAuth, async (req, res) => {
        try {
            const [revenue] = await pool.execute(`
                SELECT 
                    DATE(order_create) as date,
                    SUM(order_charge) as total
                FROM orders 
                WHERE order_create >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(order_create)
                ORDER BY date ASC
            `);

            res.json({
                success: true,
                revenue: revenue
            });
        } catch (error) {
            console.error('Error fetching daily revenue:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch daily revenue'
            });
        }
    });

    router.get('/settings/units', adminAuth, async (req, res) => {
        try {
            const [tableExists] = await pool.execute(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'units_per_page'
            `);

            if (tableExists[0].count === 0) {
                return res.json({
                    success: true,
                    units: { orders: 20 }
                });
            }

            const [units] = await pool.execute(
                'SELECT * FROM units_per_page WHERE page = ?',
                ['orders']
            );

            res.json({
                success: true,
                units: { orders: units[0]?.unit || 20 }
            });
        } catch (error) {
            console.error('Error fetching units per page:', error);
            res.json({
                success: true,
                units: { orders: 20 }
            });
        }
    });

    router.get('/analytics/orders', adminAuth, async (req, res) => {
        try {
            const { range = '30days' } = req.query;

            let intervalDays = 30;
            let intervalSQL = '';

            switch (range) {
                case '30days':
                    intervalDays = 30;
                    intervalSQL = '30 DAY';
                    break;
                case '60days':
                    intervalDays = 60;
                    intervalSQL = '60 DAY';
                    break;
                case '90days':
                    intervalDays = 90;
                    intervalSQL = '90 DAY';
                    break;
                case 'year':
                    intervalDays = 365;
                    intervalSQL = '365 DAY';
                    break;
                case 'lifetime':
                    intervalDays = null;
                    intervalSQL = null;
                    break;
                default:
                    intervalDays = 30;
                    intervalSQL = '30 DAY';
            }

            let whereClause = '';
            if (intervalSQL) {
                whereClause = `AND order_create >= DATE_SUB(NOW(), INTERVAL ${intervalSQL})`;
            }

            const chartQuery = `
            SELECT 
                DATE(order_create) as date,
                COUNT(*) as orderCount,
                SUM(order_charge) as revenue,
                SUM(order_profit) as profit
            FROM orders
            WHERE order_status = 'completed'
            ${whereClause}
            GROUP BY DATE(order_create)
            ORDER BY date ASC
        `;

            const [chartData] = await pool.execute(chartQuery);

            let summaryQuery = `
            SELECT 
                COUNT(*) as totalOrders,
                SUM(order_charge) as totalRevenue,
                SUM(order_profit) as totalProfit
            FROM orders
            WHERE order_status = 'completed'
        `;

            if (intervalSQL) {
                summaryQuery += ` AND order_create >= DATE_SUB(NOW(), INTERVAL ${intervalSQL})`;
            }

            const [summaryResult] = await pool.execute(summaryQuery);
            const summary = summaryResult[0];
            const totalOrders = summary.totalOrders || 0;
            const totalRevenue = parseFloat(summary.totalRevenue || 0);
            const totalProfit = parseFloat(summary.totalProfit || 0);

            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

            const formattedChartData = chartData.map(item => ({
                date: item.date,
                formattedDate: new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                }),
                orderCount: parseInt(item.orderCount),
                revenue: parseFloat(item.revenue || 0),
                profit: parseFloat(item.profit || 0)
            }));

            res.json({
                success: true,
                data: {
                    chartData: formattedChartData,
                    summary: {
                        totalOrders,
                        totalRevenue,
                        totalProfit,
                        avgOrderValue,
                        profitMargin
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching order analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch order analytics'
            });
        }
    });

  
    router.post('/services/sync-prices', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { auto_update = false } = req.body;

            const [providers] = await connection.execute(
                'SELECT * FROM service_api WHERE status = "2"'
            );

            const results = {
                total_services: 0,
                updated: 0,
                unchanged: 0,
                failed: 0,
                errors: [],
                updates: [] 
            };

            const axios = require('axios');

            for (const provider of providers) {
                try {
                    const formData = new URLSearchParams();
                    formData.append('key', provider.api_key);
                    formData.append('action', 'services');

                    const response = await axios.post(provider.api_url, formData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 30000
                    });

                    let providerServices = [];
                    if (Array.isArray(response.data)) {
                        providerServices = response.data;
                    } else if (response.data.data && Array.isArray(response.data.data)) {
                        providerServices = response.data.data;
                    } else if (response.data.services && Array.isArray(response.data.services)) {
                        providerServices = response.data.services;
                    }

                    providerServices = providerServices.map(s => ({
                        ...s,
                        rate: typeof s.rate === 'string'
                            ? parseFloat(s.rate.replace(/,/g, ''))
                            : s.rate
                    }));

                    const [dbServices] = await connection.execute(
                        'SELECT * FROM services WHERE service_api = ? AND service_deleted = "0"',
                        [provider.id]
                    );

                    results.total_services += dbServices.length;

                    for (const dbService of dbServices) {
                        try {
                            const providerService = providerServices.find(
                                ps => ps.service && ps.service.toString() === dbService.api_service.toString()
                            );

                            if (!providerService) {
                                results.failed++;
                                results.errors.push({
                                    service_id: dbService.service_id,
                                    service_name: dbService.service_name,
                                    error: 'Service not found in provider'
                                });
                                continue;
                            }

                            const profitPercent = parseFloat(dbService.service_profit) || 0;
                            const providerRate = providerService.rate;
                            const calculatedPrice = providerRate * (1 + profitPercent / 100);

                            const currentPrice = parseFloat(dbService.service_price);
                            const priceDifference = Math.abs(calculatedPrice - currentPrice);
                            const hasPriceChanged = priceDifference > 0.001; 

                            if (hasPriceChanged) {
                                if (auto_update) {
                                    await connection.execute(
                                        `UPDATE services SET 
                    service_price = ?,
                    api_detail = ?,
                    is_new = 1
                  WHERE service_id = ?`,
                                        [
                                            calculatedPrice.toFixed(4),
                                            JSON.stringify(providerService),
                                            dbService.service_id
                                        ]
                                    );

                                    results.updated++;
                                    results.updates.push({
                                        service_id: dbService.service_id,
                                        service_name: dbService.service_name,
                                        old_price: currentPrice,
                                        new_price: calculatedPrice,
                                        profit_percent: profitPercent,
                                        provider_rate: providerRate,
                                        status: 'updated'
                                    });
                                } else {
             
                                    await connection.execute(
                                        'UPDATE services SET is_new = 1 WHERE service_id = ?',
                                        [dbService.service_id]
                                    );

                                    results.updates.push({
                                        service_id: dbService.service_id,
                                        service_name: dbService.service_name,
                                        old_price: currentPrice,
                                        new_price: calculatedPrice,
                                        profit_percent: profitPercent,
                                        provider_rate: providerRate,
                                        status: 'pending'
                                    });
                                }
                            } else {
                        
                                await connection.execute(
                                    'UPDATE services SET api_detail = ? WHERE service_id = ?',
                                    [JSON.stringify(providerService), dbService.service_id]
                                );

                                results.unchanged++;
                            }

                        } catch (error) {
                            console.error(`Error processing service ${dbService.service_id}:`, error);
                            results.failed++;
                            results.errors.push({
                                service_id: dbService.service_id,
                                service_name: dbService.service_name,
                                error: error.message
                            });
                        }
                    }

                } catch (error) {
                    console.error(`Error fetching from provider ${provider.api_name}:`, error);
                    results.errors.push({
                        provider: provider.api_name,
                        error: error.message
                    });
                }
            }

            await connection.commit();

            res.json({
                success: true,
                message: auto_update ? 'Price sync completed with auto-updates' : 'Price sync preview completed',
                results: results
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error syncing prices:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to sync prices',
                error: error.message
            });
        } finally {
            connection.release();
        }
    });

    router.post('/services/reset-new-flags', adminAuth, async (req, res) => {
        try {
            const { service_ids } = req.body;

            if (service_ids && service_ids.length > 0) {
 
                const placeholders = service_ids.map(() => '?').join(',');
                await pool.execute(
                    `UPDATE services SET is_new = 0 WHERE service_id IN (${placeholders})`,
                    service_ids
                );
            } else {
   
                await pool.execute('UPDATE services SET is_new = 0');
            }

            res.json({
                success: true,
                message: 'New flags reset successfully'
            });

        } catch (error) {
            console.error('Error resetting new flags:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset new flags'
            });
        }
    });


    router.post('/services/apply-price-updates', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { updates } = req.body;
            let updated = 0;

            for (const update of updates) {
                await connection.execute(
                    `UPDATE services SET 
          service_price = ?,
          api_detail = ?,
          is_new = 1,
          new_added_date = NOW()  /* MySQL NOW() uses server time */
        WHERE service_id = ?`,
                    [
                        update.new_price.toFixed(4),
                        JSON.stringify({
                            ...update,
                            updated_at: new Date().toISOString(),
                            previous_price: update.old_price
                        }),
                        update.service_id
                    ]
                );
                updated++;
            }

            await connection.commit();

            res.json({
                success: true,
                message: `Successfully updated ${updated} services`,
                updated: updated
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error applying price updates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to apply price updates'
            });
        } finally {
            connection.release();
        }
    });
    return router;
};
