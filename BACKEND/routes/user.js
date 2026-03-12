const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');


const authenticateToken = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = (pool) => {
    // Get user profile
    router.get('/profile', authenticateToken, async (req, res) => {
        try {
            const [users] = await pool.execute(
                'SELECT id, full_name, email, phone, whatsapp, created_at FROM users WHERE id = ?',
                [req.user.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user: users[0]
            });
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });


    router.put('/profile', authenticateToken, async (req, res) => {
        try {
            const { name, phone, whatsapp } = req.body;
            
            await pool.execute(
                'UPDATE users SET full_name = ?, phone = ?, whatsapp = ? WHERE id = ?',
                [name, phone, whatsapp, req.user.userId]
            );

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });

    return router;
};
