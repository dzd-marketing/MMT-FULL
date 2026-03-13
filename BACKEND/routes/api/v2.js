const express = require('express');
const router = express.Router();
const crypto = require('crypto');

module.exports = (pool) => {
    console.log('SMM Panel Production API initialized');

    const sanitizeText = (text) => {
        if (!text) return '';
        let str = String(text);
        return str
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
            .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
            .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
            .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
            .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
            .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
            .replace(/[\u{2600}-\u{26FF}]/gu, '')
            .replace(/[\u{2700}-\u{27BF}]/gu, '')
            .replace(/[⚠️♻️🚀✅❌⭐🔥💫✨🌟💥💯🔴🟠🟡🟢🔵🟣🟤⚫⚪]/g, '')
            .replace(/[^\x20-\x7E]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const cleanServiceName = (name) => {
        return sanitizeText(name).substring(0, 100) || 'Service';
    };

    const cleanForJSON = (obj) => {
        if (!obj) return obj;
        if (typeof obj === 'string') return sanitizeText(obj);
        if (Array.isArray(obj)) return obj.map(item => cleanForJSON(item));
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                cleaned[key] = cleanForJSON(value);
            }
            return cleaned;
        }
        return obj;
    };

    const generateOrderId = () => {
        return Math.floor(100000 + Math.random() * 900000);
    };

    const sanitizeInput = (input) => {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        return input;
    };

    const logRequest = (req, user, action) => {
        console.log(`[${new Date().toISOString()}] User ${user?.id || 'Unknown'}: ${action} - IP: ${req.ip}`);
    };

    const validateApiKey = async (req, res, next) => {
        try {
            const apiKey = req.body.key ||
                req.body.api_key ||
                req.body.api_token ||
                req.query.key ||
                req.query.api_key ||
                req.headers['x-api-key'];

            if (!apiKey) {
                return res.status(400).json({ error: "API key is required" });
            }

            const [users] = await pool.execute(`
                SELECT 
                    u.*,
                    w.available_balance,
                    w.spent_balance,
                    w.total_history_balance,
                    w.currency as wallet_currency
                FROM users u
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE u.apikey = ? AND u.is_active = 1
            `, [apiKey]);

            if (users.length === 0) {
                return res.status(401).json({ error: "Invalid or inactive API key" });
            }

            const user = users[0];

            if (user.client_type == 1) {
                return res.status(403).json({ error: "Account is inactive. Please contact support." });
            }

            req.user = {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                balance: parseFloat(user.available_balance || user.balance || 0),
                spent: parseFloat(user.spent_balance || user.spent || 0),
                discount_percentage: parseInt(user.discount_percentage) || 0,
                currency: user.wallet_currency || 'USD',
                client_type: user.client_type,
                admin_type: user.admin_type
            };

            req.discountMultiplier = 1 - (req.user.discount_percentage / 100);

            logRequest(req, req.user, 'Authentication successful');
            next();

        } catch (error) {
            console.error('Authentication error:', error);
            res.status(500).json({
                error: "Server error during authentication",
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    router.get('/info', (req, res) => {
        res.json({
            name: 'SMM Panel API v2',
            version: '2.0.0',
            status: 'operational',
            documentation: '/api/v2/docs',
            endpoints: {
                balance: 'GET/POST /api/v2?key=API_KEY&action=balance',
                services: 'GET/POST /api/v2?key=API_KEY&action=services',
                services_with_category: 'GET/POST /api/v2?key=API_KEY&action=services&category_id=ID',
                order: 'POST /api/v2 with key, action=order, service_id, link, quantity',
                orders: 'GET/POST /api/v2?key=API_KEY&action=orders',
                order_status: 'GET/POST /api/v2?key=API_KEY&action=status&order_id=ID',
                refill: 'POST /api/v2 with key, action=refill, order_id',
                profile: 'GET /api/v2?key=API_KEY&action=profile'
            }
        });
    });

    router.get('/check', async (req, res) => {
        try {
            const [dbCheck] = await pool.execute('SELECT 1');
            res.json({
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message
            });
        }
    });

    router.get('/', validateApiKey, async (req, res) => {
        await handleApiRequest(req, res);
    });

    router.post('/', validateApiKey, async (req, res) => {
        await handleApiRequest(req, res);
    });

    async function handleApiRequest(req, res) {
        try {
            const action = req.body.action || req.query.action;

            if (!action) {
                return res.status(400).json({ error: "Action parameter is required" });
            }

            switch (action.toLowerCase()) {
                case 'balance':
                    return await getBalance(req, res);
                case 'services':
                    return await getServices(req, res);
                case 'order':
                case 'add':
                    return await placeOrder(req, res);
                case 'orders':
                case 'history':
                    return await getOrders(req, res);
                case 'status':
                    return await getOrderStatus(req, res);
                case 'refill':
                    return await requestRefill(req, res);
                case 'profile':
                    return await getUserProfile(req, res);
                default:
                    return res.status(400).json({
                        error: `Unknown action: ${action}. Available actions: balance, services, order, orders, status, refill, profile`
                    });
            }
        } catch (error) {
            console.error('API error:', error);
            res.status(500).json({
                error: "Internal server error",
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async function getBalance(req, res) {
        try {
            const [wallets] = await pool.execute(
                'SELECT available_balance, spent_balance, currency FROM wallets WHERE user_id = ?',
                [req.user.id]
            );

            const wallet = wallets[0] || {
                available_balance: req.user.balance,
                spent_balance: req.user.spent,
                currency: req.user.currency
            };

            logRequest(req, req.user, 'Balance check');

            res.json({
                status: 'success',
                balance: parseFloat(wallet.available_balance),
                spent: parseFloat(wallet.spent_balance),
                currency: 'LKR',
                user_id: req.user.id
            });
        } catch (error) {
            console.error('Balance error:', error);
            res.status(500).json({ error: "Failed to fetch balance" });
        }
    }

    async function getServices(req, res) {
        try {
            const categoryId = req.body.category_id || req.query.category_id;
            const search = req.body.search || req.query.search;
            const specificServiceId = req.body.service_id || req.query.service_id;

            let query = `
                SELECT 
                    s.service_id,
                    s.service_name,
                    s.service_description,
                    s.service_price,
                    s.service_min,
                    s.service_max,
                    s.service_type,
                    s.service_dripfeed,
                    s.service_speed,
                    s.category_id,
                    s.want_username,
                    s.cancelbutton,
                    s.show_refill,
                    s.refill_days,
                    s.instagram_private,
                    s.start_count,
                    c.name as category_name
                FROM services s
                LEFT JOIN categories c ON s.category_id = c.id
                WHERE s.service_deleted = '0'
            `;

            const params = [];

            if (specificServiceId) {
                query += ' AND s.service_id = ?';
                params.push(specificServiceId);
            }

            if (categoryId) {
                query += ' AND s.category_id = ?';
                params.push(categoryId);
            }

            if (search) {
                query += ' AND (s.service_name LIKE ? OR s.service_description LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY s.category_id, s.service_id';

            const [services] = await pool.execute(query, params);

            const formattedServices = services.map(s => {
                let basePrice;
                if (typeof s.service_price === 'string') {
                    basePrice = parseFloat(s.service_price.replace(/,/g, ''));
                } else {
                    basePrice = parseFloat(s.service_price);
                }

                return {
                    id: s.service_id,
                    category: s.category_id,
                    category_name: s.category_name || 'Uncategorized',
                    name: sanitizeText(s.service_name),
                    description: sanitizeText(s.service_description || ''),
                    price_per_1000: parseFloat(basePrice.toFixed(4)),
                    currency: 'LKR',
                    price_per_unit: parseFloat((basePrice / 1000).toFixed(6)),
                    price_for_min: parseFloat(((basePrice / 1000) * (s.service_min || 1)).toFixed(4)),
                    original_price: parseFloat(basePrice.toFixed(4)),
                    min: parseInt(s.service_min) || 0,
                    max: parseInt(s.service_max) || 0,
                    type: s.service_type === '1' ? 'manual' : 'auto',
                    speed: ['very_slow', 'slow', 'medium', 'fast'][parseInt(s.service_speed) - 1] || 'medium',
                    dripfeed: s.service_dripfeed === '2',
                    require_username: s.want_username === '1',
                    cancel: s.cancelbutton === '1',
                    refill: s.show_refill === 'true',
                    refill_days: parseInt(s.refill_days) || 30,
                    instagram_private: s.instagram_private === '1',
                    start_count: s.start_count || 'none'
                };
            });

            logRequest(req, req.user, `Services fetched (${formattedServices.length} items)`);

            res.json({
                status: 'success',
                total: formattedServices.length,
                currency: 'LKR',
                user_currency: 'LKR',
                services: formattedServices
            });
        } catch (error) {
            console.error('Services error:', error);
            res.status(500).json({ error: "Failed to fetch services" });
        }
    }

    async function placeOrder(req, res) {
        try {
            const {
                service_id,
                link,
                quantity,
                dripfeed = '1',
                dripfeed_runs,
                dripfeed_interval,
                username,
                comments,
                usernames
            } = req.body;

            if (!service_id) return res.status(400).json({ error: "service_id is required" });
            if (!link) return res.status(400).json({ error: "link is required" });
            if (!quantity || quantity < 1) return res.status(400).json({ error: "valid quantity is required" });

            const [services] = await pool.execute(
                'SELECT * FROM services WHERE service_id = ? AND service_deleted = "0"',
                [service_id]
            );

            if (services.length === 0) {
                return res.status(404).json({ error: "Service not found" });
            }

            const service = services[0];

            const minQty = parseInt(service.service_min) || 1;
            const maxQty = parseInt(service.service_max) || 1000000;

            if (quantity < minQty || quantity > maxQty) {
                return res.status(400).json({
                    error: `Quantity must be between ${minQty} and ${maxQty}`
                });
            }

            let basePrice;
            if (typeof service.service_price === 'string') {
                basePrice = parseFloat(service.service_price.replace(/,/g, ''));
            } else {
                basePrice = parseFloat(service.service_price);
            }

            const pricePerUnit = basePrice / 1000;
            const discountedPricePerUnit = pricePerUnit * req.discountMultiplier;

            const isDripfeed = dripfeed === '2';
            const runs = isDripfeed ? (parseInt(dripfeed_runs) || 1) : 1;
            const totalQuantity = isDripfeed ? quantity * runs : quantity;

            const totalPrice = discountedPricePerUnit * totalQuantity;

            const profitPercentage = parseFloat(service.service_profit) || 0;
            let orderProfit = 0;

            if (profitPercentage > 0) {
                const originalCost = totalPrice / (1 + (profitPercentage / 100));
                orderProfit = totalPrice - originalCost;
            }

            if (req.user.balance < totalPrice) {
                return res.status(400).json({
                    error: "Insufficient balance",
                    required: totalPrice.toFixed(4),
                    available: req.user.balance.toFixed(4),
                    currency: 'LKR',
                    quantity_per_run: parseInt(quantity),
                    total_quantity: totalQuantity,
                    runs: runs
                });
            }


            const [activeOrders] = await pool.execute(`
                SELECT order_id FROM orders 
                WHERE user_id = ?
                AND order_url = ?
                AND service_id = ?
                AND order_status IN ('pending', 'processing', 'inprogress', 'queued')
                LIMIT 1
            `, [req.user.id, link, service_id]);

            const shouldQueue = activeOrders.length > 0;

            const [serviceApi] = await pool.execute(`
                SELECT 
                    s.service_api,
                    s.api_service,
                    sa.api_url,
                    sa.api_key,
                    sa.api_type
                FROM services s
                LEFT JOIN service_api sa ON s.service_api = sa.id
                WHERE s.service_id = ?
            `, [service_id]);

            let api = serviceApi.length > 0 ? serviceApi[0] : null;
            const hasApi = api && api.service_api > 0 && api.api_url && api.api_key;

            let apiOrderId = 0;
            let apiResponse = null;
            let apiError = null;

            if (!shouldQueue && hasApi) {
                try {
                    const axios = require('axios');

                    const apiData = new URLSearchParams();
                    apiData.append('key', api.api_key);
                    apiData.append('action', 'add');
                    apiData.append('service', api.api_service);
                    apiData.append('link', link);

                    if (isDripfeed) {
                        apiData.append('quantity', quantity);
                        apiData.append('runs', dripfeed_runs);
                        apiData.append('interval', dripfeed_interval);
                    } else {
                        apiData.append('quantity', quantity);
                    }

                    if (comments) {
                        const commentsArray = Array.isArray(comments) ? comments : comments.split('|');
                        apiData.append('comments', commentsArray.join("\n"));
                    }

                    if (username) {
                        apiData.append('username', username);
                    }

                    if (usernames) {
                        const usernamesArray = Array.isArray(usernames) ? usernames : usernames.split(',');
                        apiData.append('usernames', usernamesArray.join(','));
                    }

                    const providerResponse = await axios.post(api.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 30000
                    });

                    if (providerResponse.data) {
                        if (providerResponse.data.order) {
                            apiOrderId = providerResponse.data.order;
                        } else if (providerResponse.data.id) {
                            apiOrderId = providerResponse.data.id;
                        } else if (providerResponse.data.order_id) {
                            apiOrderId = providerResponse.data.order_id;
                        }

                        apiResponse = JSON.stringify(providerResponse.data);
                    }

                } catch (error) {
                    console.error('Provider API error:', error);
                    apiError = error.message;
                    apiResponse = JSON.stringify({ error: error.message });
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

            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                const orderId = generateOrderId();

                const extras = cleanForJSON({
                    username: username || null,
                    comments: comments || null,
                    usernames: usernames || null,
                    dripfeed: isDripfeed,
                    dripfeed_quantity: isDripfeed ? parseInt(quantity) : null,
                    dripfeed_runs: isDripfeed ? runs : null,
                    dripfeed_interval: isDripfeed ? (parseInt(dripfeed_interval) || null) : null,
                    dripfeed_totalquantity: isDripfeed ? totalQuantity : null,
                    provider_response: apiResponse ? JSON.parse(apiResponse) : null,
                    provider_error: apiError || null
                });

                Object.keys(extras).forEach(key => {
                    if (extras[key] === null) delete extras[key];
                });

                const cleanName = cleanServiceName(service.service_name);

                await connection.execute(`
                    INSERT INTO orders (
                        order_id, 
                        user_id, 
                        service_id, 
                        api_orderid,
                        order_error,
                        order_detail,
                        order_api,
                        api_serviceid,
                        api_charge,
                        api_currencycharge,
                        order_profit,
                        order_quantity,
                        order_extras,
                        order_charge,
                        dripfeed,
                        dripfeed_id,
                        subscriptions_id,
                        subscriptions_type,
                        dripfeed_totalcharges,
                        dripfeed_runs,
                        dripfeed_delivery,
                        dripfeed_interval,
                        dripfeed_totalquantity,
                        dripfeed_status,
                        order_url,
                        order_start,
                        order_finish,
                        order_remains,
                        order_create,
                        order_status,
                        subscriptions_status,
                        subscriptions_delivery,
                        last_check,
                        order_where,
                        refill_status,
                        is_refill,
                        refill,
                        cancelbutton,
                        show_refill,
                        api_refillid,
                        avg_done,
                        order_increase
                    ) VALUES (
                        ?, ?, ?, ?, '-', ?, ?, ?, 0, 1, ?, ?, ?, ?, 
                        ?, 0, 0, '1', NULL, NULL, 0, NULL, NULL, 'active',
                        ?, 0, 0, 0, NOW(), ?, 'active', 0, NOW(),
                        'api',
                        'Pending', '1', '1', '1', 'true', 0, '1', 0
                    )
                `, [
                    orderId,
                    req.user.id,
                    service_id,
                    apiOrderId || 0,
                    JSON.stringify({
                        service_name: cleanName,
                        service_id: service_id,
                        base_price: basePrice,
                        api_sent: hasApi && !shouldQueue,
                        api_order_id: apiOrderId || null,
                        api_error: apiError || null,
                        queued: shouldQueue
                    }),
                    service.service_api || 0,
                    (api && api.api_service) ? api.api_service : 0,
                    orderProfit,
                    totalQuantity,
                    JSON.stringify(extras),
                    totalPrice,
                    dripfeed || '1',
                    sanitizeInput(link),
                    orderStatus
                ]);

                await connection.execute(`
                    UPDATE wallets 
                    SET available_balance = available_balance - ?,
                        spent_balance = spent_balance + ?,
                        total_history_balance = total_history_balance + ?,
                        last_updated = NOW()
                    WHERE user_id = ?
                `, [totalPrice, totalPrice, totalPrice, req.user.id]);

                await connection.execute(`
                    UPDATE users 
                    SET balance = balance - ?,
                        spent = spent + ?
                    WHERE id = ?
                `, [totalPrice, totalPrice, req.user.id]);

                await connection.commit();

                logRequest(req, req.user, `Order placed: #${orderId} for LKR ${totalPrice.toFixed(4)}`);

                res.json({
                    status: 'success',
                    order: {
                        id: orderId,
                        service: service.service_id,
                        service_name: cleanName,
                        link: link,
                        quantity_per_run: parseInt(quantity),
                        total_quantity: totalQuantity,
                        runs: runs,
                        price: parseFloat(totalPrice.toFixed(4)),
                        currency: 'LKR',
                        profit: parseFloat(orderProfit.toFixed(4)),
                        price_per_1000: basePrice,
                        balance_after: (req.user.balance - totalPrice).toFixed(4),
                        created_at: new Date().toISOString(),
                        order_status: orderStatus,
                        queued: shouldQueue,
                        provider_status: shouldQueue ? 'queued' : (apiOrderId > 0 ? 'sent_to_provider' : 'pending_provider'),
                        provider_order_id: apiOrderId || null
                    },
                    provider_response: apiResponse ? JSON.parse(apiResponse) : null
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            console.error('Order placement error:', error);
            res.status(500).json({
                error: "Failed to place order",
                message: error.message
            });
        }
    }

    async function getOrders(req, res) {
        try {
            const page = parseInt(req.body.page || req.query.page || 1);
            const limit = parseInt(req.body.limit || req.query.limit || 50);
            const offset = (page - 1) * limit;

            const [orders] = await pool.execute(`
                SELECT 
                    o.order_id,
                    o.service_id,
                    s.service_name,
                    o.order_quantity,
                    o.order_charge,
                    o.order_url,
                    o.order_status,
                    o.order_create,
                    o.order_start,
                    o.order_finish,
                    o.order_remains,
                    o.dripfeed,
                    o.refill_status,
                    o.cancelbutton,
                    o.show_refill
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE o.user_id = ?
                ORDER BY o.order_create DESC
                LIMIT ? OFFSET ?
            `, [req.user.id, limit, offset]);

            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
                [req.user.id]
            );

            const formattedOrders = orders.map(o => ({
                id: o.order_id,
                service_id: o.service_id,
                service_name: sanitizeText(o.service_name || 'Unknown Service'),
                quantity: parseInt(o.order_quantity),
                price: parseFloat(o.order_charge),
                currency: 'LKR',
                link: o.order_url,
                status: o.order_status,
                start_count: parseInt(o.order_start) || 0,
                remains: parseInt(o.order_remains) || 0,
                created_at: o.order_create,
                dripfeed: o.dripfeed === '2',
                refill: {
                    status: o.refill_status,
                    available: o.show_refill === 'true'
                },
                cancel: o.cancelbutton === '1'
            }));

            logRequest(req, req.user, `Orders fetched (page ${page})`);

            res.json({
                status: 'success',
                total: countResult[0].total,
                page: page,
                limit: limit,
                pages: Math.ceil(countResult[0].total / limit),
                orders: formattedOrders
            });

        } catch (error) {
            console.error('Orders fetch error:', error);
            res.status(500).json({ error: "Failed to fetch orders" });
        }
    }

    async function getOrderStatus(req, res) {
        try {
            const orderId = req.body.order_id || req.query.order_id;

            if (!orderId) {
                return res.status(400).json({ error: "order_id is required" });
            }

            const [orders] = await pool.execute(`
                SELECT 
                    o.order_id,
                    o.service_id,
                    s.service_name,
                    o.order_quantity,
                    o.order_charge,
                    o.order_url,
                    o.order_status,
                    o.order_start,
                    o.order_finish,
                    o.order_remains,
                    o.order_create,
                    o.refill_status,
                    o.cancelbutton,
                    o.show_refill,
                    o.dripfeed
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [orderId, req.user.id]);

            if (orders.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            const order = orders[0];

            logRequest(req, req.user, `Order status checked: #${orderId}`);

            res.json({
                status: 'success',
                order: {
                    id: order.order_id,
                    service_id: order.service_id,
                    service_name: sanitizeText(order.service_name || 'Unknown Service'),
                    quantity: parseInt(order.order_quantity),
                    price: parseFloat(order.order_charge),
                    currency: 'LKR',
                    link: order.order_url,
                    status: order.order_status,
                    start_count: parseInt(order.order_start) || 0,
                    remains: parseInt(order.order_remains) || 0,
                    created_at: order.order_create,
                    refill: {
                        status: order.refill_status,
                        available: order.show_refill === 'true'
                    },
                    cancel: order.cancelbutton === '1',
                    dripfeed: order.dripfeed === '2'
                }
            });

        } catch (error) {
            console.error('Order status error:', error);
            res.status(500).json({ error: "Failed to fetch order status" });
        }
    }

    async function requestRefill(req, res) {
        try {
            const orderId = req.body.order_id;

            if (!orderId) {
                return res.status(400).json({ error: "order_id is required" });
            }

            const [orders] = await pool.execute(`
                SELECT o.*, s.show_refill 
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [orderId, req.user.id]);

            if (orders.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            const order = orders[0];

            if (order.show_refill !== 'true') {
                return res.status(400).json({ error: "Refill is not available for this service" });
            }

            if (order.order_status !== 'completed') {
                return res.status(400).json({ error: "Refill is only available for completed orders" });
            }

            await pool.execute(
                'UPDATE orders SET refill_status = "Pending" WHERE order_id = ?',
                [orderId]
            );

            logRequest(req, req.user, `Refill requested: #${orderId}`);

            res.json({
                status: 'success',
                message: 'Refill request submitted successfully',
                order_id: parseInt(orderId),
                refill_status: 'Pending'
            });

        } catch (error) {
            console.error('Refill error:', error);
            res.status(500).json({ error: "Failed to request refill" });
        }
    }

    async function getUserProfile(req, res) {
        try {
            const [profile] = await pool.execute(`
                SELECT 
                    u.id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.whatsapp,
                    u.profile_picture,
                    u.created_at,
                    u.last_login,
                    u.login_ip,
                    u.lang,
                    u.client_type,
                    u.admin_type,
                    w.available_balance,
                    w.spent_balance,
                    w.currency,
                    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
                    (SELECT SUM(order_charge) FROM orders WHERE user_id = u.id) as total_spent
                FROM users u
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE u.id = ?
            `, [req.user.id]);

            if (profile.length === 0) {
                return res.status(404).json({ error: "Profile not found" });
            }

            const user = profile[0];

            res.json({
                status: 'success',
                profile: {
                    id: user.id,
                    name: sanitizeText(user.full_name),
                    email: user.email,
                    phone: user.phone,
                    whatsapp: user.whatsapp,
                    avatar: user.profile_picture,
                    balance: parseFloat(user.available_balance || 0),
                    spent: parseFloat(user.spent_balance || 0),
                    currency: 'LKR',
                    total_orders: parseInt(user.total_orders || 0),
                    total_spent: parseFloat(user.total_spent || 0),
                    language: user.lang || 'en',
                    member_since: user.created_at,
                    last_login: user.last_login,
                    last_ip: user.login_ip,
                    type: user.client_type === '1' ? 'demo' : 'regular',
                    is_admin: user.admin_type === '1'
                }
            });

        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    }

    router.get('/provider-status', validateApiKey, async (req, res) => {
        try {
            const orderId = req.query.order_id;

            if (!orderId) {
                return res.status(400).json({ error: "order_id is required" });
            }

            const [orders] = await pool.execute(`
                SELECT o.*, s.service_api, sa.api_url, sa.api_key
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.service_id
                LEFT JOIN service_api sa ON s.service_api = sa.id
                WHERE o.order_id = ? AND o.user_id = ?
            `, [orderId, req.user.id]);

            if (orders.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            const order = orders[0];

            if (order.api_orderid > 0 && order.api_url && order.api_key) {
                try {
                    const axios = require('axios');

                    const apiData = new URLSearchParams();
                    apiData.append('key', order.api_key);
                    apiData.append('action', 'status');
                    apiData.append('order', order.api_orderid);

                    const providerResponse = await axios.post(order.api_url, apiData, {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        timeout: 30000
                    });

                    if (providerResponse.data) {
                        let status = providerResponse.data.status?.toLowerCase() || order.order_status;

                        if (status.includes('completed')) status = 'completed';
                        else if (status.includes('processing')) status = 'processing';
                        else if (status.includes('inprogress')) status = 'inprogress';
                        else if (status.includes('partial')) status = 'partial';
                        else if (status.includes('cancel')) status = 'canceled';

                        await pool.execute(`
                            UPDATE orders 
                            SET order_status = ?,
                                order_remains = ?,
                                last_check = NOW()
                            WHERE order_id = ?
                        `, [
                            status,
                            providerResponse.data.remains || order.order_remains,
                            orderId
                        ]);

                        res.json({
                            status: 'success',
                            order: {
                                id: order.order_id,
                                provider_order_id: order.api_orderid,
                                provider_status: providerResponse.data,
                                local_status: status,
                                remains: providerResponse.data.remains || order.order_remains
                            }
                        });
                    }
                } catch (error) {
                    console.error('Provider status check error:', error);
                    res.json({
                        status: 'error',
                        message: 'Failed to fetch from provider',
                        local_order: {
                            id: order.order_id,
                            status: order.order_status
                        }
                    });
                }
            } else {
                res.json({
                    status: 'success',
                    message: 'Order is local only (no provider API)',
                    order: {
                        id: order.order_id,
                        status: order.order_status
                    }
                });
            }

        } catch (error) {
            console.error('Provider status error:', error);
            res.status(500).json({ error: "Failed to check provider status" });
        }
    });

    return router;
};
