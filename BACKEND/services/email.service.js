const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        console.log('📧 Initializing EmailService with config:', {
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
            debug: true, // Enable debug logs
            logger: true  // Log 
        });

        // Test connection on initialization
        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection verified successfully');
        } catch (error) {
            console.error('❌ SMTP connection failed:');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
        }
    }

    async sendVerificationCode(to, code) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Your Verification Code - Make Me Trend',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px; text-align: center; }
                    .code { font-size: 48px; font-weight: bold; color: #6366f1; letter-spacing: 10px; margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 12px; }
                    .footer { padding: 30px; background: #f9f9f9; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎨 Make Me Trend</h1>
                    </div>
                    <div class="content">
                        <h2>Your Verification Code</h2>
                        <p>Use the following 6-digit code to verify your email:</p>
                        <div class="code">${code}</div>
                        <p>This code will expire in 10 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Verification code email sent:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Error sending verification code:', error);
        throw error;
    }
}

async sendWelcomeEmail(to, name) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Welcome to Make Me Trend!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Make Me Trend</title>
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
                    .content h2 {
                        color: #1a1a1a;
                        font-size: 22px;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .content p {
                        color: #666666;
                        line-height: 1.6;
                        margin-bottom: 20px;
                        font-size: 16px;
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
                        <h1>🎉 Welcome to Make Me Trend!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${name}!</h2>
                        <p>Your email has been successfully verified. You can now log in to your account and start managing your trends with our powerful tools.</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/login" class="button">Log In to Your Account</a>
                        </div>
                        
                        <p>Here's what you can do with Make Me Trend:</p>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>📊 Track and analyze trends in real-time</li>
                            <li>📈 Create custom reports and insights</li>
                            <li>🤝 Collaborate with your team</li>
                            <li>🚀 Scale your business with powerful tools</li>
                        </ul>
                        
                        <p>If you have any questions, feel free to contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Made with ❤️ for trend management</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
}

// email.service.js එකට මේ methods එකතු කරන්න

async sendDepositNotification(depositData, userData) {
    const { id, amount, receipt_url, created_at } = depositData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL, // Admin ට යන mail
        subject: `💰 New Deposit Request - LKR ${amount}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px; }
                    .amount { font-size: 48px; font-weight: bold; color: #6366f1; text-align: center; margin: 20px 0; }
                    .details { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eaeaea; }
                    .label { color: #666; font-weight: 500; }
                    .value { color: #1a1a1a; font-weight: 600; }
                    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 500; margin: 20px 0; }
                    .footer { padding: 30px; background: #f9f9f9; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💰 New Deposit Request</h1>
                    </div>
                    <div class="content">
                        <div class="amount">LKR ${amount.toLocaleString()}</div>
                        
                        <div class="details">
                            <div class="row">
                                <span class="label">User Name:</span>
                                <span class="value">${name}</span>
                            </div>
                            <div class="row">
                                <span class="label">User Email:</span>
                                <span class="value">${email}</span>
                            </div>
                            <div class="row">
                                <span class="label">Deposit ID:</span>
                                <span class="value">#${id}</span>
                            </div>
                            <div class="row">
                                <span class="label">Date:</span>
                                <span class="value">${new Date(created_at).toLocaleString()}</span>
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/admin/deposits" class="button">
                                View in Admin Panel
                            </a>
                        </div>
                        
                        <p style="color: #666; text-align: center; margin-top: 30px;">
                            This deposit requires your approval. Please review the receipt.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Deposit notification email sent to admin:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending deposit notification:', error);
        throw error;
    }
}

async sendDepositConfirmationToUser(depositData, userData) {
    const { id, amount, receipt_url, created_at } = depositData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email, // User ට යන mail
        subject: `✅ Deposit Request Received - LKR ${amount}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px; }
                    .success-icon { text-align: center; font-size: 64px; margin-bottom: 20px; }
                    .amount { font-size: 48px; font-weight: bold; color: #6366f1; text-align: center; margin: 20px 0; }
                    .details { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eaeaea; }
                    .label { color: #666; font-weight: 500; }
                    .value { color: #1a1a1a; font-weight: 600; }
                    .info-box { background: #e6f7ff; border: 1px solid #91d5ff; padding: 20px; border-radius: 12px; margin: 20px 0; }
                    .footer { padding: 30px; background: #f9f9f9; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Deposit Request Received!</h1>
                    </div>
                    <div class="content">
                        <div class="success-icon">💰</div>
                        
                        <h2 style="text-align: center;">Hello ${name}!</h2>
                        <p style="text-align: center; color: #666;">Your deposit request has been received and is being processed.</p>
                        
                        <div class="amount">LKR ${amount.toLocaleString()}</div>
                        
                        <div class="details">
                            <div class="row">
                                <span class="label">Deposit ID:</span>
                                <span class="value">#${id}</span>
                            </div>
                            <div class="row">
                                <span class="label">Date:</span>
                                <span class="value">${new Date(created_at).toLocaleString()}</span>
                            </div>
                            <div class="row">
                                <span class="label">Status:</span>
                                <span class="value" style="color: #eab308;">Pending</span>
                            </div>
                        </div>

                        <div class="info-box">
                            <strong>⏰ What happens next?</strong>
                            <ul style="margin-top: 10px; color: #0066cc;">
                                <li>Our admin will review your deposit receipt</li>
                                <li>You'll receive an email when it's approved</li>
                                <li>Funds will be added to your wallet automatically</li>
                            </ul>
                        </div>

                        <p style="color: #666; font-size: 14px; text-align: center;">
                            This usually takes 5-10 minutes during business hours.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Thank you for using our service!</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Deposit confirmation email sent to user:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending deposit confirmation:', error);
        throw error;
    }
}

// Deposit Approved Email
async sendDepositApprovedEmail(depositData, userData) {
    const { id, amount, approved_at } = depositData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `✅ Deposit Approved - LKR ${amount} Added to Wallet`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px; }
                    .amount { font-size: 48px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
                    .wallet-box { background: #f0fdf4; border: 2px solid #86efac; padding: 30px; border-radius: 20px; text-align: center; margin: 30px 0; }
                    .footer { padding: 30px; background: #f9f9f9; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Deposit Approved!</h1>
                    </div>
                    <div class="content">
                        <div class="wallet-box">
                            <div style="font-size: 24px; margin-bottom: 10px;">🎉</div>
                            <h2 style="color: #047857;">Hello ${name}!</h2>
                            <p>Your deposit has been approved and added to your wallet.</p>
                            <div class="amount">LKR ${amount.toLocaleString()}</div>
                            <p style="color: #059669;">You can now use these funds for your purchases.</p>
                        </div>
                        
                        <p style="text-align: center; color: #666;">
                            Thank you for using Make Me Trend!
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Deposit approved email sent to user:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending deposit approved email:', error);
        throw error;
    }
}

// Deposit Rejected Email
async sendDepositRejectedEmail(depositData, userData, reason) {
    const { id, amount } = depositData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `❌ Deposit Rejected - LKR ${amount}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; }
                    .content { padding: 40px; }
                    .reason-box { background: #fef2f2; border: 1px solid #fee2e2; padding: 30px; border-radius: 20px; margin: 30px 0; }
                    .footer { padding: 30px; background: #f9f9f9; text-align: center; color: #999; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Deposit Rejected</h1>
                    </div>
                    <div class="content">
                        <h2 style="text-align: center;">Hello ${name}</h2>
                        <p style="text-align: center; color: #666;">Your deposit of LKR ${amount.toLocaleString()} has been rejected.</p>
                        
                        <div class="reason-box">
                            <strong style="color: #991b1b;">Reason:</strong>
                            <p style="color: #b91c1c; margin-top: 10px;">${reason || 'Receipt verification failed'}</p>
                        </div>
                        
                        <p style="color: #666; text-align: center;">
                            Please submit a new deposit with a clear receipt.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Deposit rejected email sent to user:', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('❌ Error sending deposit rejected email:', error);
        throw error;
    }
}

async sendPasswordResetCode(to, name, code) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Password Reset Code - Make Me Trend',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
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
                        text-align: center;
                    }
                    .content h2 {
                        color: #1a1a1a;
                        font-size: 22px;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .content p {
                        color: #666666;
                        line-height: 1.6;
                        margin-bottom: 30px;
                        font-size: 16px;
                    }
                    .code {
                        font-size: 48px;
                        font-weight: bold;
                        color: #6366f1;
                        letter-spacing: 10px;
                        margin: 30px 0;
                        padding: 20px;
                        background: #f5f5f5;
                        border-radius: 12px;
                        display: inline-block;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border: 1px solid #ffeeba;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                        text-align: left;
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
                        <h1>🔐 Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${name}!</h2>
                        <p>We received a request to reset your password. Use the 6-digit code below to reset your password:</p>
                        
                        <div class="code">${code}</div>
                        
                        <p>This code will expire in <strong>10 minutes</strong>.</p>
                        
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
                        </div>
                        
                        <p>For your security, never share this code with anyone.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Made with ❤️ for trend management</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

async sendTicketNotification(ticketData, userData) {
    const { ticket_number, subject, department, priority, message } = ticketData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `🎫 New Support Ticket: ${ticket_number} - ${subject}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Support Ticket</title>
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
                    .ticket-info {
                        background-color: #f8f9fa;
                        border-left: 4px solid #6366f1;
                        padding: 20px;
                        margin-bottom: 30px;
                        border-radius: 8px;
                    }
                    .ticket-info p {
                        margin: 8px 0;
                        color: #1a1a1a;
                    }
                    .ticket-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #6366f1;
                        margin-bottom: 10px;
                    }
                    .priority-badge {
                        display: inline-block;
                        padding: 6px 12px;
                        border-radius: 50px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .priority-urgent { background: #dc2626; color: white; }
                    .priority-high { background: #f97316; color: white; }
                    .priority-medium { background: #eab308; color: black; }
                    .priority-low { background: #10b981; color: white; }
                    .message-box {
                        background-color: #ffffff;
                        border: 1px solid #eaeaea;
                        padding: 25px;
                        border-radius: 12px;
                        margin: 20px 0;
                        white-space: pre-wrap;
                        font-family: 'Courier New', monospace;
                    }
                    .user-details {
                        background-color: #f1f5f9;
                        padding: 20px;
                        border-radius: 12px;
                        margin: 20px 0;
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
                        <h1>🎫 New Support Ticket</h1>
                    </div>
                    <div class="content">
                        <div class="ticket-info">
                            <div class="ticket-number">${ticket_number}</div>
                            <p><strong>Subject:</strong> ${subject}</p>
                            <p><strong>Department:</strong> ${department}</p>
                            <p><strong>Priority:</strong> 
                                <span class="priority-badge priority-${priority}">${priority}</span>
                            </p>
                        </div>

                        <div class="user-details">
                            <h3 style="margin-top: 0; color: #1a1a1a;">User Details</h3>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>User ID:</strong> ${userData.id}</p>
                        </div>

                        <h3 style="color: #1a1a1a;">Message:</h3>
                        <div class="message-box">
                            ${message.replace(/\n/g, '<br>')}
                        </div>

                        <div style="text-align: center;">
                            <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/admin/tickets/${ticket_number}" class="button">
                                View Ticket in Admin Panel
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                            This ticket requires your attention. Please respond as soon as possible.
                        </p>
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
        console.log('Ticket notification email sent to admin:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending ticket notification:', error);
        throw error;
    }
}

// Also send confirmation to user
async sendTicketConfirmationToUser(ticketData, userData) {
    const { ticket_number, subject, department, priority, message } = ticketData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `✅ Ticket Created: ${ticket_number} - ${subject}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Ticket Created Successfully</title>
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
                        padding: 30px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .ticket-number {
                        font-size: 32px;
                        font-weight: bold;
                        color: #6366f1;
                        margin: 20px 0;
                        letter-spacing: 2px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin: 30px 0;
                    }
                    .info-item {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 12px;
                        text-align: center;
                    }
                    .info-item .label {
                        color: #666;
                        font-size: 12px;
                        text-transform: uppercase;
                        margin-bottom: 5px;
                    }
                    .info-item .value {
                        color: #1a1a1a;
                        font-size: 16px;
                        font-weight: 600;
                    }
                    .message-box {
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 12px;
                        margin: 20px 0;
                        border-left: 4px solid #6366f1;
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
                        <h1>✅ Ticket Created Successfully</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${name}!</h2>
                        <p>Your support ticket has been created successfully. Our team will get back to you shortly.</p>
                        
                        <div class="ticket-card">
                            <div class="ticket-number">${ticket_number}</div>
                            
                            <div class="info-grid">
                                <div class="info-item">
                                    <div class="label">Subject</div>
                                    <div class="value">${subject}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Department</div>
                                    <div class="value">${department}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Priority</div>
                                    <div class="value" style="text-transform: uppercase;">${priority}</div>
                                </div>
                                <div class="info-item">
                                    <div class="label">Status</div>
                                    <div class="value">Open</div>
                                </div>
                            </div>
                            
                            <div class="message-box">
                                <strong>Your Message:</strong><br><br>
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ul style="color: #666; line-height: 1.8;">
                            <li>Our support team will review your ticket</li>
                            <li>You'll receive an email when we respond</li>
                            <li>You can track your ticket status in your dashboard</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/dashboard/tickets/${ticket_number}" class="button">
                                View Your Ticket
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Need help? Contact our support team</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Ticket confirmation email sent to user:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending ticket confirmation:', error);
        throw error;
    }
}

// Add this method to your existing EmailService class in email.service.js

async sendChildPanelNotification(panelData, userData) {
    const { domain, panel_currency, admin_username, admin_password, price } = panelData;
    const { name, email, id } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.ADMIN_EMAIL, // Make sure to add ADMIN_EMAIL to your .env
        subject: '🆕 New Child Panel Order',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Child Panel Order</title>
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
                    .user-section {
                        background-color: #f8f9fa;
                        border-radius: 16px;
                        padding: 20px;
                        margin-bottom: 30px;
                        border: 1px solid #eaeaea;
                    }
                    .user-section h2 {
                        color: #1a1a1a;
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 15px;
                        font-weight: 600;
                    }
                    .panel-section {
                        background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
                        border-radius: 16px;
                        padding: 25px;
                        margin-bottom: 30px;
                        border: 1px solid #bae6fd;
                    }
                    .panel-section h2 {
                        color: #0369a1;
                        font-size: 18px;
                        margin-top: 0;
                        margin-bottom: 20px;
                        font-weight: 600;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 12px;
                        padding: 8px 0;
                        border-bottom: 1px dashed #eaeaea;
                    }
                    .info-label {
                        width: 140px;
                        color: #666;
                        font-weight: 500;
                    }
                    .info-value {
                        flex: 1;
                        color: #1a1a1a;
                        font-weight: 600;
                    }
                    .password-box {
                        background-color: #1a1a1a;
                        color: #00ff00;
                        padding: 12px 16px;
                        border-radius: 8px;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                        margin: 10px 0;
                        letter-spacing: 1px;
                    }
                    .price-tag {
                        display: inline-block;
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 50px;
                        font-size: 24px;
                        font-weight: bold;
                        margin: 20px 0;
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
                    .badge {
                        background: #10b981;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 50px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🆕 New Child Panel Order</h1>
                    </div>
                    <div class="content">
                        <div class="user-section">
                            <h2>👤 Customer Information</h2>
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

                        <div class="panel-section">
                            <h2>🎯 Panel Details</h2>
                            <div class="info-row">
                                <span class="info-label">Domain:</span>
                                <span class="info-value">${domain}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Currency:</span>
                                <span class="info-value">${panel_currency}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Admin Username:</span>
                                <span class="info-value">${admin_username}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Admin Password:</span>
                                <span class="info-value">
                                    <div class="password-box">${admin_password}</div>
                                </span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Price:</span>
                                <span class="info-value">
                                    <div class="price-tag">Rs ${price}</div>
                                </span>
                            </div>
                        </div>

                        <div style="text-align: center;">
                            <span class="badge">⏰ Renewal in 30 days</span>
                        </div>

                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/admin/child-panels" class="button">
                                View in Admin Panel
                            </a>
                        </div>

                        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                            This is a new child panel order. Please review and set up the panel for the customer.
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Child Panel System</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Child panel notification email sent to admin:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending child panel notification:', error);
        throw error;
    }
}

// Optional: Send confirmation to user as well
async sendChildPanelConfirmationToUser(panelData, userData) {
    const { domain, panel_currency, admin_username, admin_password, price } = panelData;
    const { name, email } = userData;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '✅ Your Child Panel Order Confirmation - Make Me Trend',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Child Panel Order Confirmation</title>
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
                    .success-icon {
                        text-align: center;
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    .panel-details {
                        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                        border: 1px solid #eaeaea;
                        border-radius: 16px;
                        padding: 25px;
                        margin: 20px 0;
                    }
                    .info-row {
                        display: flex;
                        margin-bottom: 12px;
                        padding: 8px 0;
                        border-bottom: 1px dashed #eaeaea;
                    }
                    .info-label {
                        width: 140px;
                        color: #666;
                        font-weight: 500;
                    }
                    .info-value {
                        flex: 1;
                        color: #1a1a1a;
                        font-weight: 600;
                    }
                    .password-box {
                        background-color: #f0f0f0;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-family: 'Courier New', monospace;
                        font-size: 14px;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border: 1px solid #ffeeba;
                        color: #856404;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    .nameservers {
                        background-color: #e6f7ff;
                        border: 1px solid #bae6fd;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .nameserver-item {
                        font-family: 'Courier New', monospace;
                        background: white;
                        padding: 8px 12px;
                        border-radius: 4px;
                        margin: 5px 0;
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
                        <h1>✅ Order Confirmed!</h1>
                    </div>
                    <div class="content">
                        <div class="success-icon">🎉</div>
                        
                        <h2 style="text-align: center; color: #1a1a1a;">Thank You, ${name}!</h2>
                        <p style="text-align: center; color: #666; margin-bottom: 30px;">
                            Your child panel order has been received and is being processed.
                        </p>

                        <div class="panel-details">
                            <h3 style="margin-top: 0; color: #0369a1;">Panel Details</h3>
                            
                            <div class="info-row">
                                <span class="info-label">Domain:</span>
                                <span class="info-value">${domain}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Currency:</span>
                                <span class="info-value">${panel_currency}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Username:</span>
                                <span class="info-value">${admin_username}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Password:</span>
                                <span class="info-value">
                                    <div class="password-box">${admin_password}</div>
                                </span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Amount Paid:</span>
                                <span class="info-value">Rs ${price}</span>
                            </div>
                        </div>

                        <div class="nameservers">
                            <strong>🌐 Nameservers (point your domain to these):</strong>
                            <div class="nameserver-item">${process.env.NS1 || 'ns1.example.com'}</div>
                            <div class="nameserver-item">${process.env.NS2 || 'ns2.example.com'}</div>
                            <p style="font-size: 12px; margin-top: 10px; color: #666;">
                                Make sure your domain is pointed to these nameservers for the panel to work.
                            </p>
                        </div>

                        <div class="warning">
                            <strong>⚠️ Important:</strong> Your panel will be active within 24-48 hours after domain verification. You'll receive another email when it's ready.
                        </div>

                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL}/dashboard/child-panels" class="button">
                                View Your Panels
                            </a>
                        </div>

                        <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                            Next renewal: 30 days from today
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Make Me Trend. All rights reserved.</p>
                        <p>Need help? Contact our support team</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Child panel confirmation email sent to user:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending child panel confirmation:', error);
        throw error;
    }
}

}

module.exports = new EmailService();
