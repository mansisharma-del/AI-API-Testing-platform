
import config from '../../core/config/index.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Create transporter
const createTransporter = () => {
  console.log('📧 Creating email transporter...');
  console.log('📧 SMTP_USER:', process.env.SMTP_USER);
  console.log('📧 SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');
  console.log('📧 EMAIL_ENABLED:', process.env.EMAIL_ENABLED);

  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('⚠️ Email notifications are disabled');
    return null;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Email credentials not configured');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    transporter.verify((error, success) => {
      if (error) {
        console.log('❌ Email verification failed:', error.message);
      } else {
        console.log('✅ Email transporter verified successfully');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Transporter error:', error.message);
    return null;
  }
};

// ✅ Check email configuration
export const checkEmailConfig = () => {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'Email not configured. Check SMTP settings.'
    };
  }
  return {
    configured: true,
    message: 'Email configured successfully'
  };
};

// ✅ Send email
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    if (!to) {
      return {
        success: false,
        error: 'Recipient email is required'
      };
    }

    const transporter = createTransporter();

    if (!transporter) {
      return {
        success: false,
        error: 'Email not configured. Please check SMTP settings.'
      };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@apitesting.com',
      to: to,
      subject: subject || 'Test Report from AI API Testing Platform',
      html: html || '<p>Test Report</p>',
      text: text || html?.replace(/<[^>]*>/g, '') || 'Test Report',
      attachments: attachments || []
    };

    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      info,
      messageId: info.messageId,
      sentTo: to
    };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
};

// ✅ Send test report email with token
// ✅ Send test report email with token
export const sendTestReportEmail = async ({
  to,
  projectName,
  report,
  downloadUrls,
  recipients,
  token
}) => {
  try {
    const emails = recipients || [to];
    const validEmails = emails.filter(email => email && email.includes('@'));

    if (validEmails.length === 0) {
      return {
        success: false,
        error: 'No valid email addresses provided'
      };
    }

    console.log('📧 Sending report to', validEmails.length, 'recipients');
    console.log('📧 Token for email links:', token ? '✅ Received' : '❌ Missing');

    const { summary } = report;
    const statusIcon = summary.successRate >= 80 ? '✅' :
      summary.successRate >= 60 ? '⚠️' : '❌';

    // ✅ HTML with token in URLs
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; color: #1e293b; }
          .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 8px 0 0; opacity: 0.9; }
          .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .summary-box { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center; }
          .summary-box .big-number { font-size: 36px; font-weight: bold; color: #4f46e5; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
          .stat { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
          .stat .number { font-size: 28px; font-weight: bold; }
          .stat .label { color: #64748b; font-size: 13px; margin-top: 4px; }
          .text-pass { color: #22c55e; }
          .text-fail { color: #ef4444; }
          .text-error { color: #f59e0b; }
          .text-rate { color: #3b82f6; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; text-decoration: none; border-radius: 8px; margin: 4px; }
          .btn-outline { background: transparent; border: 2px solid #4f46e5; color: #4f46e5; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
          .badge-passed { background: #dcfce7; color: #22c55e; }
          .badge-failed { background: #fee2e2; color: #ef4444; }
          .badge-error { background: #fef3c7; color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 ${projectName}</h1>
          <p>Test Execution Report</p>
        </div>
        
        <div class="content">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
            📅 ${new Date().toLocaleString()}
          </p>

          <div class="summary-box">
            <div style="font-size: 14px; color: #64748b;">Overall Status</div>
            <div class="big-number">${statusIcon} ${summary.successRate}</div>
            <div style="font-size: 13px; color: #64748b;">
              ${summary.passed} passed · ${summary.failed} failed · ${summary.errors} errors
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="number text-pass">${summary.passed}</div>
              <div class="label">✅ Passed</div>
            </div>
            <div class="stat">
              <div class="number text-fail">${summary.failed}</div>
              <div class="label">❌ Failed</div>
            </div>
            <div class="stat">
              <div class="number text-error">${summary.errors}</div>
              <div class="label">⚠️ Errors</div>
            </div>
            <div class="stat">
              <div class="number text-rate">${summary.successRate}</div>
              <div class="label">📈 Success Rate</div>
            </div>
          </div>

          <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; flex-wrap: wrap; gap: 8px;">
              <span><strong>⏱️ Duration:</strong> ${summary.duration || 'N/A'}</span>
              <span><strong>⚡ Avg Response:</strong> ${summary.avgResponseTime || 'N/A'}</span>
              <span><strong>🧪 Total Tests:</strong> ${summary.total}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            ${downloadUrls?.html ? `<a href="${downloadUrls.html}?token=${token}" class="btn">📊 View HTML Report</a>` : ''}
            ${downloadUrls?.pdf ? `<a href="${downloadUrls.pdf}?token=${token}" class="btn btn-outline">📄 Download PDF</a>` : ''}
          </div>

          <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
            <p>Generated by <strong>AI API Testing Platform</strong></p>
          </div>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} AI API Testing Platform</p>
        </div>
      </body>
      </html>
    `;

    const results = [];
    for (const email of validEmails) {
      const result = await sendEmail({
        to: email,
        subject: `📊 Test Report: ${projectName} - ${new Date().toLocaleDateString()}`,
        html: html,
        attachments: []
      });
      results.push({ email, ...result });
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: successful.length > 0,
      results,
      sentCount: successful.length,
      totalCount: results.length,
      failedCount: failed.length,
      failedEmails: failed.map(r => r.email)
    };
  } catch (error) {
    console.error('❌ Send report email error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send report email'
    };
  }
};

// ✅ Send welcome email
export const sendWelcomeEmail = async ({ to, name }) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; }
          .header h1 { color: #1e293b; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 24px; text-decoration: none; border-radius: 8px; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to AI API Testing Platform!</h1>
          </div>
          <p>Hi <strong>${name || 'User'}</strong>,</p>
          <p>We're excited to have you on board! 🎉</p>
          <p>With our platform, you can:</p>
          <ul>
            <li>🤖 Generate AI-powered test cases</li>
            <li>🧪 Run automated API tests</li>
            <li>📊 View detailed test reports</li>
            <li>🔗 Integrate with GitHub</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard" class="btn">
              Get Started
            </a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI API Testing Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: to,
      subject: '🚀 Welcome to AI API Testing Platform!',
      html: html
    });

    return result;
  } catch (error) {
    console.error('Send welcome error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email'
    };
  }
};