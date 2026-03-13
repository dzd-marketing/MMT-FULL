const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = (pool) => {
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

            const [users] = await pool.execute(`
                SELECT 
                    u.id,
                    u.full_name as name,
                    u.email,
                    u.balance,
                    u.discount_percentage,
                    w.available_balance as wallet_balance,
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

    // ============================================================
    // QUEUE PROCESSOR — called when an order completes/cancels
    // Finds the next queued order for the same link+service+user
    // and sends it to the provider
    // ============================================================
    const processQueue = async (completedOrderUrl, completedServiceId, userId) => {
        try {
            // Find next queued order for same link + service + user
            const [queuedOrders] = await pool.execute(`
                SELECT o.*, sa.api_key, sa.api_url
                FROM orders o
                LEFT JOIN service_api sa ON o.order_api = sa.id
                WHERE o.order_url = ?
                AND o.service_id = ?
                AND o.user_id = ?
                AND o.order_status = 'queued'
                ORDER BY o.order_create ASC
                LIMIT 1
            `, [completedOrderUrl, completedServiceId, userId]);

            if (queuedOrders.length === 0) {
                console.log(`Queue: No queued orders for ${completedOrderUrl}`);
                return;
            }

            const nextOrder = queuedOrders[0];
            let apiOrderId = 0;
            let apiResponse = null;
            let orderError = '-';

            console.log(`Queue: Processing queued order #${nextOrder.order_id}`);

            // Send to provider API
            if (nextOrder.order_api > 0 && nextOrder.api_key && nextOrder.api_url) {
                try {
                    const apiData = new URLSearchParams();
                    apiData.append('key', nextOrder.api_key);
                    apiData.append('action', 'add');
                    apiData.append('service', nextOrder.api_serviceid);
                    apiData.append('link', nextOrder.order_url);

                    // Handle dripfeed
                    if (nextOrder.dripfeed === '2') {
                        apiData.append('quantity', nextOrder.dripfeed_totalquantity || nextOrder.order_quantity);
                        if (nextOrder.dripfeed_runs) apiData.append('runs', nextOrder.dripfeed_runs);
                        if (nextOrder.dripfeed_interval) apiData.append('interval', nextOrder.dripfeed_interval);
                    } else {
                        apiData.append('quantity', nextOrder.order_quantity);
                    }

                    // Handle comments if stored in extras
                    if (nextOrder.order_extras) {
                        try {
                            const extras = JSON.parse(nextOrder.order_extras);
                            if (extras.comments && extras.comments.length > 0) {
                                apiData.append('comments', extras.comments.join("\n"));
                            }
                        } catch (e) { /* ignore parse errors */ }
                    }

                    const response = await axios.post(nextOrder.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 30000
                    });

                    apiResponse = JSON.stringify(response.data);

                    if (response.data?.order) {
                        apiOrderId = response.data.order;
                    } else if (response.data?.error) {
                        orderError = response.data.error;
                    }

                    console.log(`Queue: Order #${nextOrder.order_id} sent to provider, API order ID: ${apiOrderId}`);

                } catch (apiErr) {
                    console.error(`Queue: API error for order #${nextOrder.order_id}:`, apiErr.message);
                    orderError = apiErr.message;
                    apiResponse = JSON.stringify({ error: apiErr.message });
                }
            }

            // Update queued order to active status
            await pool.execute(`
                UPDATE orders 
                SET order_status = ?,
                    api_orderid = ?,
                    order_detail = ?,
                    order_error = ?,
                    last_check = NOW()
                WHERE order_id = ?
            `, [
                apiOrderId > 0 ? 'processing' : 'pending',
                apiOrderId || 0,
                apiResponse || '',
                orderError,
                nextOrder.order_id
            ]);

            console.log(`Queue: Order #${nextOrder.order_id} status updated to ${apiOrderId > 0 ? 'processing' : 'pending'}`);

        } catch (err) {
            console.error('Queue processor error:', err.message);
        }
    };

    router.get('/categories', async (req, res) => {
        try {
            const [services] = await pool.execute(`
                SELECT DISTINCT service_name FROM services WHERE service_deleted = '0'
            `);

            const detectPlatform = (name) => {
                const n = (name || '').toLowerCase();
                if (n.includes('tiktok')) return 'tiktok';
                if (n.includes('instagram')) return 'instagram';
                if (n.includes('youtube')) return 'youtube';
                if (n.includes('facebook')) return 'facebook';
                if (n.includes('twitter') || n.includes('tweet') || n.includes(' x ')) return 'twitter';
                if (n.includes('telegram')) return 'telegram';
                if (n.includes('whatsapp')) return 'whatsapp';
                if (n.includes('linkedin')) return 'linkedin';
                return 'other';
            };

            const platformOrder = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'telegram', 'whatsapp', 'linkedin', 'other'];
            const platformSet = new Set(services.map(s => detectPlatform(s.service_name)));
            const categories = platformOrder
                .filter(p => platformSet.has(p))
                .map((p, i) => ({ id: i + 1, platform: p, name: p, slug: p }));

            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch categories' });
        }
    });

    router.get('/services', async (req, res) => {
        try {
            const { platform } = req.query;

            let query = `
                SELECT 
                    s.service_id,
                    s.service_name,
                    s.service_description,
                    s.service_price,
                    s.service_min,
                    s.service_max,
                    s.service_package,
                    s.service_dripfeed,
                    s.category_id,
                    LOWER(COALESCE(c.platform, 'other')) as platform,
                    c.name as category_name,
                    c.slug as category_slug,
                    s.service_api,
                    s.api_service,
                    CONCAT(
                        CASE WHEN s.avg_days > 0 THEN CONCAT(s.avg_days, 'd ') ELSE '' END,
                        CASE WHEN s.avg_hours > 0 THEN CONCAT(s.avg_hours, 'h ') ELSE '' END,
                        CASE WHEN s.avg_minutes > 0 THEN CONCAT(s.avg_minutes, 'm') ELSE '' END
                    ) as avg_time
                FROM services s
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE s.service_deleted = '0'
            `;

            const params = [];
            if (platform && platform !== 'all') {
                query += ` AND LOWER(c.platform) = LOWER(?)`;
                params.push(platform);
            }
            query += ` ORDER BY c.platform, s.service_line ASC`;

            const [services] = await pool.execute(query, params);

            const detectPlatform = (name) => {
                const n = (name || '').toLowerCase();
                if (n.includes('tiktok')) return 'tiktok';
                if (n.includes('instagram')) return 'instagram';
                if (n.includes('youtube')) return 'youtube';
                if (n.includes('facebook')) return 'facebook';
                if (n.includes('twitter') || n.includes('tweet') || n.includes(' x ')) return 'twitter';
                if (n.includes('telegram')) return 'telegram';
                if (n.includes('whatsapp')) return 'whatsapp';
                if (n.includes('linkedin')) return 'linkedin';
                return 'other';
            };

            const formattedServices = services.map(service => ({
                ...service,
                service_price: service.service_price.replace(/,/g, ''),
                service_min: parseInt(service.service_min) || 0,
                service_max: parseInt(service.service_max) === 2147483647 ? 10000000 : parseInt(service.service_max) || 0,
                avg_time: service.avg_time || 'Not enough data',
                platform: detectPlatform(service.service_name)
            }));

            res.json({ success: true, services: formattedServices });

        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch services' });
        }
    });

    router.post('/calculate', authMiddleware, async (req, res) => {
        try {
            const { service_id, quantity } = req.body;

            if (!service_id || !quantity) {
                return res.status(400).json({ success: false, message: 'Service ID and quantity are required' });
            }

            const [services] = await pool.execute(`
                SELECT service_price, service_min, service_max 
                FROM services 
                WHERE service_id = ? AND service_deleted = '0'
            `, [service_id]);

            if (services.length === 0) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }

            const service = services[0];
            const pricePerUnit = parseFloat(service.service_price.replace(/,/g, '')) / 1000;
            let charge = pricePerUnit * quantity;

            if (req.user.discount_percentage > 0) {
                charge = charge - (charge * (req.user.discount_percentage / 100));
            }

            const min = parseInt(service.service_min) || 0;
            const max = parseInt(service.service_max) === 2147483647 ? 10000000 : parseInt(service.service_max) || 0;

            if (quantity < min || quantity > max) {
                return res.status(400).json({
                    success: false,
                    message: `Quantity must be between ${min} and ${max === 10000000 ? '∞' : max}`
                });
            }

            res.json({
                success: true,
                charge: charge.toFixed(2),
                price_per_1k: service.service_price.replace(/,/g, ''),
                discount_applied: req.user.discount_percentage
            });

        } catch (error) {
            console.error('Error calculating price:', error);
            res.status(500).json({ success: false, message: 'Failed to calculate price' });
        }
    });

    router.post('/', authMiddleware, async (req, res) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const { service_id, link, quantity, comments } = req.body;
            const user_id = req.user.id;

            if (!service_id || !link || !quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Service ID, link, and quantity are required'
                });
            }

            const [services] = await connection.execute(`
                SELECT s.*, sa.api_key, sa.api_url, sa.api_type 
                FROM services s
                LEFT JOIN service_api sa ON s.service_api = sa.id
                WHERE s.service_id = ? AND s.service_deleted = '0'
            `, [service_id]);

            if (services.length === 0) {
                return res.status(404).json({ success: false, message: 'Service not found' });
            }

            const service = services[0];
            const min = parseInt(service.service_min) || 0;
            const max = parseInt(service.service_max) === 2147483647 ? 10000000 : parseInt(service.service_max) || 0;

            const isDripfeed = req.body.dripfeed === '2';
            const dripfeedRuns = parseInt(req.body.dripfeed_runs) || 1;
            const totalQuantity = isDripfeed ? quantity * dripfeedRuns : quantity;

            if (totalQuantity < min || quantity > max) {
                return res.status(400).json({
                    success: false,
                    message: isDripfeed
                        ? `Total quantity (${quantity} × ${dripfeedRuns} runs = ${totalQuantity}) must be at least ${min}`
                        : `Quantity must be between ${min} and ${max === 10000000 ? '∞' : max}`
                });
            }

            if ((service.service_package === '3' || service.service_package === '4') && !comments) {
                return res.status(400).json({ success: false, message: 'Comments are required for this service' });
            }

            const pricePerUnit = parseFloat(service.service_price.replace(/,/g, '')) / 1000;
            let charge = pricePerUnit * totalQuantity;

            if (req.user.discount_percentage > 0) {
                charge = charge - (charge * (req.user.discount_percentage / 100));
            }

            const profitPercentage = parseFloat(service.service_profit) || 0;
            let orderProfit = 0;
            if (profitPercentage > 0) {
                const originalCost = charge / (1 + (profitPercentage / 100));
                orderProfit = charge - originalCost;
            }

            const [wallets] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

            if (wallets.length === 0) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            const userBalance = parseFloat(wallets[0].available_balance) || 0;
            if (userBalance < charge) {
                return res.status(400).json({ success: false, message: 'Insufficient balance' });
            }

            let extras = '';
            if ((service.service_package === '3' || service.service_package === '4') && comments) {
                const commentsArray = Array.isArray(comments) ? comments : comments.split('\n');
                extras = JSON.stringify({ comments: commentsArray.filter((c) => c.trim()) });
            }

            // ============================================================
            // QUEUE CHECK — is there an active order for same link+service?
            // ============================================================
            const [activeOrders] = await connection.execute(`
                SELECT order_id FROM orders 
                WHERE user_id = ?
                AND order_url = ?
                AND service_id = ?
                AND order_status IN ('pending', 'processing', 'inprogress', 'queued')
                LIMIT 1
            `, [user_id, link, service_id]);

            const shouldQueue = activeOrders.length > 0;
            // ============================================================

            let apiOrderId = 0;
            let apiResponse = null;
            let orderError = '-';

            // Only call provider API if NOT queued
            if (!shouldQueue && service.service_api > 0 && service.api_key && service.api_url) {
                try {
                    const apiData = new URLSearchParams();
                    apiData.append('key', service.api_key);
                    apiData.append('action', 'add');
                    apiData.append('service', service.api_service);
                    apiData.append('link', link);

                    if (isDripfeed) {
                        apiData.append('quantity', quantity);
                        apiData.append('runs', req.body.dripfeed_runs);
                        apiData.append('interval', req.body.dripfeed_interval);
                    } else {
                        apiData.append('quantity', quantity);
                    }

                    if (service.service_package === '3' || service.service_package === '4') {
                        const commentsArray = Array.isArray(comments) ? comments : comments.split('\n');
                        const commentsString = commentsArray.filter(c => c.trim()).join("\n");
                        apiData.append('comments', commentsString);
                    }

                    const response = await axios.post(service.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    apiResponse = JSON.stringify(response.data);

                    if (response.data && response.data.order) {
                        apiOrderId = response.data.order;
                    } else if (response.data && response.data.error) {
                        orderError = response.data.error;
                    }

                } catch (apiError) {
                    console.error('API Error:', apiError.message);
                    orderError = apiError.message;
                    apiResponse = JSON.stringify({ error: apiError.message });
                }
            }

            // Determine order status
            let orderStatus;
            if (shouldQueue) {
                orderStatus = 'queued';
            } else if (apiOrderId > 0) {
                orderStatus = 'processing';
            } else {
                orderStatus = 'pending';
            }

            const [orderResult] = await connection.execute(`
                INSERT INTO orders (
                    user_id,
                    service_id,
                    order_service_name,
                    order_quantity,
                    order_charge,
                    order_profit, 
                    order_url,
                    order_status,
                    order_extras,
                    order_create,
                    order_start,
                    order_error,
                    dripfeed,
                    dripfeed_runs,
                    dripfeed_interval,
                    dripfeed_totalquantity,
                    dripfeed_totalcharges,
                    dripfeed_status,
                    subscriptions_type,
                    order_where,
                    refill_status,
                    is_refill,
                    refill,
                    cancelbutton,
                    show_refill,
                    avg_done,
                    order_increase,
                    last_check,
                    api_orderid,
                    order_detail,
                    order_api,
                    api_serviceid,
                    api_charge
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, ?, ?, ?, ?, ?, ?, ?, '1', 'site', 'Pending', '1', '1', '1', 'true', '1', 0, NOW(), ?, ?, ?, ?, 0)
            `, [
                user_id,
                service_id,
                service.service_name,
                totalQuantity,
                charge,
                orderProfit,
                link,
                orderStatus,
                extras,
                orderError,
                req.body.dripfeed || '1',
                req.body.dripfeed_runs || 0,
                req.body.dripfeed_interval || 0,
                totalQuantity,
                charge,
                'active',
                apiOrderId || 0,
                apiResponse || '',
                service.service_api || 0,
                service.api_service || 0
            ]);

            const orderId = orderResult.insertId;

            await connection.execute(`
                UPDATE wallets 
                SET available_balance = available_balance - ?,
                    spent_balance = spent_balance + ?,
                    total_history_balance = total_history_balance + ?
                WHERE user_id = ?
            `, [charge, charge, charge, user_id]);

            await connection.execute(`
                UPDATE users 
                SET balance = balance - ?,
                    spent = spent + ?
                WHERE id = ?
            `, [charge, charge, user_id]);

            await connection.commit();

            const [updatedWallet] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

            const message = shouldQueue
                ? 'Order queued — will be sent after current order for this link completes'
                : (apiOrderId > 0 ? 'Order placed successfully with API' : 'Order placed successfully (Manual)');

            res.json({
                success: true,
                message,
                order_id: orderId,
                order_status: orderStatus,
                queued: shouldQueue,
                api_order_id: apiOrderId || null,
                charge: charge.toFixed(2),
                profit: orderProfit.toFixed(2),
                balance: updatedWallet[0].available_balance,
                api_status: shouldQueue ? 'queued' : (apiOrderId > 0 ? 'success' : 'pending')
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error placing order:', error);
            res.status(500).json({ success: false, message: 'Failed to place order' });
        } finally {
            connection.release();
        }
    });

    router.get('/my-orders', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;
            const { page = 1, limit = 20, status } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    o.order_id,
                    o.user_id,
                    o.service_id,
                    COALESCE(o.order_service_name, s.service_name, 'Service Unavailable') as service_name,
                    o.order_quantity,
                    o.order_charge,
                    o.order_profit,
                    o.order_url,
                    o.order_status,
                    o.order_create,
                    o.order_start,
                    o.order_remains,
                    o.order_extras,
                    o.dripfeed,
                    o.api_orderid,
                    o.order_error,
                    o.is_refill,
                    o.refill,
                    o.cancelbutton,
                    o.refill_status,
                    DATE_FORMAT(o.order_create, '%Y-%m-%d %H:%i:%s') as order_date
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE o.user_id = ?
            `;

            const queryParams = [user_id];

            if (status && status !== 'all') {
                query += ` AND o.order_status = ?`;
                queryParams.push(status);
            }

            query += ` ORDER BY o.order_create DESC LIMIT ? OFFSET ?`;
            queryParams.push(parseInt(limit), offset);

            const [orders] = await pool.execute(query, queryParams);

            let countQuery = `SELECT COUNT(*) as total FROM orders WHERE user_id = ?`;
            const countParams = [user_id];

            if (status && status !== 'all') {
                countQuery += ` AND order_status = ?`;
                countParams.push(status);
            }

            const [totalCount] = await pool.execute(countQuery, countParams);

            const formattedOrders = orders.map(order => ({
                order_id: order.order_id,
                user_id: order.user_id,
                service_id: order.service_id,
                service_name: order.service_name,
                order_quantity: parseInt(order.order_quantity) || 0,
                order_charge: parseFloat(order.order_charge),
                order_profit: parseFloat(order.order_profit) || 0,
                order_url: order.order_url,
                order_status: order.order_status,
                order_create: order.order_create,
                order_date: order.order_date,
                order_start: parseInt(order.order_start) || 0,
                order_remains: parseInt(order.order_remains) || 0,
                order_extras: order.order_extras,
                dripfeed: order.dripfeed,
                api_orderid: order.api_orderid,
                order_error: order.order_error,
                is_refill: order.is_refill || '0',
                refill: order.refill || '0',
                cancelbutton: order.cancelbutton || '0',
                refill_status: order.refill_status || 'Pending'
            }));

            res.json({
                success: true,
                orders: formattedOrders,
                pagination: {
                    total: totalCount[0].total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount[0].total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
    });

    router.get('/:id', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const [orders] = await pool.execute(`
                SELECT 
                    o.*,
                    s.service_name,
                    s.service_package,
                    s.service_description,
                    s.service_price,
                    s.service_min,
                    s.service_max
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [id, user_id]);

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const order = orders[0];
            const formattedOrder = {
                ...order,
                order_charge: parseFloat(order.order_charge).toFixed(2),
                order_profit: parseFloat(order.order_profit).toFixed(2) || '0.00',
                order_quantity: parseInt(order.order_quantity) || 0,
                order_start: parseInt(order.order_start) || 0,
                order_remains: parseInt(order.order_remains) || 0,
                api_charge: parseFloat(order.api_charge).toFixed(2) || '0.00'
            };

            res.json({ success: true, order: formattedOrder });

        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch order' });
        }
    });

    router.post('/:id/sync-status', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const [orders] = await pool.execute(`
                SELECT o.*, sa.api_key, sa.api_url
                FROM orders o
                LEFT JOIN service_api sa ON o.order_api = sa.id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [id, user_id]);

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const order = orders[0];

            // Queued orders can't be synced — they haven't been sent yet
            if (order.order_status === 'queued') {
                return res.json({
                    success: true,
                    message: 'Order is queued — waiting for previous order to complete',
                    order
                });
            }

            const lockedStatuses = ['canceled', 'completed'];
            if (lockedStatuses.includes(order.order_status)) {
                return res.json({
                    success: true,
                    message: `Order is ${order.order_status} — no sync needed`,
                    order
                });
            }

            if (order.api_orderid > 0 && order.api_key && order.api_url) {
                try {
                    const apiData = new URLSearchParams();
                    apiData.append('key', order.api_key);
                    apiData.append('action', 'status');
                    apiData.append('order', order.api_orderid);

                    const response = await axios.post(order.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });

                    if (response.data) {
                        const updateData = [];
                        const queryParams = [];
                        let newStatus = null;

                        if (response.data.status) {
                            let status = response.data.status.toLowerCase();
                            if (status.includes('completed')) status = 'completed';
                            else if (status.includes('processing')) status = 'processing';
                            else if (status.includes('inprogress')) status = 'inprogress';
                            else if (status.includes('partial')) status = 'partial';
                            else if (status.includes('cancel')) status = 'canceled';
                            else status = 'pending';

                            newStatus = status;

                            if (!lockedStatuses.includes(order.order_status)) {
                                updateData.push('order_status = ?');
                                queryParams.push(status);
                            }
                        }

                        if (response.data.remains !== undefined) {
                            updateData.push('order_remains = ?');
                            queryParams.push(response.data.remains);
                        }

                        if (response.data.start_count !== undefined) {
                            updateData.push('order_start = ?');
                            queryParams.push(response.data.start_count);
                        }

                        if (response.data.charge !== undefined) {
                            updateData.push('api_charge = ?');
                            queryParams.push(response.data.charge);
                        }

                        updateData.push('last_check = NOW()');

                        if (updateData.length > 0) {
                            queryParams.push(id);
                            await pool.execute(`
                                UPDATE orders SET ${updateData.join(', ')} WHERE order_id = ?
                            `, queryParams);
                        }

                        // ✅ Trigger queue if order completed/canceled/partial
                        if (newStatus && ['completed', 'canceled', 'partial'].includes(newStatus)) {
                            processQueue(order.order_url, order.service_id, order.user_id);
                        }

                        const [updatedOrders] = await pool.execute(`SELECT * FROM orders WHERE order_id = ?`, [id]);

                        return res.json({
                            success: true,
                            message: 'Status synced successfully',
                            order: updatedOrders[0]
                        });
                    }
                } catch (apiError) {
                    console.error('API sync error:', apiError);
                }
            }

            res.json({ success: true, message: 'No API sync needed', order });

        } catch (error) {
            console.error('Error syncing order status:', error);
            res.status(500).json({ success: false, message: 'Failed to sync order status' });
        }
    });

    router.post('/sync-all-status', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;

            const [orders] = await pool.execute(`
                SELECT o.order_id, o.order_url, o.service_id, o.user_id, o.api_orderid, o.order_status, sa.api_key, sa.api_url
                FROM orders o
                LEFT JOIN service_api sa ON o.order_api = sa.id
                WHERE o.user_id = ? 
                    AND o.order_status IN ('pending', 'processing', 'inprogress', 'partial')
                    AND o.api_orderid > 0
            `, [user_id]);

            const results = [];

            for (const order of orders) {
                if (order.api_orderid > 0 && order.api_key && order.api_url) {
                    try {
                        const apiData = new URLSearchParams();
                        apiData.append('key', order.api_key);
                        apiData.append('action', 'status');
                        apiData.append('order', order.api_orderid);

                        const response = await axios.post(order.api_url, apiData, {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                        });

                        if (response.data) {
                            const updateData = [];
                            const queryParams = [];
                            let newStatus = null;

                            if (response.data.status) {
                                let status = response.data.status.toLowerCase();
                                if (status.includes('completed')) status = 'completed';
                                else if (status.includes('processing')) status = 'processing';
                                else if (status.includes('inprogress')) status = 'inprogress';
                                else if (status.includes('partial')) status = 'partial';
                                else if (status.includes('cancel')) status = 'canceled';
                                else status = 'pending';

                                newStatus = status;
                                updateData.push('order_status = ?');
                                queryParams.push(status);
                            }

                            if (response.data.remains !== undefined) {
                                updateData.push('order_remains = ?');
                                queryParams.push(response.data.remains);
                            }

                            if (response.data.start_count !== undefined) {
                                updateData.push('order_start = ?');
                                queryParams.push(response.data.start_count);
                            }

                            if (response.data.charge !== undefined) {
                                updateData.push('api_charge = ?');
                                queryParams.push(response.data.charge);
                            }

                            updateData.push('last_check = NOW()');

                            if (updateData.length > 0) {
                                queryParams.push(order.order_id);
                                await pool.execute(`
                                    UPDATE orders SET ${updateData.join(', ')} WHERE order_id = ?
                                `, queryParams);
                            }

                            // ✅ Trigger queue if order completed/canceled/partial
                            if (newStatus && ['completed', 'canceled', 'partial'].includes(newStatus)) {
                                processQueue(order.order_url, order.service_id, order.user_id);
                            }

                            results.push({ order_id: order.order_id, success: true });
                        }
                    } catch (error) {
                        results.push({ order_id: order.order_id, success: false, error: error.message });
                    }
                }
            }

            res.json({ success: true, message: `Synced ${results.length} orders`, results });

        } catch (error) {
            console.error('Error syncing all orders:', error);
            res.status(500).json({ success: false, message: 'Failed to sync orders' });
        }
    });

    router.post('/:id/refill', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const [orders] = await pool.execute(`
                SELECT o.*, sa.api_key, sa.api_url
                FROM orders o
                LEFT JOIN service_api sa ON o.order_api = sa.id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [id, user_id]);

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const order = orders[0];

            if (order.is_refill !== '1' && order.refill !== '1') {
                return res.status(400).json({ success: false, message: 'Refill is not available for this service' });
            }

            if (!['completed', 'partial'].includes(order.order_status)) {
                return res.status(400).json({ success: false, message: 'Refill is only available for completed or partial orders' });
            }

            const orderDate = new Date(order.order_create).getTime();
            const hoursElapsed = (Date.now() - orderDate) / (1000 * 60 * 60);
            if (hoursElapsed < 24) {
                const hoursRemaining = Math.ceil(24 - hoursElapsed);
                return res.status(400).json({
                    success: false,
                    message: `Refill will be available in ${hoursRemaining} hour(s)`
                });
            }

            if (!order.api_orderid || !order.api_key || !order.api_url) {
                return res.status(400).json({ success: false, message: 'No API order linked to this order' });
            }

            const apiData = new URLSearchParams();
            apiData.append('key', order.api_key);
            apiData.append('action', 'refill');
            apiData.append('order', order.api_orderid);

            let apiResponse;
            try {
                apiResponse = await axios.post(order.api_url, apiData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
            } catch (apiError) {
                return res.status(500).json({ success: false, message: `Provider API error: ${apiError.message}` });
            }

            if (apiResponse.data && apiResponse.data.error) {
                return res.status(400).json({ success: false, message: `Provider rejected refill: ${apiResponse.data.error}` });
            }

            const refillId = apiResponse.data?.refill || 0;

            await pool.execute(`
                UPDATE orders SET refill_status = 'Refilling', api_refillid = ?, last_check = NOW()
                WHERE order_id = ?
            `, [refillId, id]);

            res.json({ success: true, message: 'Refill request submitted successfully', refill_id: refillId });

        } catch (error) {
            console.error('Refill unexpected error:', error.message, error.stack);
            res.status(500).json({ success: false, message: error.message || 'Failed to request refill' });
        }
    });

    router.post('/:id/cancel', authMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.id;

            const [orders] = await pool.execute(`
                SELECT o.*, sa.api_key, sa.api_url
                FROM orders o
                LEFT JOIN service_api sa ON o.order_api = sa.id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [id, user_id]);

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const order = orders[0];

            // Allow canceling queued orders too
            const cancelableStatuses = ['pending', 'processing', 'inprogress', 'queued'];
            if (!cancelableStatuses.includes(order.order_status)) {
                return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
            }

            // Queued orders don't need cancelbutton check — they haven't been sent to provider
            if (order.order_status !== 'queued' && order.cancelbutton !== '1') {
                return res.status(400).json({ success: false, message: 'Cancellation is not available for this service' });
            }

            let providerCancelled = false;
            let refundAmount = order.order_charge;

            // Only call provider cancel if order was actually sent (not queued)
            if (order.order_status !== 'queued' && order.api_orderid && order.api_key && order.api_url) {
                try {
                    const apiData = new URLSearchParams();
                    apiData.append('key', order.api_key);
                    apiData.append('action', 'cancel');
                    apiData.append('orders', order.api_orderid);

                    const apiResponse = await axios.post(order.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 10000
                    });

                    if (apiResponse.data && !apiResponse.data.error) {
                        providerCancelled = true;

                        const statusData = new URLSearchParams();
                        statusData.append('key', order.api_key);
                        statusData.append('action', 'status');
                        statusData.append('order', order.api_orderid);

                        try {
                            const statusResponse = await axios.post(order.api_url, statusData, {
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                timeout: 10000
                            });

                            if (statusResponse.data && statusResponse.data.remains !== undefined) {
                                const remains = parseInt(statusResponse.data.remains) || 0;
                                const quantity = parseInt(order.order_quantity) || 1;
                                const pricePerUnit = parseFloat(order.order_charge) / quantity;
                                refundAmount = parseFloat((pricePerUnit * remains).toFixed(6));
                            }
                        } catch (statusErr) {
                            console.error('Status check after cancel failed:', statusErr.message);
                        }
                    } else {
                        const providerError = apiResponse.data?.error || 'Unknown provider error';
                        return res.status(400).json({ success: false, message: `Provider rejected cancellation: ${providerError}` });
                    }
                } catch (apiError) {
                    providerCancelled = false;
                }
            }

            await pool.execute(`
                UPDATE orders SET order_status = 'canceled', last_check = NOW() WHERE order_id = ?
            `, [id]);

            if (refundAmount > 0) {
                await pool.execute(`
                    UPDATE wallets 
                    SET available_balance = available_balance + ?,
                        spent_balance = GREATEST(0, spent_balance - ?)
                    WHERE user_id = ?
                `, [refundAmount, refundAmount, user_id]);
            }

            // ✅ Trigger queue processing after cancel (queued orders waiting can now proceed)
            processQueue(order.order_url, order.service_id, user_id);

            const isFullRefund = Math.abs(refundAmount - order.order_charge) < 0.001;

            res.json({
                success: true,
                message: order.order_status === 'queued' 
                    ? 'Queued order cancelled with full refund' 
                    : 'Order cancelled successfully',
                refund_amount: refundAmount,
                refund_type: isFullRefund ? 'full' : 'partial',
                provider_cancelled: providerCancelled
            });

        } catch (error) {
            console.error('Error cancelling order:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to cancel order' });
        }
    });

    return router;
};
