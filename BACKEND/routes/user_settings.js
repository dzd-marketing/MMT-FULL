const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');


// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

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

    // Get user profile data
   // Get user profile data
router.get('/profiles', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;

        const [users] = await pool.execute(
            `SELECT 
                id, 
                full_name, 
                email, 
                phone, 
                whatsapp, 
                profile_picture,
                balance,
                spent,
                currency,
                created_at,
                last_login,
                apikey
            FROM users 
            WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Format currency (1=USD, 2=LKR, 3=INR)
        const currencyMap = {
            '1': 'USD',
            '2': 'LKR',
            '3': 'INR'
        };

        console.log('Sending profile data:', {
            profile_picture: user.profile_picture,
            currency: user.currency,
            currency_display: currencyMap[user.currency || '1']
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone || '',
                whatsapp: user.whatsapp || '',
                profile_picture: user.profile_picture,
                balance: parseFloat(user.balance || 0).toFixed(2),
                spent: parseFloat(user.spent || 0).toFixed(2),
                currency: currencyMap[user.currency || '1'] || 'USD',
                apikey: user.apikey,
                created_at: user.created_at,
                last_login: user.last_login
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile data'
        });
    }
});


    // Update user profile
router.post('/update-profiles', verifyToken, upload.single('profile_picture'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.userId;
        const { full_name, phone, whatsapp, currency } = req.body;

        console.log('Received update request:', { full_name, phone, whatsapp, currency, file: req.file });

        // Currency mapping - අපිට currency එනවා string එකක් විදියට ('1', '2', '3')
        let currencyValue = currency;
        
        // Build update query dynamically
        let updateFields = [];
        let queryParams = [];

        if (full_name && full_name !== 'undefined') {
            updateFields.push('full_name = ?');
            queryParams.push(full_name);
        }

        if (phone !== undefined && phone !== 'undefined') {
            updateFields.push('phone = ?');
            queryParams.push(phone);
        }

        if (whatsapp !== undefined && whatsapp !== 'undefined') {
            updateFields.push('whatsapp = ?');
            queryParams.push(whatsapp);
        }

        if (currencyValue) {
            updateFields.push('currency = ?');
            queryParams.push(currencyValue);
        }

        // Handle profile picture upload
        if (req.file) {
            console.log('Processing profile picture upload:', req.file.filename);
            
            // Get old profile picture to delete
            const [oldPic] = await connection.execute(
                'SELECT profile_picture FROM users WHERE id = ?',
                [userId]
            );

            // Delete old profile picture if exists and not a Google photo
            if (oldPic[0]?.profile_picture && 
                !oldPic[0].profile_picture.includes('googleusercontent.com') &&
                !oldPic[0].profile_picture.includes('graph.facebook.com')) {
                
                const oldPath = path.join(__dirname, '..', oldPic[0].profile_picture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log('Deleted old profile picture:', oldPath);
                }
            }

            const profilePicPath = `/uploads/profiles/${req.file.filename}`;
            updateFields.push('profile_picture = ?');
            queryParams.push(profilePicPath);
        }

        if (updateFields.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add userId to query params
        queryParams.push(userId);

        // Execute update query
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('Update query:', updateQuery);
        console.log('Query params:', queryParams);

        await connection.execute(updateQuery, queryParams);

        await connection.commit();

        // Get updated user data
        const [updatedUser] = await connection.execute(
            `SELECT 
                id, 
                full_name, 
                email, 
                phone, 
                whatsapp, 
                profile_picture,
                balance,
                spent,
                currency
            FROM users 
            WHERE id = ?`,
            [userId]
        );

        const currencyMapReverse = {
            '1': 'USD',
            '2': 'LKR',
            '3': 'INR'
        };

        console.log('Updated user data:', updatedUser[0]);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser[0].id,
                full_name: updatedUser[0].full_name,
                email: updatedUser[0].email,
                phone: updatedUser[0].phone || '',
                whatsapp: updatedUser[0].whatsapp || '',
                profile_picture: updatedUser[0].profile_picture,
                balance: parseFloat(updatedUser[0].balance || 0).toFixed(2),
                spent: parseFloat(updatedUser[0].spent || 0).toFixed(2),
                currency: currencyMapReverse[updatedUser[0].currency || '1'] || 'USD'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile: ' + error.message
        });
    } finally {
        connection.release();
    }
});

    // Get API key
    router.get('/api-key', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;

            const [users] = await pool.execute(
                'SELECT apikey FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate API key if not exists
            let apiKey = users[0].apikey;
            
            if (!apiKey) {
                apiKey = 'MMT-' + userId + '-' + 
                        Math.random().toString(36).substring(2, 15).toUpperCase() +
                        Math.random().toString(36).substring(2, 15).toUpperCase();
                
                await pool.execute(
                    'UPDATE users SET apikey = ? WHERE id = ?',
                    [apiKey, userId]
                );
            }

            res.json({
                success: true,
                api_key: apiKey
            });

        } catch (error) {
            console.error('Get API key error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get API key'
            });
        }
    });

    // Generate new API key
router.post('/generate-api-key', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get user email and username from database
        const [users] = await pool.execute(
            'SELECT email, full_name as username FROM users WHERE id = ?',
            [userId]
        );
        
        const user = users[0];
        
        // 👇 MATCH PHP LOGIC - CreateApiKey equivalent
        const stringToHash = user.email + user.username + Date.now() + Math.floor(Math.random() * 9000 + 1000);
        
        // Create MD5 hash and format it like PHP would
        const crypto = require('crypto');
        const md5Hash = crypto.createHash('md5').update(stringToHash).digest('hex').toUpperCase();
        
        // Take first 20 chars (or whatever length your API expects)
        const newApiKey = md5Hash.substring(0, 20);
        
        // Update database
        await pool.execute(
            'UPDATE users SET apikey = ? WHERE id = ?',
            [newApiKey, userId]
        );
        
        res.json({
            success: true,
            message: 'New API key generated successfully',
            api_key: newApiKey
        });
        
    } catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ success: false, message: 'Failed to generate API key' });
    }
});

  // Update currency only
router.post('/update-currency', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const { currency } = req.body;

        console.log('💰 [BACKEND] Updating currency for user:', userId, 'to:', currency);

        if (!currency) {
            return res.status(400).json({
                success: false,
                message: 'Currency is required'
            });
        }

        await pool.execute(
            'UPDATE users SET currency = ? WHERE id = ?',
            [currency, userId]
        );

        // Verify the update
        const [result] = await pool.execute(
            'SELECT currency FROM users WHERE id = ?',
            [userId]
        );
        
        console.log('💰 [BACKEND] Currency after update:', result[0]?.currency);

        res.json({
            success: true,
            message: 'Currency updated successfully'
        });

    } catch (error) {
        console.error('💰 [BACKEND] Update currency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update currency'
        });
    }
});

    // Get account statistics
    router.get('/stats', verifyToken, async (req, res) => {
        try {
            const userId = req.userId;

            // Get user data
            const [users] = await pool.execute(
                `SELECT 
                    created_at,
                    last_login,
                    balance,
                    spent
                FROM users 
                WHERE id = ?`,
                [userId]
            );

            // Get total orders count (if orders table exists)
            let totalOrders = 0;
            try {
                const [orders] = await pool.execute(
                    'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
                    [userId]
                );
                totalOrders = orders[0]?.total || 0;
            } catch (error) {
                console.log('Orders table not found, using default value');
                totalOrders = 24; // Default demo value
            }

            const user = users[0];

            res.json({
                success: true,
                stats: {
                    member_since: user?.created_at || new Date(),
                    last_login: user?.last_login || new Date(),
                    total_orders: totalOrders,
                    balance: parseFloat(user?.balance || 0).toFixed(2),
                    spent: parseFloat(user?.spent || 0).toFixed(2)
                }
            });

        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch account statistics'
            });
        }
    });

    return router;
};