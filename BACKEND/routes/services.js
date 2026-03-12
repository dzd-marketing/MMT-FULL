const express = require('express');
const router = express.Router();

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
            
            const [users] = await pool.execute(
                'SELECT id FROM users WHERE id = ?',
                [decoded.userId]
            );

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
 
    router.get('/', async (req, res) => {
        try {
            const [services] = await pool.execute(
                `SELECT 
                    service_id as id,
                    service_name as name,
                    service_description as description,
                    service_price as price,
                    service_min as min,
                    service_max as max,
                    show_refill as refill,
                    cancelbutton as cancel,
                    service_speed as speed,
                    avg_days,
                    avg_hours,
                    avg_minutes,
                    time as avg_time,
                    'Services' as category
                 FROM services
                 WHERE service_deleted = '0' 
                   AND service_type = '2'
                 ORDER BY service_line`
            );

            res.json({
                success: true,
                services: services
            });

        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch services'
            });
        }
    });


router.get('/new', authMiddleware, async (req, res) => {
    try {
        const { days = '7' } = req.query;
        
        let dateFilter = '';
        let params = [];

        if (days !== 'all') {
            dateFilter = 'AND new_added_date >= DATE_SUB(NOW(), INTERVAL ? DAY)';
            params.push(parseInt(days));
        }

const [services] = await pool.execute(`
    SELECT 
        service_id,
        service_name,
        service_description,
        category_id,
        service_price,
        service_min,
        service_max,
        new_added_date as created_date
    FROM services 
    WHERE service_deleted = '0' 
      AND is_new = 1
    ORDER BY new_added_date DESC, service_id DESC
`, params);

        res.json({
            success: true,
            services: services
        });

    } catch (error) {
        console.error('Error fetching new services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch new services'
        });
    }
});


    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            
            const [services] = await pool.execute(
                `SELECT 
                    service_id as id,
                    service_name as name,
                    service_description as description,
                    service_price as price,
                    service_min as min,
                    service_max as max,
                    show_refill as refill,
                    cancelbutton as cancel,
                    service_speed as speed,
                    avg_days,
                    avg_hours,
                    avg_minutes,
                    time as avg_time
                 FROM services
                 WHERE service_id = ? AND service_deleted = '0'`,
                [id]
            );

            if (services.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            res.json({
                success: true,
                service: services[0]
            });

        } catch (error) {
            console.error('Error fetching service:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch service'
            });
        }
    });

    return router;
};
