const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

module.exports = (pool) => {
const adminAuth = require('../admin-auth')(pool);

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {

            const uploadDir = path.join(__dirname, '../../uploads/config');
            console.log('Upload directory:', uploadDir); 
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Created upload directory');
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = 'config-' + uniqueSuffix + ext;
            console.log('Generated filename:', filename);
            cb(null, filename);
        }
    });

    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|webp|ico/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    });

    router.get('/check-maintenance', async (req, res) => {
        try {
            const [configs] = await pool.execute(
                'SELECT config_key, config_value FROM config WHERE config_key IN ("maintenance_mode", "maintenance_message")'
            );

            const configObj = {};
            configs.forEach(config => {
                configObj[config.config_key] = config.config_value;
            });

            const maintenance_mode = configObj.maintenance_mode === '1';
            const maintenance_message = configObj.maintenance_message || 'Site is under maintenance. We will be back soon!';

            res.json({
                success: true,
                maintenance_mode: maintenance_mode,
                maintenance_message: maintenance_message,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Check maintenance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check maintenance mode',
                maintenance_mode: false,
                maintenance_message: 'Site is under maintenance'
            });
        }
    });
    router.get('/snow-effect', async (req, res) => {
        try {
            const [configs] = await pool.execute(
                'SELECT config_value FROM config WHERE config_key = "snow_effect"'
            );

            const snow_effect = configs.length > 0 ? configs[0].config_value === '1' : false;

            res.json({
                success: true,
                snow_effect: snow_effect
            });

        } catch (error) {
            console.error('Get snow effect error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get snow effect status'
            });
        }
    });
    router.get('/festival-effect', async (req, res) => {
        try {
            const [configs] = await pool.execute(
                'SELECT config_value FROM config WHERE config_key = "festival_effect"'
            );

            const festival_effect = configs.length > 0 ? configs[0].config_value === '1' : false;

            res.json({
                success: true,
                festival_effect: festival_effect
            });

        } catch (error) {
            console.error('Get festival effect error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get festival effect status'
            });
        }
    });
    router.get('/effects', async (req, res) => {
        try {
            const [configs] = await pool.execute(
                'SELECT config_key, config_value FROM config WHERE config_key IN ("snow_effect", "festival_effect")'
            );

            const effects = {
                snow_effect: false,
                festival_effect: false
            };

            configs.forEach(config => {
                effects[config.config_key] = config.config_value === '1';
            });

            res.json({
                success: true,
                effects: effects
            });

        } catch (error) {
            console.error('Get effects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get effects status'
            });
        }
    });
    router.get('/public', async (req, res) => {
        try {
            const [configs] = await pool.execute(
                `SELECT config_key, config_value FROM config 
                 WHERE config_key IN (
                     'site_name', 'site_logo', 
                     'contact_email', 'contact_phone', 'contact_whatsapp',
                     'facebook_url', 'instagram_url', 'twitter_url', 
                     'youtube_url', 'telegram_url', 'tiktok_url',
                     'whatsapp_url', 'whatsapp_channel', 'linkedin_url',
                     'address', 'footer_copyright', 'footer_description',
                     'alert_message', 'alert_enabled', 'alert_type',
                     'alert_heading', 'alert_description',
                     'currency', 'timezone', 'date_format', 'time_format',
                     'theme_color', 'dark_mode_enabled',
                     'snow_effect', 'festival_effect'
                 )`
            );
            
            const configObj = {};
            configs.forEach(config => {
                configObj[config.config_key] = config.config_value;
            });

            res.json({
                success: true,
                config: configObj
            });
        } catch (error) {
            console.error('Get public config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch public config'
            });
        }
    });


    router.get('/all', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const [configs] = await pool.execute('SELECT * FROM config ORDER BY id');
            
            const configObj = {};
            configs.forEach(config => {
                configObj[config.config_key] = config.config_value;
            });

            res.json({
                success: true,
                config: configObj
            });
        } catch (error) {
            console.error('Get all config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch config'
            });
        }
    });

    router.get('/:key', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { key } = req.params;
            
            const [configs] = await pool.execute(
                'SELECT config_value FROM config WHERE config_key = ?',
                [key]
            );

            if (configs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Config key not found'
                });
            }

            res.json({
                success: true,
                key: key,
                value: configs[0].config_value
            });

        } catch (error) {
            console.error('Get config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch config'
            });
        }
    });


    router.post('/update', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { key, value } = req.body;

            if (!key) {
                return res.status(400).json({
                    success: false,
                    message: 'Key is required'
                });
            }

            let sanitizedValue = value;
            if (key.includes('url') || key.includes('channel')) {
                if (value && value.trim() !== '') {
                    if (!value.match(/^https?:\/\//i) && !value.match(/^http?:\/\//i)) {
                        sanitizedValue = 'https://' + value;
                    }
                }
            }

            const [existing] = await pool.execute(
                'SELECT id FROM config WHERE config_key = ?',
                [key]
            );

            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE config SET config_value = ? WHERE config_key = ?',
                    [sanitizedValue, key]
                );
            } else {
                await pool.execute(
                    'INSERT INTO config (config_key, config_value) VALUES (?, ?)',
                    [key, sanitizedValue]
                );
            }

            res.json({
                success: true,
                message: 'Config updated successfully'
            });

        } catch (error) {
            console.error('Update config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update config'
            });
        }
    });


    router.post('/toggle-snow', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { enabled } = req.body;

            const [existing] = await pool.execute(
                'SELECT id FROM config WHERE config_key = "snow_effect"'
            );

            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE config SET config_value = ? WHERE config_key = "snow_effect"',
                    [enabled ? '1' : '0']
                );
            } else {
                await pool.execute(
                    'INSERT INTO config (config_key, config_value) VALUES ("snow_effect", ?)',
                    [enabled ? '1' : '0']
                );
            }

            res.json({
                success: true,
                message: `Snow effect ${enabled ? 'enabled' : 'disabled'} successfully`
            });

        } catch (error) {
            console.error('Toggle snow effect error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle snow effect'
            });
        }
    });


    router.post('/toggle-festival', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { enabled } = req.body;

            const [existing] = await pool.execute(
                'SELECT id FROM config WHERE config_key = "festival_effect"'
            );

            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE config SET config_value = ? WHERE config_key = "festival_effect"',
                    [enabled ? '1' : '0']
                );
            } else {
                await pool.execute(
                    'INSERT INTO config (config_key, config_value) VALUES ("festival_effect", ?)',
                    [enabled ? '1' : '0']
                );
            }

            res.json({
                success: true,
                message: `Festival effect ${enabled ? 'enabled' : 'disabled'} successfully`
            });

        } catch (error) {
            console.error('Toggle festival effect error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle festival effect'
            });
        }
    });

