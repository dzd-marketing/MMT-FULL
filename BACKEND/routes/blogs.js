const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Get all blogs
    router.get('/all', async (req, res) => {
        try {
            const [blogs] = await pool.execute(
                `SELECT 
                    id, 
                    title, 
                    slug, 
                    short_description, 
                    featured_image,
                    DATE_FORMAT(published_at, '%M %d, %Y') as published_date
                FROM blogs 
                ORDER BY published_at DESC`
            );

            res.json({
                success: true,
                blogs: blogs
            });

        } catch (error) {
            console.error('Get blogs error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch blogs'
            });
        }
    });

    // Get single blog by slug
    router.get('/:slug', async (req, res) => {
        try {
            const { slug } = req.params;

            const [blogs] = await pool.execute(
                `SELECT 
                    id, 
                    title, 
                    slug, 
                    full_description,
                    featured_image,
                    DATE_FORMAT(published_at, '%M %d, %Y') as published_date
                FROM blogs 
                WHERE slug = ?`,
                [slug]
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

    return router;
};