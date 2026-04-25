const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendWarrantyExpiryEmail = async (userEmail, userName, productName, expiryDate, daysLeft) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Warranty Tracker" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `⚠️ Warranty Expiring: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🛡️ Warranty Alert</h1>
          </div>
          <div style="background: #f7f8fc; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>This is a reminder that the warranty for your product is expiring soon:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
              <p><strong>Days Remaining:</strong> ${daysLeft} days</p>
            </div>
            <p style="margin-top: 20px;">Please take necessary action before the warranty expires.</p>
            <p style="color: #888; font-size: 12px;">— Digital Warranty Tracker</p>
          </div>
        </div>
      `,
    });

    console.log(`📧 Email sent to ${userEmail} for ${productName}`);
  } catch (error) {
    console.error('Email send error:', error.message);
  }
};

module.exports = { sendWarrantyExpiryEmail };
