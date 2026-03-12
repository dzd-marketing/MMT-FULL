const nodemailer = require('nodemailer');

class AdminEmailService {
    constructor() {
        console.log('📧 Initializing AdminEmailService with config:', {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE,
            user: process.env.EMAIL_USER,
            passExists: !!process.env.EMAIL_PASS,
            from: process.env.EMAIL_FROM
        });

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            debug: true,
            logger: true
        });

   
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Admin email service: SMTP connection verified successfully');
        } catch (error) {
            console.error('❌ Admin email service: SMTP connection failed:');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
        }
    }

    async sendTicketReplyNotification(ticketData, replyData, userData) {
        const { ticket_number, subject, status } = ticketData;
        const { message } = replyData;
        const { name, email } = userData;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `💬 Admin Reply on Ticket #${ticket_number} - ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Admin Reply - Ticket #${ticket_number}</title>
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 24px;
                            overflow: hidden;
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                        }
                        .header {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: white;
                            margin: 0;
                            font-size: 28px;
                            font-weight: 600;
                        }
                        .content {
                            padding: 40px 30px;
                            background-color: #ffffff;
                        }
                        .ticket-card {
                            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                            border: 1px solid #eaeaea;
                            border-radius: 16px;
                            padding: 25px;
                            margin: 20px 0;
                        }
                        .ticket-number {
                            font-size: 24px;
                            font-weight: bold;
                            color: #6366f1;
                            margin-bottom: 15px;
                            text-align: center;
                            letter-spacing: 1px;
                        }
                        .admin-badge {
                            display: inline-block;
                            background: #6366f1;
                            color: white;
                            padding: 8px 20px;
                            border-radius: 50px;
                            font-size: 14px;
                            font-weight: 600;
                            margin: 15px 0;
                            text-align: center;
                        }
                        .message-box {
                            background-color: #f8f9fa;
                            padding: 25px;
                            border-radius: 12px;
                            margin: 20px 0;
                            border-left: 4px solid #6366f1;
                            white-space: pre-wrap;
                            font-family: 'Inter', sans-serif;
                            line-height: 1.6;
                        }
                        .info-row {
                            display: flex;
                            margin-bottom: 10px;
                            padding: 8px 0;
                            border-bottom: 1px dashed #eaeaea;
                        }
                        .info-label {
                            width: 100px;
                            color: #666;
                            font-weight: 500;
                        }
                        .info-value {
                            flex: 1;
                            color: #1a1a1a;
                            font-weight: 600;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            color: white !important;
                            text-decoration: none;
                            padding: 14px 36px;
                            border-radius: 50px;
                            font-weight: 500;
                            font-size: 16px;
                            margin: 20px 0;
                            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
                        }
                        .footer {
                            padding: 30px;
                            background-color: #f9f9f9;
                            text-align: center;
                            border-top: 1px solid #eaeaea;
                        }
                        .footer p {
                            color: #999999;
                            font-size: 14px;
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>💬 Admin Replied to Your Ticket</h1>
                        </div>
                        <div class="content">
                            <h2 style="text-align: center; color: #1a1a1a;">Hello ${name}!</h2>
                            
                            <div class="ticket-card">
                                <div class="ticket-number">#${ticket_number}</div>
                                
                                <div style="text-align: center;">
                                    <span class="admin-badge">👨‍💼 Support Team Reply</span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">Subject:</span>
                                    <span class="info-value">${subject}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Status:</span>
                                    <span class="info-value">${status.replace('_', ' ').toUpperCase()}</span>
                                </div>
                            </div>

                            <h3 style="color: #1a1a1a; margin-top: 30px;">Support Team Message:</h3>
                            <div class="message-box">
                                ${message.replace(/\n/g, '<br>')}
                            </div>

                            <div style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL}/dashboard/tickets/${ticket_number}" class="button">
                                    View Full Conversation
                                </a>
                            </div>

                            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                                You can reply to this ticket by visiting your dashboard. Our support team is here to help!
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 Make Me Trend. All rights reserved.</p>
                            <p>This is an automated message from our support system.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Admin email service: Ticket reply notification sent to user:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Admin email service: Error sending ticket reply notification:', error);
            throw error;
        }
    }

  
    async sendNewTicketNotification(ticketData, userData) {
        const { ticket_number, subject, department, priority, message } = ticketData;
        const { name, email, id } = userData;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            subject: `🎫 New Support Ticket: ${ticket_number} - ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Support Ticket - Admin Notification</title>
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 24px;
                            overflow: hidden;
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                        }
                        .header {
                            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: white;
                            margin: 0;
                            font-size: 28px;
                            font-weight: 600;
                        }
                        .content {
                            padding: 40px 30px;
                            background-color: #ffffff;
                        }
                        .ticket-info {
                            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                            border: 1px solid #eaeaea;
                            border-radius: 16px;
                            padding: 25px;
                            margin: 20px 0;
                        }
                        .ticket-number {
                            font-size: 28px;
                            font-weight: bold;
                            color: #ef4444;
                            margin-bottom: 20px;
                            text-align: center;
                            letter-spacing: 2px;
                        }
                        .priority-badge {
                            display: inline-block;
                            padding: 6px 16px;
                            border-radius: 50px;
                            font-size: 12px;
                            font-weight: 600;
                            text-transform: uppercase;
                            margin-left: 10px;
                        }
                        .priority-urgent { background: #dc2626; color: white; }
                        .priority-high { background: #f97316; color: white; }
                        .priority-medium { background: #eab308; color: black; }
                        .priority-low { background: #10b981; color: white; }
                        .user-section {
                            background-color: #f0f9ff;
                            border: 1px solid #bae6fd;
                            border-radius: 12px;
                            padding: 20px;
                            margin: 20px 0;
                        }
                        .info-row {
                            display: flex;
                            margin-bottom: 10px;
                            padding: 8px 0;
                            border-bottom: 1px dashed #eaeaea;
                        }
                        .info-label {
                            width: 120px;
                            color: #666;
                            font-weight: 500;
                        }
                        .info-value {
                            flex: 1;
                            color: #1a1a1a;
                            font-weight: 600;
                        }
                        .message-box {
                            background-color: #f8f9fa;
                            padding: 25px;
                            border-radius: 12px;
                            margin: 20px 0;
                            border-left: 4px solid #ef4444;
                            white-space: pre-wrap;
                            font-family: 'Inter', sans-serif;
                            line-height: 1.6;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                            color: white !important;
                            text-decoration: none;
                            padding: 14px 36px;
                            border-radius: 50px;
                            font-weight: 500;
                            font-size: 16px;
                            margin: 20px 0;
                            box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
                        }
                        .footer {
                            padding: 30px;
                            background-color: #f9f9f9;
                            text-align: center;
                            border-top: 1px solid #eaeaea;
                        }
                        .footer p {
                            color: #999999;
                            font-size: 14px;
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎫 New Support Ticket</h1>
                        </div>
                        <div class="content">
                            <p style="font-size: 16px; color: #1a1a1a;">A new support ticket has been created and requires attention.</p>
                            
                            <div class="ticket-info">
                                <div class="ticket-number">${ticket_number}</div>
                                
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <span class="priority-badge priority-${priority}">${priority} priority</span>
                                </div>
                                
                                <div class="info-row">
                                    <span class="info-label">Subject:</span>
                                    <span class="info-value">${subject}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Department:</span>
                                    <span class="info-value">${department}</span>
                                </div>
                            </div>

                            <div class="user-section">
                                <h3 style="margin-top: 0; color: #0369a1;">👤 User Details</h3>
                                <div class="info-row">
                                    <span class="info-label">Name:</span>
                                    <span class="info-value">${name}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Email:</span>
                                    <span class="info-value">${email}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">User ID:</span>
                                    <span class="info-value">#${id}</span>
                                </div>
                            </div>

                            <h3 style="color: #1a1a1a;">User Message:</h3>
                            <div class="message-box">
                                ${message.replace(/\n/g, '<br>')}
                            </div>

                            <div style="text-align: center;">
                                <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/admin/tickets/${ticket_number}" class="button">
                                    View in Admin Panel
                                </a>
                            </div>

                            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                                Please respond to this ticket as soon as possible.
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 Make Me Trend. All rights reserved.</p>
                            <p>Admin Notification System</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Admin email service: New ticket notification sent to admin:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Admin email service: Error sending new ticket notification:', error);
            throw error;
        }
    }

    async sendTicketStatusUpdateNotification(ticketData, userData) {
        const { ticket_number, subject, status } = ticketData;
        const { name, email } = userData;

        const statusColors = {
            'open': '#10b981',
            'in_progress': '#6366f1',
            'waiting': '#f97316',
            'resolved': '#22c55e',
            'closed': '#6b7280'
        };

        const statusIcons = {
            'open': '🟢',
            'in_progress': '🔄',
            'waiting': '⏳',
            'resolved': '✅',
            'closed': '🔒'
        };

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `📝 Ticket #${ticket_number} Status Updated - ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ticket Status Updated</title>
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: #f5f5f5;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background-color: #ffffff;
                            border-radius: 24px;
                            overflow: hidden;
                            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                        }
                        .header {
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: white;
                            margin: 0;
                            font-size: 28px;
                            font-weight: 600;
                        }
                        .content {
                            padding: 40px 30px;
                            background-color: #ffffff;
                        }
                        .status-card {
                            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                            border: 1px solid #eaeaea;
                            border-radius: 16px;
                            padding: 30px;
                            margin: 20px 0;
                            text-align: center;
                        }
                        .status-icon {
                            font-size: 48px;
                            margin-bottom: 20px;
                        }
                        .status-badge {
                            display: inline-block;
                            background: ${statusColors[status] || '#6366f1'};
                            color: white;
                            padding: 12px 30px;
                            border-radius: 50px;
                            font-size: 18px;
                            font-weight: 600;
                            margin: 15px 0;
                        }
                        .ticket-number {
                            font-size: 24px;
                            font-weight: bold;
                            color: #6366f1;
                            margin-bottom: 15px;
                        }
                        .info-row {
                            display: flex;
                            margin-bottom: 10px;
                            padding: 8px 0;
                            border-bottom: 1px dashed #eaeaea;
                        }
                        .info-label {
                            width: 100px;
                            color: #666;
                            font-weight: 500;
                        }
                        .info-value {
                            flex: 1;
                            color: #1a1a1a;
                            font-weight: 600;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                            color: white !important;
                            text-decoration: none;
                            padding: 14px 36px;
                            border-radius: 50px;
                            font-weight: 500;
                            font-size: 16px;
                            margin: 20px 0;
                            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
                        }
                        .footer {
                            padding: 30px;
                            background-color: #f9f9f9;
                            text-align: center;
                            border-top: 1px solid #eaeaea;
                        }
                        .footer p {
                            color: #999999;
                            font-size: 14px;
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📝 Ticket Status Updated</h1>
                        </div>
                        <div class="content">
                            <h2 style="text-align: center; color: #1a1a1a;">Hello ${name}!</h2>
                            
                            <div class="status-card">
                                <div class="status-icon">${statusIcons[status] || '📋'}</div>
                                <div class="ticket-number">#${ticket_number}</div>
                                <div class="status-badge">${status.replace('_', ' ').toUpperCase()}</div>
                                
                                <div class="info-row" style="margin-top: 20px;">
                                    <span class="info-label">Subject:</span>
                                    <span class="info-value">${subject}</span>
                                </div>
                            </div>

                            <p style="color: #666; line-height: 1.6; text-align: center;">
                                Your ticket status has been updated. Click the button below to view the full conversation and any responses from our support team.
                            </p>

                            <div style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL}/dashboard/tickets/${ticket_number}" class="button">
                                    View Ticket
                                </a>
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2025 Make Me Trend. All rights reserved.</p>
                            <p>Support System</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Admin email service: Status update notification sent to user:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Admin email service: Error sending status update notification:', error);
            throw error;
        }
    }
}

module.exports = new AdminEmailService();
