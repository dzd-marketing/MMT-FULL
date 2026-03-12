const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const EmailService = require('../services/email.service');

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

    router.get('/', authMiddleware, async (req, res) => {
        try {
            const user_id = req.user.id;
            
            const [panels] = await pool.execute(`
                SELECT 
                    id,
                    domain,
                    panel_currency,
                    admin_username,
                    status,
                    renewal_date,
                    created_on,
                    charged_amount,
                    panel_uqid
                FROM child_panels 
                WHERE client_id = ? 
                ORDER BY created_on DESC
            `, [user_id]);

            res.json({
                success: true,
                panels: panels
            });
        } catch (error) {
            console.error('Error fetching child panels:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch child panels'
            });
        }
    });

    router.post('/send-email', authMiddleware, async (req, res) => {
        try {
            const { domain, panel_currency, admin_username, admin_password, user_name, user_email, user_id } = req.body;
            const price = parseFloat(process.env.CHILD_PANEL_PRICE || '10.00');

            await EmailService.sendChildPanelNotification(
                {
                    domain,
                    panel_currency,
                    admin_username,
                    admin_password,
                    price
                },
                {
                    name: user_name,
                    email: user_email,
                    id: user_id
                }
            );

        
            await EmailService.sendChildPanelConfirmationToUser(
                {
                    domain,
                    panel_currency,
                    admin_username,
                    admin_password,
                    price
                },
                {
                    name: user_name,
                    email: user_email
                }
            );

            res.json({
                success: true,
                message: 'Email notifications sent successfully'
            });
        } catch (error) {
            console.error('Error sending email notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send email notifications'
            });
        }
    });

    router.post('/', authMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const { domain, panel_currency, admin_username, admin_password } = req.body;
            const user_id = req.user.id;
            const price = parseFloat(process.env.CHILD_PANEL_PRICE || '10.00');

    
            if (!domain || !panel_currency || !admin_username || !admin_password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

 
            const [wallets] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

            if (wallets.length === 0 || wallets[0].available_balance < price) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }
                    const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(admin_password, saltRounds);

  
            const renewalDate = new Date();
            renewalDate.setDate(renewalDate.getDate() + 30);

            // Generate unique panel ID
            const panelUqid = crypto.createHash('md5')
                .update(crypto.randomBytes(16).toString('hex'))
                .digest('hex');

        const [insertResult] = await connection.execute(`
            INSERT INTO child_panels (
                client_id, domain, panel_currency, admin_username, 
                admin_password, charged_amount, renewal_date, 
                created_on, panel_uqid, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'active')
        `, [
            user_id, domain, panel_currency, admin_username,
            hashedPassword,
            price, renewalDate.toISOString().split('T')[0],
            panelUqid
        ]);

  
            await connection.execute(`
                UPDATE wallets 
                SET available_balance = available_balance - ?,
                    spent_balance = spent_balance + ?
                WHERE user_id = ?
            `, [price, price, user_id]);

            await connection.execute(`
                INSERT INTO client_report (client_id, action, report_ip, report_date)
                VALUES (?, ?, ?, NOW())
            `, [user_id, `New Child Panel Order #${insertResult.insertId}`, req.ip]);

            await connection.commit();


            const [updatedWallet] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

       
            const [users] = await pool.execute(`
                SELECT full_name as name, email FROM users WHERE id = ?
            `, [user_id]);

 
            try {
                const user = users[0];
                
                await EmailService.sendChildPanelNotification(
                    {
                        domain,
                        panel_currency,
                        admin_username,
                        admin_password,
                        price
                    },
                    {
                        name: user.name,
                        email: user.email,
                        id: user_id
                    }
                );

                await EmailService.sendChildPanelConfirmationToUser(
                    {
                        domain,
                        panel_currency,
                        admin_username,
                        admin_password,
                        price
                    },
                    {
                        name: user.name,
                        email: user.email
                    }
                );

                console.log('✅ Email notifications sent for panel #', insertResult.insertId);
            } catch (emailError) {
                console.error('❌ Failed to send email notifications:', emailError);
            }

            res.json({
                success: true,
                message: 'Child panel created successfully',
                panel_id: insertResult.insertId,
                domain: domain,
                price: price,
                balance: updatedWallet[0].available_balance
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error creating child panel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create child panel'
            });
        } finally {
            connection.release();
        }
    });


    router.post('/:id/renew', authMiddleware, async (req, res) => {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const panelId = req.params.id;
            const user_id = req.user.id;
            const price = parseFloat(process.env.CHILD_PANEL_PRICE || '10.00');

  
            const [panels] = await connection.execute(`
                SELECT * FROM child_panels 
                WHERE id = ? AND client_id = ?
            `, [panelId, user_id]);

            if (panels.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Panel not found'
                });
            }

            const [wallets] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

            if (wallets[0].available_balance < price) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance for renewal'
                });
            }

            const currentRenewal = new Date(panels[0].renewal_date);
            const newRenewal = new Date(currentRenewal);
            newRenewal.setDate(newRenewal.getDate() + 30);

            await connection.execute(`
                UPDATE child_panels 
                SET renewal_date = ?, status = 'active'
                WHERE id = ?
            `, [newRenewal.toISOString().split('T')[0], panelId]);

 
            await connection.execute(`
                UPDATE wallets 
                SET available_balance = available_balance - ?,
                    spent_balance = spent_balance + ?
                WHERE user_id = ?
            `, [price, price, user_id]);

            await connection.execute(`
                INSERT INTO client_report (client_id, action, report_ip, report_date)
                VALUES (?, ?, ?, NOW())
            `, [user_id, `Child Panel Renewed #${panelId}`, req.ip]);

            await connection.commit();

            const [updatedWallet] = await connection.execute(`
                SELECT available_balance FROM wallets WHERE user_id = ?
            `, [user_id]);

            res.json({
                success: true,
                message: 'Panel renewed successfully',
                new_renewal_date: newRenewal,
                balance: updatedWallet[0].available_balance
            });

        } catch (error) {
            await connection.rollback();
            console.error('Error renewing panel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to renew panel'
            });
        } finally {
            connection.release();
        }
    });

    return router;
};
