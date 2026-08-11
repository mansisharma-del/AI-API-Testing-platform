import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


// ======================================================
// CREATE SMTP TRANSPORTER
// ======================================================

const createTransporter = () => {

  console.log('========================================');
  console.log('📧 CREATING EMAIL TRANSPORTER');
  console.log('========================================');


  const emailEnabled =
    process.env.EMAIL_ENABLED === 'true';

  const smtpHost =
    process.env.SMTP_HOST ||
    'smtp.gmail.com';

  const smtpPort =
    parseInt(
      process.env.SMTP_PORT || '587',
      10
    );

  const smtpSecure =
    process.env.SMTP_SECURE === 'true';

  const smtpUser =
    process.env.SMTP_USER;

  const smtpPass =
    process.env.SMTP_PASS;


  console.log('📧 EMAIL_ENABLED:', emailEnabled);
  console.log('📧 SMTP_HOST:', smtpHost);
  console.log('📧 SMTP_PORT:', smtpPort);
  console.log('📧 SMTP_SECURE:', smtpSecure);
  console.log('📧 SMTP_USER:', smtpUser || '❌ Missing');

  console.log(
    '📧 SMTP_PASS:',
    smtpPass ? '✅ Set' : '❌ Missing'
  );


  // ======================================================
  // EMAIL DISABLED
  // ======================================================

  if (!emailEnabled) {

    console.log(
      '⚠️ EMAIL_ENABLED is not true'
    );

    return null;
  }


  // ======================================================
  // SMTP CREDENTIAL CHECK
  // ======================================================

  if (!smtpUser || !smtpPass) {

    console.log(
      '❌ SMTP_USER or SMTP_PASS is missing'
    );

    return null;
  }


  // ======================================================
  // CREATE TRANSPORTER
  // ======================================================

  try {

    const transporter =
      nodemailer.createTransport({

        host: smtpHost,

        port: smtpPort,

        secure: smtpSecure,

        auth: {
          user: smtpUser,
          pass: smtpPass
        },

        tls: {
          rejectUnauthorized: false
        },

        connectionTimeout: 15000,

        greetingTimeout: 15000,

        socketTimeout: 20000
      });


    console.log(
      '✅ SMTP transporter created'
    );


    return transporter;

  } catch (error) {

    console.error(
      '❌ Failed to create SMTP transporter:',
      error
    );

    return null;
  }
};


// ======================================================
// CHECK EMAIL CONFIGURATION
// ======================================================

export const checkEmailConfig = () => {

  const transporter =
    createTransporter();


  if (!transporter) {

    return {
      configured: false,

      message:
        'Email not configured. Check EMAIL_ENABLED, SMTP_USER and SMTP_PASS.'
    };
  }


  return {
    configured: true,

    message:
      'Email configuration loaded successfully'
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
  attachments
}) => {

  try {

    // ====================================================
    // RECIPIENT CHECK
    // ====================================================

    if (!to) {

      return {
        success: false,
        error: 'Recipient email is required'
      };
    }


    console.log('========================================');
    console.log('📧 STARTING EMAIL SEND');
    console.log('========================================');

    console.log('📧 To:', to);

    console.log(
      '📧 Subject:',
      subject || 'Test Report'
    );


    // ====================================================
    // CREATE TRANSPORTER
    // ====================================================

    const transporter =
      createTransporter();


    if (!transporter) {

      return {
        success: false,

        error:
          'Email transporter could not be created. Check SMTP configuration.'
      };
    }


    // ====================================================
    // VERIFY SMTP CONNECTION
    // ====================================================

    console.log(
      '📧 Verifying SMTP connection...'
    );


    try {

      await transporter.verify();

      console.log(
        '✅ SMTP connection verified successfully'
      );

    } catch (verifyError) {

      console.error(
        '========================================'
      );

      console.error(
        '❌ SMTP VERIFICATION FAILED'
      );

      console.error(
        '========================================'
      );

      console.error(
        'Message:',
        verifyError?.message
      );

      console.error(
        'Code:',
        verifyError?.code
      );

      console.error(
        'Response:',
        verifyError?.response
      );

      console.error(
        'Response Code:',
        verifyError?.responseCode
      );

      console.error(
        'Command:',
        verifyError?.command
      );


      return {
        success: false,

        error:
          verifyError?.message ||
          'SMTP verification failed',

        code:
          verifyError?.code ||
          null,

        response:
          verifyError?.response ||
          null,

        responseCode:
          verifyError?.responseCode ||
          null,

        command:
          verifyError?.command ||
          null
      };
    }


    // ====================================================
    // MAIL OPTIONS
    // ====================================================

    const fromEmail =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER;


    const mailOptions = {

      from: fromEmail,

      to: to,

      subject:
        subject ||
        'Test Report from AI API Testing Platform',

      html:
        html ||
        '<p>Test Report</p>',

      text:
        text ||
        (
          html
            ? html.replace(/<[^>]*>/g, '')
            : 'Test Report'
        ),

      attachments:
        attachments || []
    };


    console.log('📧 From:', fromEmail);

    console.log(
      '📧 Sending email through SMTP...'
    );


    // ====================================================
    // SEND EMAIL
    // ====================================================

    const info =
      await transporter.sendMail(
        mailOptions
      );


    // ====================================================
    // SUCCESS
    // ====================================================

    console.log('========================================');

    console.log(
      '✅ EMAIL SENT SUCCESSFULLY'
    );

    console.log(
      '📧 Message ID:',
      info.messageId
    );

    console.log(
      '📧 Accepted:',
      info.accepted
    );

    console.log(
      '📧 Rejected:',
      info.rejected
    );

    console.log('========================================');


    return {

      success: true,

      info,

      messageId:
        info.messageId,

      sentTo:
        to
    };


  } catch (error) {

    // ====================================================
    // SEND ERROR
    // ====================================================

    console.error('========================================');

    console.error(
      '❌ EMAIL SEND ERROR'
    );

    console.error('========================================');

    console.error(
      'Name:',
      error?.name
    );

    console.error(
      'Message:',
      error?.message
    );

    console.error(
      'Code:',
      error?.code
    );

    console.error(
      'Response:',
      error?.response
    );

    console.error(
      'Response Code:',
      error?.responseCode
    );

    console.error(
      'Command:',
      error?.command
    );

    console.error(
      'Stack:',
      error?.stack
    );

    console.error('========================================');


    return {

      success: false,

      error:
        error?.message ||
        'Failed to send email',

      code:
        error?.code ||
        null,

      response:
        error?.response ||
        null,

      responseCode:
        error?.responseCode ||
        null,

      command:
        error?.command ||
        null
    };
  }
};


