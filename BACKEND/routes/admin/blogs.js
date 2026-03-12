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
            const uploadDir = path.join(__dirname, '../../uploads/blogs');
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
            const filename = 'blog-' + uniqueSuffix + ext;
            console.log('Generated filename:', filename); 
            cb(null, filename);
        }
    });

    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
            console.log('Received file:', file.originalname, file.mimetype);
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

    router.get('/all', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const [blogs] = await pool.execute(
                `SELECT 
                    id, 
                    title, 
                    slug, 
                    short_description, 
                    featured_image,
                    published_at,
                    created_at,
                    updated_at
                FROM blogs 
                ORDER BY created_at DESC`
            );

            res.json({
                success: true,
                blogs: blogs
            });

        } catch (error) {
            console.error('Get admin blogs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch blogs'
            });
        }
    });

    router.get('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        try {
            const { id } = req.params;

            const [blogs] = await pool.execute(
                `SELECT * FROM blogs WHERE id = ?`,
                [id]
            );

            if (blogs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }

            res.json({
                success: true,
                blog: blogs[0]
            });

        } catch (error) {
            console.error('Get blog error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch blog'
            });
        }
    });

    router.post('/create', adminAuth.adminAuthMiddleware, (req, res, next) => {
        console.log('Create blog request received');
        console.log('Headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        next();
    }, upload.single('featured_image'), async (req, res) => {
        console.log('After multer - req.file:', req.file);
        console.log('After multer - req.body:', req.body);
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { title, short_description, full_description } = req.body;
            
            if (!title || !short_description || !full_description) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }
            let slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const [existing] = await connection.execute(
                'SELECT id FROM blogs WHERE slug = ?',
                [slug]
            );

            if (existing.length > 0) {
                slug = slug + '-' + Date.now();
            }

            let featured_image = null;
            if (req.file) {
                featured_image = '/uploads/blogs/' + req.file.filename;
                console.log('Featured image path:', featured_image);
            }

            const [result] = await connection.execute(
                `INSERT INTO blogs (
                    title, slug, short_description, full_description, featured_image, published_at
                ) VALUES (?, ?, ?, ?, ?, NOW())`,
                [title, slug, short_description, full_description, featured_image]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Blog created successfully',
                blogId: result.insertId,
                featured_image: featured_image
            });

        } catch (error) {
            await connection.rollback();
            console.error('Create blog error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create blog: ' + error.message
            });
        } finally {
            connection.release();
        }
    });

    router.put('/:id', adminAuth.adminAuthMiddleware, upload.single('featured_image'), async (req, res) => {
        console.log('Update blog request received');
        console.log('req.file:', req.file);
        console.log('req.body:', req.body);
        
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { title, short_description, full_description } = req.body;

            const [existing] = await connection.execute(
                'SELECT * FROM blogs WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }

            const blog = existing[0];

            let slug = blog.slug;
            if (title !== blog.title) {
                slug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                const [slugCheck] = await connection.execute(
                    'SELECT id FROM blogs WHERE slug = ? AND id != ?',
                    [slug, id]
                );

                if (slugCheck.length > 0) {
                    slug = slug + '-' + Date.now();
                }
            }

            let featured_image = blog.featured_image;
            if (req.file) {

                if (blog.featured_image) {
                    const oldImagePath = path.join(__dirname, '../../', blog.featured_image);
                    console.log('Deleting old image:', oldImagePath);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                featured_image = '/uploads/blogs/' + req.file.filename;
            }

            await connection.execute(
                `UPDATE blogs SET 
                    title = ?, 
                    slug = ?, 
                    short_description = ?, 
                    full_description = ?, 
                    featured_image = ?,
                    updated_at = NOW()
                WHERE id = ?`,
                [title, slug, short_description, full_description, featured_image, id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Blog updated successfully',
                featured_image: featured_image
            });

        } catch (error) {
            await connection.rollback();
            console.error('Update blog error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update blog: ' + error.message
            });
        } finally {
            connection.release();
        }
    });

  
    router.delete('/:id', adminAuth.adminAuthMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            const [blogs] = await connection.execute(
                'SELECT featured_image FROM blogs WHERE id = ?',
                [id]
            );

            if (blogs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }

            const blog = blogs[0];

            if (blog.featured_image) {
                const imagePath = path.join(__dirname, '../../', blog.featured_image);
                console.log('Deleting image:', imagePath);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await connection.execute('DELETE FROM blogs WHERE id = ?', [id]);

            await connection.commit();

            res.json({
                success: true,
                message: 'Blog deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            console.error('Delete blog error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete blog'
            });
        } finally {
            connection.release();
        }
    });

    return router;

};