router.post('/update-multiple', adminAuth.adminAuthMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { configs } = req.body;

        for (const [key, value] of Object.entries(configs)) {
            let sanitizedValue = value;
            if (key.includes('url') || key.includes('channel')) {
                if (value && value.trim() !== '') {
                    if (!value.match(/^https?:\/\//i) && !value.match(/^http?:\/\//i)) {
                        sanitizedValue = 'https://' + value;
                    }
                }
            }

            const [existing] = await connection.execute(
                'SELECT id FROM config WHERE config_key = ?',
                [key]
            );

            if (existing.length > 0) {
                await connection.execute(
                    'UPDATE config SET config_value = ? WHERE config_key = ?',
                    [sanitizedValue, key]
                );
            } else {
                await connection.execute(
                    'INSERT INTO config (config_key, config_value) VALUES (?, ?)',
                    [key, sanitizedValue]
                );
            }
        }

        await connection.commit();

        // Clear any cached SEO data if this is an SEO update
        const seoKeys = Object.keys(configs).filter(key => key.startsWith('seo_') || 
            ['site_name', 'site_title', 'site_description', 'site_keywords', 'site_logo'].includes(key));
        
        if (seoKeys.length > 0) {
            console.log('SEO settings updated - cache will be refreshed on next request');
        }

        res.json({
            success: true,
            message: 'Configs updated successfully'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Update multiple config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update configs'
        });
    } finally {
        connection.release();
    }
});

    router.post('/toggle-maintenance', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { enabled, message } = req.body;

            await pool.execute(
                'UPDATE config SET config_value = ? WHERE config_key = ?',
                [enabled ? '1' : '0', 'maintenance_mode']
            );

            if (message) {
                await pool.execute(
                    'UPDATE config SET config_value = ? WHERE config_key = ?',
                    [message, 'maintenance_message']
                );
            }

            res.json({
                success: true,
                message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
            });

        } catch (error) {
            console.error('Toggle maintenance error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle maintenance mode'
            });
        }
    });

    router.post('/upload-image', adminAuth.adminAuthMiddleware, upload.single('image'), async (req, res) => {
        try {
            const { key } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image uploaded'
                });
            }

            if (!key) {
                return res.status(400).json({
                    success: false,
                    message: 'Key is required'
                });
            }

            const imagePath = '/uploads/config/' + req.file.filename;
            console.log('Image saved at:', imagePath);

            await pool.execute(
                'UPDATE config SET config_value = ? WHERE config_key = ?',
                [imagePath, key]
            );

            res.json({
                success: true,
                message: 'Image uploaded successfully',
                path: imagePath
            });

        } catch (error) {
            console.error('Upload image error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload image'
            });
        }
    });

    router.delete('/:key', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { key } = req.params;

            await pool.execute(
                'DELETE FROM config WHERE config_key = ?',
                [key]
            );

            res.json({
                success: true,
                message: 'Config deleted successfully'
            });

        } catch (error) {
            console.error('Delete config error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete config'
            });
        }
    });

router.get('/seo-data', async (req, res) => {
    try {
        const [configs] = await pool.execute(
            `SELECT config_key, config_value FROM config 
             WHERE config_key LIKE 'seo_%' 
             OR config_key IN ('site_name', 'site_title', 'site_description', 'site_keywords', 'site_logo')`
        );

        const seoData = {};
        configs.forEach(config => {
            seoData[config.config_key] = config.config_value;
        });

        res.json({
            success: true,
            data: seoData
        });
    } catch (error) {
        console.error('Get SEO data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SEO data'
        });
    }
});

    return router;
};

