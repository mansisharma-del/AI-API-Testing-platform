import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ======================================================
// SMTP CONFIGURATION
// ======================================================

const getSMTPConfig = () => {
  const enabled = String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true';

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);

  const secure =
    String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'noreply@apitesting.com';

  return {
    enabled,
    host,
    port,
    secure,
    user,
    pass,
    from
  };
};

// ======================================================
// CREATE SMTP TRANSPORTER
// ======================================================

const createTransporter = () => {
  const smtp = getSMTPConfig();

  console.log('========================================');
  console.log('📧 SMTP CONFIGURATION');
  console.log('========================================');
  console.log('📧 EMAIL_ENABLED:', smtp.enabled);
  console.log('📧 SMTP_HOST:', smtp.host);
  console.log('📧 SMTP_PORT:', smtp.port);
  console.log('📧 SMTP_SECURE:', smtp.secure);
  console.log('📧 SMTP_USER:', smtp.user || '❌ Missing');
  console.log('📧 SMTP_PASS:', smtp.pass ? '✅ Set' : '❌ Missing');
  console.log('📧 SMTP_FROM:', smtp.from);
  console.log('========================================');

  if (!smtp.enabled) {
    console.log('⚠️ Email notifications are disabled');
    return null;
  }

  if (!smtp.user || !smtp.pass) {
    console.error('❌ SMTP credentials are missing');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,

      auth: {
        user: smtp.user,
        pass: smtp.pass
      },

      // Helpful for hosted environments such as Render
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,

      tls: {
        rejectUnauthorized: false
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create SMTP transporter:', error.message);
    return null;
  }
};

// ======================================================
// VERIFY SMTP CONNECTION
// ======================================================

export const verifyEmailTransporter = async () => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      return {
        success: false,
        configured: false,
        error: 'Email is not configured. Check EMAIL_ENABLED and SMTP credentials.'
      };
    }

    await transporter.verify();

    console.log('========================================');
    console.log('✅ SMTP transporter verified successfully');
    console.log('========================================');

    return {
      success: true,
      configured: true,
      message: 'SMTP connection verified successfully'
    };
  } catch (error) {
    console.error('========================================');
    console.error('❌ SMTP VERIFICATION FAILED');
    console.error('❌ Error:', error.message);
    console.error('❌ Code:', error.code || 'N/A');
    console.error('❌ Command:', error.command || 'N/A');
    console.error('========================================');

    return {
      success: false,
      configured: true,
      error: error.message,
      code: error.code || null,
      command: error.command || null
    };
  }
};

// ======================================================
// CHECK EMAIL CONFIGURATION
// ======================================================

export const checkEmailConfig = () => {
  const smtp = getSMTPConfig();

  if (!smtp.enabled) {
    return {
      configured: false,
      enabled: false,
      message: 'Email notifications are disabled'
    };
  }

  if (!smtp.user || !smtp.pass) {
    return {
      configured: false,
      enabled: true,
      message: 'SMTP credentials are missing'
    };
  }

  return {
    configured: true,
    enabled: true,
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    from: smtp.from,
    message: 'SMTP configuration is present'
  };
};

