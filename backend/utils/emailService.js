const nodemailer = require('nodemailer');

// ── Transporter (lazy-init, reusable) ────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = (process.env.EMAIL_HOST || '').trim();
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();

  if (!host || !user || !pass || user === 'your_email@gmail.com') {
    return null; // Email not configured — silently skip
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log(`📧 Email transporter ready (${user} via ${host}:${port})`);
  return _transporter;
}

// ── Core send function ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`📧 [SKIP] Email not configured — would have sent "${subject}" to ${to}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"WarrantyVault" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 [SENT] "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`📧 [FAIL] "${subject}" → ${to}:`, err.message);
    return false;
  }
}

// ── Helper: format date ──────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Shared email wrapper ─────────────────────────────────────────────────────
function wrapTemplate(accentColor, icon, title, body) {
  return `
  <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 28px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700;">
        ${icon} ${title}
      </h1>
    </div>
    <div style="padding: 28px 32px; color: #333;">
      ${body}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
      <p style="font-size: 12px; color: #999; margin: 0;">
        This is an automated email from <strong>WarrantyVault</strong>. Please do not reply.
      </p>
    </div>
  </div>`;
}

function detailCard(items) {
  const rows = items
    .map(([label, value]) => `
      <tr>
        <td style="padding: 8px 14px; font-size: 13px; color: #777; white-space: nowrap;">${label}</td>
        <td style="padding: 8px 14px; font-size: 14px; font-weight: 600; color: #222;">${value}</td>
      </tr>`)
    .join('');
  return `<table style="width: 100%; border-collapse: collapse; background: #f8f9fc; border-radius: 8px; overflow: hidden; margin: 16px 0;">${rows}</table>`;
}

// ══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════

// 1) Product Added
function productAddedEmail({ userName, productName, brand, category, purchaseDate, warrantyPeriod, warrantyExpiryDate }) {
  const subject = `✅ Product Added: ${productName}`;
  const html = wrapTemplate('#22c55e', '🛡️', 'Product Registered Successfully', `
    <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #555;">
      Your product has been successfully registered in WarrantyVault. Here are the details:
    </p>
    ${detailCard([
      ['Product', productName],
      ['Brand', brand || '—'],
      ['Category', category || '—'],
      ['Purchase Date', fmtDate(purchaseDate)],
      ['Warranty Period', `${warrantyPeriod} months`],
      ['Warranty Expires', fmtDate(warrantyExpiryDate)],
    ])}
    <p style="font-size: 14px; color: #555;">We'll notify you before your warranty expires so you never miss a deadline.</p>
  `);
  return { subject, html };
}

// 2) Warranty Expiring Soon (3 days)
function warrantyExpiringSoonEmail({ userName, productName, brand, warrantyExpiryDate, daysLeft }) {
  const subject = `⚠️ Warranty Expiring in ${daysLeft} Days: ${productName}`;
  const html = wrapTemplate('#f59e0b', '⏰', 'Warranty Expiring Soon', `
    <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #555;">
      Your warranty is expiring in <strong style="color: #f59e0b;">${daysLeft} days</strong>. Take action now to avoid losing coverage.
    </p>
    ${detailCard([
      ['Product', productName],
      ['Brand', brand || '—'],
      ['Expiry Date', fmtDate(warrantyExpiryDate)],
      ['Days Remaining', `${daysLeft} days`],
    ])}
    <p style="font-size: 14px; color: #555;">
      💡 <strong>Tip:</strong> You can extend your warranty directly from your WarrantyVault dashboard.
    </p>
  `);
  return { subject, html };
}

// 3) Warranty Expired
function warrantyExpiredEmail({ userName, productName, brand, warrantyExpiryDate }) {
  const subject = `🔴 Warranty Expired: ${productName}`;
  const html = wrapTemplate('#f43f5e', '❌', 'Warranty Has Expired', `
    <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #555;">
      The warranty for your product has <strong style="color: #f43f5e;">expired</strong>.
    </p>
    ${detailCard([
      ['Product', productName],
      ['Brand', brand || '—'],
      ['Expired On', fmtDate(warrantyExpiryDate)],
    ])}
    <p style="font-size: 14px; color: #555;">
      You may still be able to extend your warranty. Visit your WarrantyVault dashboard to check available options.
    </p>
  `);
  return { subject, html };
}

// 4) Warranty Extended
function warrantyExtendedEmail({ userName, productName, brand, extensionMonths, previousExpiryDate, newExpiryDate, amountPaid }) {
  const subject = `🎉 Warranty Extended: ${productName}`;
  const html = wrapTemplate('#4f6ef7', '🛡️', 'Warranty Extended Successfully', `
    <p style="font-size: 15px; line-height: 1.6;">Hi <strong>${userName}</strong>,</p>
    <p style="font-size: 14px; line-height: 1.6; color: #555;">
      Great news! Your warranty has been successfully extended.
    </p>
    ${detailCard([
      ['Product', productName],
      ['Brand', brand || '—'],
      ['Extension', `+${extensionMonths} months`],
      ['Previous Expiry', fmtDate(previousExpiryDate)],
      ['New Expiry', fmtDate(newExpiryDate)],
      ['Amount Paid', amountPaid > 0 ? `₹${Number(amountPaid).toLocaleString('en-IN')}` : 'Free (Admin)'],
    ])}
    <p style="font-size: 14px; color: #555;">Your product is now covered until <strong>${fmtDate(newExpiryDate)}</strong>.</p>
  `);
  return { subject, html };
}

module.exports = {
  sendEmail,
  getTransporter,
  productAddedEmail,
  warrantyExpiringSoonEmail,
  warrantyExpiredEmail,
  warrantyExtendedEmail,
};
