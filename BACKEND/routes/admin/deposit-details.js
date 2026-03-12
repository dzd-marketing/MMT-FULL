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
            const uploadDir = path.join(__dirname, '../../uploads/payments');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, 'payment-' + uniqueSuffix + ext);
        }
    });

    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|webp/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    });

    router.get('/all', async (req, res) => {
        try {
            const [methods] = await pool.execute(
                `SELECT 
                    id, 
                    type, 
                    name, 
                    description,
                    bank_name,
                    account_number,
                    account_holder,
                    branch,
                    ez_cash_number,
                    custom_details,
                    icon,
                    image_url,
                    display_order
                FROM deposit_details 
                WHERE is_active = 1 
                ORDER BY display_order ASC`
            );

            res.json({
                success: true,
                methods: methods
            });

        } catch (error) {
            console.error('Get deposit methods error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit methods'
            });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const [methods] = await pool.execute(
                `SELECT 
                    id, 
                    type, 
                    name, 
                    description,
                    bank_name,
                    account_number,
                    account_holder,
                    branch,
                    ez_cash_number,
                    custom_details,
                    icon,
                    image_url,
                    display_order
                FROM deposit_details 
                WHERE id = ? AND is_active = 1`,
                [id]
            );

            if (methods.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Deposit method not found'
                });
            }

            res.json({
                success: true,
                method: methods[0]
            });

        } catch (error) {
            console.error('Get deposit method error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit method'
            });
        }
    });

    router.get('/admin/all', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const [methods] = await pool.execute(
                `SELECT 
                    id, 
                    type, 
                    name, 
                    description,
                    bank_name,
                    account_number,
                    account_holder,
                    branch,
                    ez_cash_number,
                    custom_details,
                    icon,
                    image_url,
                    is_active,
                    display_order,
                    created_at,
                    updated_at
                FROM deposit_details 
                ORDER BY display_order ASC`
            );

            res.json({
                success: true,
                methods: methods
            });

        } catch (error) {
            console.error('Get all deposit methods error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch deposit methods'
            });
        }
    });


    router.post('/admin/create', adminAuth.adminAuthMiddleware, upload.single('image'), async (req, res) => {
        try {
            const { 
                type, 
                name, 
                description, 
                bank_name, 
                account_number, 
                account_holder, 
                branch, 
                ez_cash_number, 
                custom_details, 
                icon, 
                is_active,
                display_order 
            } = req.body;

            if (!type || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Type and name are required'
                });
            }

            let image_url = null;
            if (req.file) {
                image_url = '/uploads/payments/' + req.file.filename;
                console.log('Image saved at:', image_url);
            }

            let order = display_order;
            if (order === undefined || order === null || order === '') {
                const [maxOrder] = await pool.execute(
                    'SELECT MAX(display_order) as max_order FROM deposit_details'
                );
                order = (maxOrder[0].max_order || 0) + 1;
            }

            const [result] = await pool.execute(
                `INSERT INTO deposit_details 
                (type, name, description, bank_name, account_number, account_holder, branch, ez_cash_number, custom_details, icon, image_url, is_active, display_order) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    type, 
                    name, 
                    description || null, 
                    bank_name || null, 
                    account_number || null, 
                    account_holder || null, 
                    branch || null, 
                    ez_cash_number || null, 
                    custom_details || null, 
                    icon || 'Landmark', 
                    image_url,
                    is_active !== undefined ? is_active : 1, 
                    order
                ]
            );
            const [newMethod] = await pool.execute(
                'SELECT * FROM deposit_details WHERE id = ?',
                [result.insertId]
            );

            res.json({
                success: true,
                message: 'Deposit method created successfully',
                method: newMethod[0]
            });

        } catch (error) {
            console.error('Create deposit method error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create deposit method: ' + error.message
            });
        }
    });

    router.put('/admin/:id', adminAuth.adminAuthMiddleware, upload.single('image'), async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                type, 
                name, 
                description, 
                bank_name, 
                account_number, 
                account_holder, 
                branch, 
                ez_cash_number, 
                custom_details, 
                icon, 
                is_active,
                display_order 
            } = req.body;

            const [existing] = await pool.execute(
                'SELECT id, image_url FROM deposit_details WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Deposit method not found'
                });
            }

            const currentMethod = existing[0];

            let image_url = currentMethod.image_url;
            if (req.file) {
                if (currentMethod.image_url) {
                    const oldImagePath = path.join(__dirname, '../', currentMethod.image_url);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log('Old image deleted:', oldImagePath);
                    }
                }
                image_url = '/uploads/payments/' + req.file.filename;
                console.log('New image saved at:', image_url);
            }

            await pool.execute(
                `UPDATE deposit_details SET 
                    type = ?,
                    name = ?,
                    description = ?,
                    bank_name = ?,
                    account_number = ?,
                    account_holder = ?,
                    branch = ?,
                    ez_cash_number = ?,
                    custom_details = ?,
                    icon = ?,
                    image_url = ?,
                    is_active = ?,
                    display_order = ?
                WHERE id = ?`,
                [
                    type, 
                    name, 
                    description || null, 
                    bank_name || null, 
                    account_number || null, 
                    account_holder || null, 
                    branch || null, 
                    ez_cash_number || null, 
                    custom_details || null, 
                    icon || 'Landmark', 
                    image_url,
                    is_active !== undefined ? is_active : 1, 
                    display_order,
                    id
                ]
            );
            const [updatedMethod] = await pool.execute(
                'SELECT * FROM deposit_details WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'Deposit method updated successfully',
                method: updatedMethod[0]
            });

        } catch (error) {
            console.error('Update deposit method error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update deposit method: ' + error.message
            });
        }
    });

    router.delete('/admin/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            const [methods] = await connection.execute(
                'SELECT image_url FROM deposit_details WHERE id = ?',
                [id]
            );

            if (methods.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Deposit method not found'
                });
            }

            const method = methods[0];

            if (method.image_url) {
                const imagePath = path.join(__dirname, '../', method.image_url);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('Image deleted:', imagePath);
                }
            }

            await connection.execute(
                'DELETE FROM deposit_details WHERE id = ?',
                [id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Deposit method deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Delete deposit method error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete deposit method'
            });
        } finally {
            connection.release();
        }
    });

    router.patch('/admin/:id/toggle', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            if (is_active === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'is_active field is required'
                });
            }

            await pool.execute(
                'UPDATE deposit_details SET is_active = ? WHERE id = ?',
                [is_active, id]
            );

            res.json({
                success: true,
                message: `Method ${is_active === 1 ? 'activated' : 'deactivated'} successfully`
            });

        } catch (error) {
            console.error('Toggle deposit method error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle deposit method status'
            });
        }
    });

    return router;
};