// ======================================================
// SEND EMAIL
// ======================================================

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments = []
}) => {
  try {
    // --------------------------------------------------
    // Validate recipient
    // --------------------------------------------------

    if (!to) {
      return {
        success: false,
        error: 'Recipient email is required'
      };
    }

    // --------------------------------------------------
    // Create transporter
    // --------------------------------------------------

    const transporter = createTransporter();

    if (!transporter) {
      return {
        success: false,
        error:
          'Email is not configured. Check EMAIL_ENABLED, SMTP_USER and SMTP_PASS.'
      };
    }

    const smtp = getSMTPConfig();

    // --------------------------------------------------
    // Mail options
    // --------------------------------------------------

    const mailOptions = {
      from: smtp.from,
      to,
      subject:
        subject || 'Test Report from AI API Testing Platform',

      html:
        html ||
        '<p>Test Report from AI API Testing Platform</p>',

      text:
        text ||
        (html
          ? html.replace(/<[^>]*>/g, '')
          : 'Test Report from AI API Testing Platform'),

      attachments: Array.isArray(attachments)
        ? attachments
        : []
    };

    console.log('========================================');
    console.log('📧 SENDING EMAIL');
    console.log('========================================');
    console.log('📧 To:', to);
    console.log('📧 From:', smtp.from);
    console.log('📧 Subject:', mailOptions.subject);
    console.log('📧 Attachments:', mailOptions.attachments.length);
    console.log('========================================');

    // --------------------------------------------------
    // Send email
    // --------------------------------------------------

    const info = await transporter.sendMail(mailOptions);

    console.log('========================================');
    console.log('✅ EMAIL SENT SUCCESSFULLY');
    console.log('========================================');
    console.log('📧 To:', to);
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response || 'N/A');
    console.log('========================================');

    return {
      success: true,
      messageId: info.messageId,
      sentTo: to,
      response: info.response || null
    };
  } catch (error) {
    console.error('========================================');
    console.error('❌ EMAIL SEND FAILED');
    console.error('========================================');
    console.error('❌ Message:', error.message);
    console.error('❌ Code:', error.code || 'N/A');
    console.error('❌ Command:', error.command || 'N/A');
    console.error('❌ Response:', error.response || 'N/A');
    console.error('========================================');

    return {
      success: false,
      error: error.message || 'Failed to send email',
      code: error.code || null,
      command: error.command || null,
      response: error.response || null
    };
  }
};

// ======================================================
// SEND TEST REPORT EMAIL
// ======================================================

