// routes/admin.tickets.js
const express = require('express');
const router = express.Router();
const adminEmailService = require('../services/admin.email.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {

    // ============= INLINE ADMIN AUTH MIDDLEWARE =============
    // Uses JWT_ADMIN_SECRET (same secret used in admin-auth.js to SIGN the token)
    const adminAuth = async (req, res, next) => {
        try {
            const token = req.cookies?.adminToken
                       || req.headers.authorization?.split(' ')[1];

            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET
            );

            if (decoded.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            if (decoded.step !== 'complete') {
                return res.status(403).json({ success: false, message: 'Authentication incomplete' });
            }

            // Check token not revoked
            try {
                const [revoked] = await pool.execute(
                    'SELECT id FROM admin_revoked_tokens WHERE token_jti = ?',
                    [decoded.jti]
                );
                if (revoked.length > 0) {
                    return res.status(401).json({ success: false, message: 'Token has been revoked' });
                }
            } catch (err) {
                console.warn('Revocation check skipped:', err.message);
            }

            req.adminEmail = decoded.email;
            req.userId = null; // New admin tokens have no userId — explicitly null for mysql2
            next();
        } catch (error) {
            console.error('Admin auth error:', error);
            return res.status(401).json({ success: false, message: 'Authentication failed' });
        }
    };

    // ============= MULTER CONFIG =============
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = './uploads/tickets';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `ticket-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only image, PDF, and document files are allowed'));
            }
        }
    });

    // Helper: format profile picture URL
    const formatProfilePicture = (profilePicture, baseUrl) => {
        if (!profilePicture) return null;
        if (profilePicture.startsWith('http')) return profilePicture;
        return `${baseUrl}${profilePicture}`;
    };

    // ============= TICKET STATS =============
    router.get('/stats', adminAuth, async (req, res) => {
        try {
            const [stats] = await pool.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                    COUNT(DISTINCT user_id) as unique_users
                FROM tickets
            `);

            const [departmentStats] = await pool.execute(`
                SELECT department, COUNT(*) as count FROM tickets GROUP BY department
            `);

            const [priorityStats] = await pool.execute(`
                SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority
            `);

            res.json({
                success: true,
                stats: {
                    ...stats[0],
                    by_department: departmentStats,
                    by_priority: priorityStats
                }
            });
        } catch (error) {
            console.error('Error fetching ticket stats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch ticket stats' });
        }
    });

    // ============= GET ALL TICKETS =============
    router.get('/', adminAuth, async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const status = req.query.status;
            const department = req.query.department;
            const priority = req.query.priority;
            const search = req.query.search;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    t.*,
                    u.full_name,
                    u.email,
                    u.profile_picture,
                    (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count,
                    (SELECT COUNT(*) FROM ticket_attachments WHERE ticket_id = t.id) as attachment_count
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (status && status !== 'all') { query += ` AND t.status = ?`; params.push(status); }
            if (department && department !== 'all') { query += ` AND t.department = ?`; params.push(department); }
            if (priority && priority !== 'all') { query += ` AND t.priority = ?`; params.push(priority); }
            if (search) {
                query += ` AND (t.ticket_number LIKE ? OR t.subject LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const countQuery = query.replace(
                `SELECT 
                    t.*,
                    u.full_name,
                    u.email,
                    u.profile_picture,
                    (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count,
                    (SELECT COUNT(*) FROM ticket_attachments WHERE ticket_id = t.id) as attachment_count`,
                'SELECT COUNT(*) as total'
            );
            const [countResult] = await pool.execute(countQuery, params);
            const total = countResult?.[0]?.total || 0;

            query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const [tickets] = await pool.execute(query, params);
            const baseUrl = process.env.API_URL || 'http://localhost:5000';

            const formattedTickets = tickets.map(ticket => ({
                ...ticket,
                profile_picture: formatProfilePicture(ticket.profile_picture, baseUrl)
            }));

            res.json({
                success: true,
                tickets: formattedTickets,
                pagination: { total, page, limit, pages: Math.ceil(total / limit) }
            });
        } catch (error) {
            console.error('Error fetching tickets:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
        }
    });

    // ============= GET SINGLE TICKET WITH REPLIES =============
    router.get('/:id', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const baseUrl = process.env.API_URL || 'http://localhost:5000';

            const [tickets] = await pool.execute(`
                SELECT t.*, u.full_name, u.email, u.profile_picture, u.balance, u.created_at as user_joined
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.id = ?
            `, [id]);

            if (tickets.length === 0) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            const ticket = {
                ...tickets[0],
                profile_picture: formatProfilePicture(tickets[0].profile_picture, baseUrl)
            };

            const [replies] = await pool.execute(`
                SELECT r.*, u.full_name, u.email, u.profile_picture, u.admin_type
                FROM ticket_replies r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.ticket_id = ?
                ORDER BY r.created_at ASC
            `, [id]);

            const formattedReplies = replies.map(reply => ({
                ...reply,
                // For staff replies with null user_id, show admin name from env
                full_name: reply.full_name || (reply.is_staff ? (process.env.VITE_ADMIN_NAME || 'Admin') : 'User'),
                profile_picture: formatProfilePicture(reply.profile_picture, baseUrl)
            }));

            const [attachments] = await pool.execute(`
                SELECT * FROM ticket_attachments WHERE ticket_id = ? ORDER BY created_at DESC
            `, [id]);

            const formattedAttachments = attachments.map(att => ({
                ...att,
                file_url: att.file_path?.startsWith('/')
                    ? `${baseUrl}${att.file_path}`
                    : att.file_path?.startsWith('http')
                        ? att.file_path
                        : `${baseUrl}/uploads/tickets/${path.basename(att.file_path || '')}`
            }));

            res.json({
                success: true,
                ticket: { ...ticket, replies: formattedReplies, attachments: formattedAttachments }
            });
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch ticket details' });
        }
    });

    // ============= REPLY TO TICKET =============
    router.post('/:id/reply', adminAuth, upload.array('attachments', 5), async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { message } = req.body;
            const files = req.files || [];
            const baseUrl = process.env.API_URL || 'http://localhost:5000';

            // Admin identity from token (no userId in new JWT)
            const adminName = process.env.VITE_ADMIN_NAME || 'Admin';
            const adminEmail = req.adminEmail || process.env.ADMIN_EMAIL || 'admin@panel.com';

            const [tickets] = await connection.execute(`
                SELECT t.*, u.email, u.full_name FROM tickets t
                JOIN users u ON t.user_id = u.id WHERE t.id = ?
            `, [id]);

            if (tickets.length === 0) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            const ticket = tickets[0];

            // Insert reply with NULL user_id (is_staff=1 marks it as admin reply)
            const [replyResult] = await connection.execute(`
                INSERT INTO ticket_replies (ticket_id, user_id, message, is_staff, created_at)
                VALUES (?, NULL, ?, 1, NOW())
            `, [id, message]);

            // Handle file uploads
            const attachments = [];
            for (const file of files) {
                const relativePath = `/uploads/tickets/${file.filename}`;
                const [attachResult] = await connection.execute(`
                    INSERT INTO ticket_attachments 
                    (ticket_id, reply_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NULL, NOW())
                `, [id, replyResult.insertId, file.originalname, relativePath, file.size, file.mimetype]);

                attachments.push({
                    id: attachResult.insertId,
                    file_name: file.originalname,
                    file_path: relativePath,
                    file_url: `${baseUrl}${relativePath}`,
                    file_size: file.size,
                    mime_type: file.mimetype
                });
            }

            // Update ticket status
            let newStatus = ticket.status;
            if (ticket.status === 'open') newStatus = 'in_progress';

            await connection.execute(`
                UPDATE tickets 
                SET status = ?, last_reply_at = NOW(), last_reply_by = NULL, updated_at = NOW()
                WHERE id = ?
            `, [newStatus, id]);

            await connection.commit();

            // Send email notification (non-blocking)
            try {
                await adminEmailService.sendTicketReplyNotification(
                    { ticket_number: ticket.ticket_number, subject: ticket.subject, status: newStatus },
                    { message: message, is_staff: true },
                    { name: ticket.full_name, email: ticket.email }
                );
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }

            res.json({
                success: true,
                message: 'Reply sent successfully',
                reply: {
                    id: replyResult.insertId,
                    message: message,
                    created_at: new Date(),
                    is_staff: true,
                    attachments: attachments,
                    user: {
                        full_name: adminName,
                        email: adminEmail,
                        profile_picture: null,
                        admin_type: '1'
                    }
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error sending ticket reply:', error);
            res.status(500).json({ success: false, message: 'Failed to send reply' });
        } finally {
            connection.release();
        }
    });

    // ============= UPDATE TICKET STATUS =============
    router.put('/:id/status', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { status } = req.body;

            const [tickets] = await connection.execute(`
                SELECT t.*, u.email, u.full_name FROM tickets t
                JOIN users u ON t.user_id = u.id WHERE t.id = ?
            `, [id]);

            if (tickets.length === 0) {
                return res.status(404).json({ success: false, message: 'Ticket not found' });
            }

            const ticket = tickets[0];

            await connection.execute(`
                UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?
            `, [status, id]);

            await connection.commit();

            try {
                await adminEmailService.sendTicketStatusUpdateNotification(
                    { ticket_number: ticket.ticket_number, subject: ticket.subject, status },
                    { name: ticket.full_name, email: ticket.email }
                );
            } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
            }

            res.json({ success: true, message: 'Ticket status updated successfully' });

        } catch (error) {
            await connection.rollback();
            console.error('Error updating ticket status:', error);
            res.status(500).json({ success: false, message: 'Failed to update ticket status' });
        } finally {
            connection.release();
        }
    });

    // ============= UPDATE TICKET PRIORITY =============
    router.put('/:id/priority', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { priority } = req.body;
            await pool.execute(`UPDATE tickets SET priority = ?, updated_at = NOW() WHERE id = ?`, [priority, id]);
            res.json({ success: true, message: 'Ticket priority updated successfully' });
        } catch (error) {
            console.error('Error updating ticket priority:', error);
            res.status(500).json({ success: false, message: 'Failed to update ticket priority' });
        }
    });

    // ============= UPDATE TICKET DEPARTMENT =============
    router.put('/:id/department', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { department } = req.body;
            await pool.execute(`UPDATE tickets SET department = ?, updated_at = NOW() WHERE id = ?`, [department, id]);
            res.json({ success: true, message: 'Ticket department updated successfully' });
        } catch (error) {
            console.error('Error updating ticket department:', error);
            res.status(500).json({ success: false, message: 'Failed to update ticket department' });
        }
    });

    // ============= ASSIGN TICKET =============
    router.post('/:id/assign', adminAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const { admin_id } = req.body;
            // Use provided admin_id or null — never req.userId (undefined in new auth)
            await pool.execute(
                `UPDATE tickets SET assigned_to = ?, updated_at = NOW() WHERE id = ?`,
                [admin_id || null, id]
            );
            res.json({ success: true, message: 'Ticket assigned successfully' });
        } catch (error) {
            console.error('Error assigning ticket:', error);
            res.status(500).json({ success: false, message: 'Failed to assign ticket' });
        }
    });

    // ============= DELETE TICKET =============
    router.delete('/:id', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { permanent } = req.query;

            if (permanent === 'true') {
                const [attachments] = await connection.execute(
                    'SELECT file_path FROM ticket_attachments WHERE ticket_id = ?', [id]
                );
                for (const attachment of attachments) {
                    try {
                        const fullPath = path.join(__dirname, '..', attachment.file_path);
                        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                    } catch (fileError) {
                        console.error('Error deleting file:', fileError);
                    }
                }
                await connection.execute('DELETE FROM tickets WHERE id = ?', [id]);
            } else {
                await connection.execute(
                    `UPDATE tickets SET status = 'closed' WHERE id = ?`, [id]
                );
            }

            await connection.commit();
            res.json({
                success: true,
                message: permanent === 'true' ? 'Ticket permanently deleted' : 'Ticket closed'
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error deleting ticket:', error);
            res.status(500).json({ success: false, message: 'Failed to delete ticket' });
        } finally {
            connection.release();
        }
    });

    // ============= BULK ACTIONS =============
    router.post('/bulk-action', adminAuth, async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { action, ticket_ids, value } = req.body;

            if (!ticket_ids || ticket_ids.length === 0) {
                return res.status(400).json({ success: false, message: 'No tickets selected' });
            }

            const placeholders = ticket_ids.map(() => '?').join(',');

            switch (action) {
                case 'status':
                    await connection.execute(
                        `UPDATE tickets SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
                        [value, ...ticket_ids]
                    );
                    break;
                case 'priority':
                    await connection.execute(
                        `UPDATE tickets SET priority = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
                        [value, ...ticket_ids]
                    );
                    break;
                case 'department':
                    await connection.execute(
                        `UPDATE tickets SET department = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
                        [value, ...ticket_ids]
                    );
                    break;
                case 'assign':
                    await connection.execute(
                        `UPDATE tickets SET assigned_to = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
                        [value || null, ...ticket_ids]
                    );
                    break;
                case 'delete':
                    await connection.execute(
                        `UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id IN (${placeholders})`,
                        ticket_ids
                    );
                    break;
                default:
                    throw new Error('Invalid action');
            }

            await connection.commit();
            res.json({
                success: true,
                message: `Bulk action '${action}' completed on ${ticket_ids.length} tickets`
            });
        } catch (error) {
            await connection.rollback();
            console.error('Error performing bulk action:', error);
            res.status(500).json({ success: false, message: 'Failed to perform bulk action' });
        } finally {
            connection.release();
        }
    });

    // ============= ANALYTICS =============
    router.get('/analytics/chart-data', adminAuth, async (req, res) => {
        try {
            const { range = '7d' } = req.query;

            let interval, groupFormat;
            switch (range) {
                case '24h': interval = '24 HOUR'; groupFormat = '%Y-%m-%d %H:00'; break;
                case '7d':  interval = '7 DAY';   groupFormat = '%Y-%m-%d'; break;
                case '30d': interval = '30 DAY';  groupFormat = '%Y-%m-%d'; break;
                case '12m': interval = '12 MONTH'; groupFormat = '%Y-%m'; break;
                default:    interval = '7 DAY';   groupFormat = '%Y-%m-%d';
            }

            const [ticketsOverTime] = await pool.execute(`
                SELECT 
                    DATE_FORMAT(created_at, ?) as period,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
                FROM tickets
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
                GROUP BY period
                ORDER BY period ASC
            `, [groupFormat]);

            const [responseTimeStats] = await pool.execute(`
                SELECT 
                    AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.last_reply_at)) as avg_response_hours,
                    MIN(TIMESTAMPDIFF(HOUR, t.created_at, t.last_reply_at)) as min_response_hours,
                    MAX(TIMESTAMPDIFF(HOUR, t.created_at, t.last_reply_at)) as max_response_hours
                FROM tickets t
                WHERE t.last_reply_at IS NOT NULL
            `);

            res.json({
                success: true,
                analytics: {
                    tickets_over_time: ticketsOverTime,
                    response_times: responseTimeStats[0]
                }
            });
        } catch (error) {
            console.error('Error fetching ticket analytics:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch ticket analytics' });
        }
    });

    return router;
};