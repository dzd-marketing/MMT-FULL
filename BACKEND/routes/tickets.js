// routes/tickets.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/email.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/tickets');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `ticket-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|zip|rar|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDF, ZIP, RAR, DOC files are allowed'));
        }
    }
});

module.exports = (pool) => {
    // Auth middleware
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
                'SELECT id, full_name as name, email FROM users WHERE id = ?',
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

    // Generate unique ticket number
    const generateTicketNumber = async () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Get count of tickets created today
        const [result] = await pool.execute(
            'SELECT COUNT(*) as count FROM tickets WHERE DATE(created_at) = CURDATE()'
        );
        
        const count = (result[0].count + 1).toString().padStart(4, '0');
        
        return `TKT-${year}${month}${day}-${count}`;
    };

    // Create new ticket
    router.post('/', authMiddleware, upload.array('attachments', 5), async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const { subject, department, priority, message } = req.body;
            const user_id = req.user.id;

            // Validate required fields
            if (!subject || !department || !priority || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'All required fields must be filled'
                });
            }

            // Generate ticket number
            const ticketNumber = await generateTicketNumber();

            // Process attachments
            let attachments = [];
            if (req.files && req.files.length > 0) {
                attachments = req.files.map(file => ({
                    file_name: file.originalname,
                    file_path: file.path,
                    file_size: file.size,
                    mime_type: file.mimetype
                }));
            }

            // Insert ticket
            const [ticketResult] = await connection.execute(
                `INSERT INTO tickets (
                    user_id, ticket_number, subject, department, priority, 
                    status, message, attachments
                ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
                [
                    user_id, 
                    ticketNumber, 
                    subject, 
                    department, 
                    priority, 
                    message,
                    attachments.length > 0 ? JSON.stringify(attachments) : null
                ]
            );

            // Insert attachments into ticket_attachments table
            if (attachments.length > 0) {
                for (const attachment of attachments) {
                    await connection.execute(
                        `INSERT INTO ticket_attachments (
                            ticket_id, file_name, file_path, file_size, mime_type, uploaded_by
                        ) VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            ticketResult.insertId,
                            attachment.file_name,
                            attachment.file_path,
                            attachment.file_size,
                            attachment.mime_type,
                            user_id
                        ]
                    );
                }
            }

            await connection.commit();

            // Send email notifications
            try {
                // Send email to admin
                await emailService.sendTicketNotification({
                    ticket_number: ticketNumber,
                    subject,
                    department,
                    priority,
                    message
                }, req.user);

                // Send confirmation to user
                await emailService.sendTicketConfirmationToUser({
                    ticket_number: ticketNumber,
                    subject,
                    department,
                    priority,
                    message
                }, req.user);

                console.log('Ticket emails sent successfully');
            } catch (emailError) {
                console.error('Error sending ticket emails:', emailError);
                // Don't fail the request if email fails
            }

            res.json({
                success: true,
                message: 'Ticket created successfully',
                ticket: {
                    id: ticketResult.insertId,
                    ticket_number: ticketNumber,
                    subject,
                    department,
                    priority,
                    status: 'open'
                }
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create ticket'
            });
        } finally {
            connection.release();
        }
    });

    // Get user's tickets
    router.get('/my-tickets', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;
            const { page = 1, limit = 10, status, search } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    id,
                    ticket_number,
                    subject,
                    department,
                    priority,
                    status,
                    created_at,
                    last_reply_at,
                    (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = tickets.id) as reply_count
                FROM tickets 
                WHERE user_id = ?
            `;
            
            const params = [user_id];

            if (status && status !== 'all') {
                query += ' AND status = ?';
                params.push(status);
            }

            if (search) {
                query += ' AND (subject LIKE ? OR ticket_number LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), parseInt(offset));

            const [tickets] = await pool.execute(query, params);

            // Get total count
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as total FROM tickets WHERE user_id = ?',
                [user_id]
            );

            res.json({
                success: true,
                tickets,
                pagination: {
                    total: countResult[0].total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(countResult[0].total / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching tickets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tickets'
            });
        }
    });

    // Get single ticket details with replies
    router.get('/:ticketNumber', authMiddleware, async (req, res) => {
        try {
            const { ticketNumber } = req.params;
            const user_id = req.user.id;

            const [tickets] = await pool.execute(
                `SELECT 
                    t.*,
                    u.full_name as user_name,
                    u.email as user_email
                FROM tickets t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.ticket_number = ? AND t.user_id = ?`,
                [ticketNumber, user_id]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            const ticket = tickets[0];

            // Get replies
            const [replies] = await pool.execute(
                `SELECT 
                    r.*,
                    u.full_name as user_name,
                    u.email as user_email
                FROM ticket_replies r
                LEFT JOIN users u ON r.user_id = u.id
                WHERE r.ticket_id = ?
                ORDER BY r.created_at ASC`,
                [ticket.id]
            );

            // Get attachments
            const [attachments] = await pool.execute(
                'SELECT * FROM ticket_attachments WHERE ticket_id = ?',
                [ticket.id]
            );

            res.json({
                success: true,
                ticket: {
                    ...ticket,
                    replies,
                    attachments
                }
            });

        } catch (error) {
            console.error('Error fetching ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch ticket details'
            });
        }
    });

    // Reply to ticket
    router.post('/:ticketNumber/reply', authMiddleware, upload.array('attachments', 5), async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const { ticketNumber } = req.params;
            const { message } = req.body;
            const user_id = req.user.id;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            // Get ticket
            const [tickets] = await connection.execute(
                'SELECT id, status FROM tickets WHERE ticket_number = ? AND user_id = ?',
                [ticketNumber, user_id]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket not found'
                });
            }

            const ticket = tickets[0];

            // Insert reply
            const [replyResult] = await connection.execute(
                `INSERT INTO ticket_replies (
                    ticket_id, user_id, message, is_staff
                ) VALUES (?, ?, ?, ?)`,
                [ticket.id, user_id, message, false]
            );

            // Process attachments for reply
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    await connection.execute(
                        `INSERT INTO ticket_attachments (
                            ticket_id, reply_id, file_name, file_path, 
                            file_size, mime_type, uploaded_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            ticket.id,
                            replyResult.insertId,
                            file.originalname,
                            file.path,
                            file.size,
                            file.mimetype,
                            user_id
                        ]
                    );
                }
            }

            // Update ticket status and last_reply
            await connection.execute(
                `UPDATE tickets 
                 SET status = 'waiting', 
                     last_reply_at = NOW(),
                     last_reply_by = ?
                 WHERE id = ?`,
                [user_id, ticket.id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Reply added successfully',
                reply_id: replyResult.insertId
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error replying to ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add reply'
            });
        } finally {
            connection.release();
        }
    });

    return router;
};