export const sendTestReportEmail = async ({
  to,
  projectName,
  report,
  downloadUrls,
  recipients,
  token
}) => {
  try {
    const emails = Array.isArray(recipients)
      ? recipients
      : [to];

    const validEmails = emails
      .filter(Boolean)
      .map(email => String(email).trim())
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (validEmails.length === 0) {
      return {
        success: false,
        error: 'No valid email addresses provided'
      };
    }

    if (!report) {
      return {
        success: false,
        error: 'Report data is required'
      };
    }

    console.log('========================================');
    console.log('📊 REPORT EMAIL');
    console.log('========================================');
    console.log('📊 Project:', projectName);
    console.log('📧 Recipients:', validEmails.length);
    console.log('🔗 HTML URL:', downloadUrls?.html || 'Not provided');
    console.log('🔗 PDF URL:', downloadUrls?.pdf || 'Not provided');
    console.log('🔐 Token:', token ? '✅ Received' : '❌ Missing');
    console.log('========================================');

    const summary = report.summary || {
      total: 0,
      passed: 0,
      failed: 0,
      errors: 0,
      successRate: '0%',
      duration: '0ms',
      avgResponseTime: '0ms'
    };

    const successRateNumber =
      parseFloat(String(summary.successRate).replace('%', '')) || 0;

    const statusIcon =
      successRateNumber >= 80
        ? '✅'
        : successRateNumber >= 60
          ? '⚠️'
          : '❌';

    // --------------------------------------------------
    // Secure report links
    // --------------------------------------------------

    const htmlUrl = downloadUrls?.html
      ? `${downloadUrls.html}${downloadUrls.html.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`
      : null;

    const pdfUrl = downloadUrls?.pdf
      ? `${downloadUrls.pdf}${downloadUrls.pdf.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`
      : null;

    // --------------------------------------------------
    // Email HTML
    // --------------------------------------------------

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Test Report - ${projectName}</title>

  <style>
    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;

      max-width: 600px;
      margin: 0 auto;
      padding: 20px;

      background: #f8fafc;
      color: #1e293b;
    }

    .header {
      background: linear-gradient(
        135deg,
        #4f46e5,
        #7c3aed
      );

      color: white;
      padding: 30px;
      text-align: center;

      border-radius: 12px 12px 0 0;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
    }

    .header p {
      margin: 8px 0 0;
      opacity: 0.9;
    }

    .content {
      background: white;
      padding: 30px;

      border-radius: 0 0 12px 12px;

      box-shadow:
        0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .summary-box {
      background: #f1f5f9;
      padding: 20px;

      border-radius: 8px;
      margin: 16px 0;

      text-align: center;
    }

    .big-number {
      font-size: 36px;
      font-weight: bold;
      color: #4f46e5;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      margin: 20px 0;
    }

    .stat {
      background: #f8fafc;
      padding: 15px;

      border-radius: 8px;
      text-align: center;

      border: 1px solid #e2e8f0;
    }

    .number {
      font-size: 28px;
      font-weight: bold;
    }

    .label {
      color: #64748b;
      font-size: 13px;
      margin-top: 4px;
    }

    .text-pass {
      color: #22c55e;
    }

    .text-fail {
      color: #ef4444;
    }

    .text-error {
      color: #f59e0b;
    }

    .text-rate {
      color: #3b82f6;
    }

    .buttons {
      text-align: center;
      margin: 24px 0;
    }

    .btn {
      display: inline-block;

      background: #4f46e5;
      color: white;

      padding: 10px 24px;

      text-decoration: none;
      border-radius: 8px;

      margin: 4px;
    }

    .btn-outline {
      background: white;
      border: 2px solid #4f46e5;
      color: #4f46e5;
    }

    .footer {
      text-align: center;
      color: #94a3b8;

      font-size: 12px;

      margin-top: 20px;
      padding-top: 20px;

      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>

<body>

  <div class="header">
    <h1>🚀 ${projectName}</h1>
    <p>Test Execution Report</p>
  </div>

  <div class="content">

    <p style="font-size: 14px; color: #64748b;">
      📅 ${new Date().toLocaleString()}
    </p>

    <div class="summary-box">

      <div
        style="
          font-size: 14px;
          color: #64748b;
        "
      >
        Overall Status
      </div>

      <div class="big-number">
        ${statusIcon} ${summary.successRate || '0%'}
      </div>

      <div
        style="
          font-size: 13px;
          color: #64748b;
        "
      >
        ${summary.passed || 0} passed ·
        ${summary.failed || 0} failed ·
        ${summary.errors || 0} errors
      </div>

    </div>

    <div class="stats">

      <div class="stat">
        <div class="number text-pass">
          ${summary.passed || 0}
        </div>

        <div class="label">
          ✅ Passed
        </div>
      </div>

      <div class="stat">
        <div class="number text-fail">
          ${summary.failed || 0}
        </div>

        <div class="label">
          ❌ Failed
        </div>
      </div>

      <div class="stat">
        <div class="number text-error">
          ${summary.errors || 0}
        </div>

        <div class="label">
          ⚠️ Errors
        </div>
      </div>

      <div class="stat">
        <div class="number text-rate">
          ${summary.successRate || '0%'}
        </div>

        <div class="label">
          📈 Success Rate
        </div>
      </div>

    </div>

    <div
      style="
        margin: 16px 0;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        font-size: 13px;
      "
    >
      <strong>⏱️ Duration:</strong>
      ${summary.duration || 'N/A'}
      <br><br>

      <strong>⚡ Avg Response:</strong>
      ${summary.avgResponseTime || 'N/A'}
      <br><br>

      <strong>🧪 Total Tests:</strong>
      ${summary.total || 0}
    </div>

    ${
      htmlUrl || pdfUrl
        ? `
          <div class="buttons">

            ${
              htmlUrl
                ? `
                  <a
                    href="${htmlUrl}"
                    class="btn"
                  >
                    📊 View HTML Report
                  </a>
                `
                : ''
            }

            ${
              pdfUrl
                ? `
                  <a
                    href="${pdfUrl}"
                    class="btn btn-outline"
                  >
                    📄 Download PDF
                  </a>
                `
                : ''
            }

          </div>
        `
        : ''
    }

    <div
      style="
        font-size: 12px;
        color: #94a3b8;
        text-align: center;
        margin-top: 16px;
      "
    >
      Generated by
      <strong>AI API Testing Platform</strong>
    </div>

  </div>

  <div class="footer">
    <p>
      © ${new Date().getFullYear()}
      AI API Testing Platform
    </p>
  </div>

</body>
</html>
`;

    // --------------------------------------------------
    // Send to every recipient
    // --------------------------------------------------

    const results = [];

    for (const email of validEmails) {
      const result = await sendEmail({
        to: email,

        subject:
          `📊 Test Report: ${projectName} - ${new Date().toLocaleDateString()}`,

        html
      });

      results.push({
        email,
        ...result
      });
    }

    const successful = results.filter(
      result => result.success
    );

    const failed = results.filter(
      result => !result.success
    );

    console.log('========================================');
    console.log('📊 REPORT EMAIL RESULT');
    console.log('========================================');
    console.log('📧 Total:', results.length);
    console.log('✅ Successful:', successful.length);
    console.log('❌ Failed:', failed.length);
    console.log('========================================');

    return {
      success: successful.length > 0,

      results,

      sentCount: successful.length,

      totalCount: results.length,

      failedCount: failed.length,

      failedEmails: failed.map(
        result => result.email
      )
    };

  } catch (error) {
    console.error(
      '❌ Send report email error:',
      error.message
    );

    return {
      success: false,
      error:
        error.message ||
        'Failed to send report email'
    };
  }
};

// ======================================================
// SEND WELCOME EMAIL
// ======================================================

export const sendWelcomeEmail = async ({
  to,
  name
}) => {
  try {
    if (!to) {
      return {
        success: false,
        error: 'Recipient email is required'
      };
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    const html = `
<!DOCTYPE html>

<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <style>
    body {
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;

      max-width: 500px;
      margin: 0 auto;
      padding: 20px;

      background: #f8fafc;
    }

    .container {
      background: white;
      padding: 30px;

      border-radius: 12px;

      box-shadow:
        0 2px 10px rgba(0,0,0,0.1);
    }

    .header {
      text-align: center;
    }

    .header h1 {
      color: #1e293b;
    }

    .btn {
      display: inline-block;

      background: #4f46e5;
      color: white;

      padding: 10px 24px;

      text-decoration: none;
      border-radius: 8px;
    }

    .footer {
      text-align: center;
      color: #94a3b8;

      font-size: 12px;

      margin-top: 20px;
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">
      <h1>
        🚀 Welcome to AI API Testing Platform!
      </h1>
    </div>

    <p>
      Hi <strong>${name || 'User'}</strong>,
    </p>

    <p>
      We're excited to have you on board! 🎉
    </p>

    <p>
      With our platform, you can:
    </p>

    <ul>
      <li>🤖 Generate AI-powered test cases</li>
      <li>🧪 Run automated API tests</li>
      <li>📊 View detailed test reports</li>
      <li>🔗 Integrate with GitHub</li>
    </ul>

    <div
      style="
        text-align: center;
        margin: 24px 0;
      "
    >
      <a
        href="${frontendUrl}/dashboard"
        class="btn"
      >
        Get Started
      </a>
    </div>

    <div class="footer">
      <p>
        © ${new Date().getFullYear()}
        AI API Testing Platform
      </p>
    </div>

  </div>

</body>

</html>
`;

    return await sendEmail({
      to,

      subject:
        '🚀 Welcome to AI API Testing Platform!',

      html
    });

  } catch (error) {
    console.error(
      '❌ Send welcome email error:',
      error.message
    );

    return {
      success: false,
      error:
        error.message ||
        'Failed to send welcome email'
    };
  }
};