// ======================================================
// SEND TEST REPORT EMAIL
// ======================================================

export const sendTestReportEmail = async ({
  projectName,
  report,
  downloadUrls,
  recipients,
  token
}) => {

  try {

    // ====================================================
    // VALIDATE RECIPIENTS
    // ====================================================

    const emails =
      Array.isArray(recipients)
        ? recipients
        : [];


    const validEmails =
      emails
        .filter(
          (email) =>
            typeof email === 'string' &&
            email.includes('@')
        )
        .map(
          (email) =>
            email.trim()
        );


    if (validEmails.length === 0) {

      return {
        success: false,
        error:
          'No valid email addresses provided'
      };
    }


    console.log('========================================');

    console.log(
      '📊 SEND TEST REPORT EMAIL'
    );

    console.log(
      '📧 Recipients:',
      validEmails
    );

    console.log(
      '🔐 Token:',
      token ? '✅ Received' : '⚠️ Missing'
    );

    console.log('========================================');


    // ====================================================
    // REPORT DATA
    // ====================================================

    const summary =
      report?.summary || {};


    const successRate =
      Number(summary.successRate || 0);


    const statusIcon =
      successRate >= 80
        ? '✅'
        : successRate >= 60
          ? '⚠️'
          : '❌';


    // ====================================================
    // DOWNLOAD URLS
    // ====================================================

    const htmlUrl =
      downloadUrls?.html
        ? (
            token
              ? `${downloadUrls.html}?token=${encodeURIComponent(token)}`
              : downloadUrls.html
          )
        : '';


    const pdfUrl =
      downloadUrls?.pdf
        ? (
            token
              ? `${downloadUrls.pdf}?token=${encodeURIComponent(token)}`
              : downloadUrls.pdf
          )
        : '';


    // ====================================================
    // EMAIL HTML
    // ====================================================

    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  Test Report - ${projectName}
</title>

<style>

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

  max-width: 600px;

  margin: 0 auto;

  padding: 20px;

  background: #f8fafc;

  color: #1e293b;
}

.header {
  background:
    linear-gradient(
      135deg,
      #4f46e5,
      #7c3aed
    );

  color: white;

  padding: 30px;

  text-align: center;

  border-radius:
    12px 12px 0 0;
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

  border-radius:
    0 0 12px 12px;

  box-shadow:
    0 4px 6px rgba(0,0,0,0.05);
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

  margin: 8px 0;
}

.stats {
  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 12px;

  margin: 20px 0;
}

.stat {
  background: #f8fafc;

  padding: 15px;

  border-radius: 8px;

  text-align: center;

  border:
    1px solid #e2e8f0;
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

.btn {
  display: inline-block;

  background: #4f46e5;

  color: white !important;

  padding: 12px 24px;

  text-decoration: none;

  border-radius: 8px;

  margin: 5px;

  font-weight: 600;
}

.btn-outline {
  background: white;

  color: #4f46e5 !important;

  border:
    2px solid #4f46e5;
}

.footer {
  text-align: center;

  color: #94a3b8;

  font-size: 12px;

  margin-top: 20px;

  padding-top: 20px;

  border-top:
    1px solid #e2e8f0;
}

</style>

</head>


<body>


<div class="header">

  <h1>
    🚀 ${projectName}
  </h1>

  <p>
    Test Execution Report
  </p>

</div>


<div class="content">


  <p
    style="
      font-size:14px;
      color:#64748b;
      margin-bottom:16px;
    "
  >
    📅 ${new Date().toLocaleString()}
  </p>


  <div class="summary-box">

    <div
      style="
        font-size:14px;
        color:#64748b;
      "
    >
      Overall Status
    </div>


    <div class="big-number">

      ${statusIcon}
      ${successRate}%

    </div>


    <div
      style="
        font-size:13px;
        color:#64748b;
      "
    >

      ${summary.passed || 0}
      passed ·

      ${summary.failed || 0}
      failed ·

      ${summary.errors || 0}
      errors

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

        ${successRate}%

      </div>

      <div class="label">

        📈 Success Rate

      </div>

    </div>


  </div>


  <div
    style="
      margin:16px 0;
      padding:12px;
      background:#f8fafc;
      border-radius:8px;
    "
  >

    <div
      style="
        font-size:13px;
        color:#475569;
        line-height:1.8;
      "
    >

      <div>
        <strong>⏱️ Duration:</strong>
        ${summary.duration || 'N/A'}
      </div>

      <div>
        <strong>⚡ Avg Response:</strong>
        ${summary.avgResponseTime || 'N/A'}
      </div>

      <div>
        <strong>🧪 Total Tests:</strong>
        ${summary.total || 0}
      </div>

    </div>

  </div>


  <div
    style="
      text-align:center;
      margin:24px 0;
    "
  >


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


  <div
    style="
      font-size:12px;
      color:#94a3b8;
      text-align:center;
      margin-top:16px;
    "
  >

    <p>
      Generated by
      <strong>
        AI API Testing Platform
      </strong>
    </p>

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


    // ====================================================
    // SEND TO EACH RECIPIENT
    // ====================================================

    const results = [];


    for (const email of validEmails) {

      console.log(
        '📧 Sending report to:',
        email
      );


      const result =
        await sendEmail({

          to: email,

          subject:
            `📊 Test Report: ${projectName} - ${new Date().toLocaleDateString()}`,

          html,

          text:
            `Test Report for ${projectName}\n\n` +
            `Passed: ${summary.passed || 0}\n` +
            `Failed: ${summary.failed || 0}\n` +
            `Errors: ${summary.errors || 0}\n` +
            `Success Rate: ${successRate}%`,

          attachments: []
        });


      results.push({
        email,
        ...result
      });
    }


    // ====================================================
    // RESULTS
    // ====================================================

    const successful =
      results.filter(
        (result) => result.success
      );


    const failed =
      results.filter(
        (result) => !result.success
      );


    console.log(
      '📧 Successful:',
      successful.length
    );

    console.log(
      '📧 Failed:',
      failed.length
    );


    return {

      success:
        successful.length > 0,

      results,

      sentCount:
        successful.length,

      totalCount:
        results.length,

      failedCount:
        failed.length,

      failedEmails:
        failed.map(
          (result) =>
            result.email
        )
    };


  } catch (error) {

    console.error(
      '❌ Send report email error:',
      error
    );


    return {

      success: false,

      error:
        error?.message ||
        'Failed to send report email',

      code:
        error?.code ||
        null,

      responseCode:
        error?.responseCode ||
        null
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
      'http://localhost:5174';


    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<style>

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
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

  color: white !important;

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

    <li>
      🤖 Generate AI-powered test cases
    </li>

    <li>
      🧪 Run automated API tests
    </li>

    <li>
      📊 View detailed test reports
    </li>

    <li>
      🔗 Integrate with GitHub
    </li>

  </ul>


  <div
    style="
      text-align:center;
      margin:24px 0;
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


    const result =
      await sendEmail({

        to,

        subject:
          '🚀 Welcome to AI API Testing Platform!',

        html
      });


    return result;


  } catch (error) {

    console.error(
      '❌ Send welcome email error:',
      error
    );


    return {

      success: false,

      error:
        error?.message ||
        'Failed to send welcome email',

      code:
        error?.code ||
        null,

      responseCode:
        error?.responseCode ||
        null
    };
  }
};
