const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const Mailjet = require("node-mailjet");

const LOGO_CID = "brand-logo@rhbarbershop";
const LOGO_PATH = path.join(__dirname, "../image/brand-logo.png");

const createGmailTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass: pass.replace(/\s+/g, ""),
    },
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getLogoAttachment = () => {
  if (!fs.existsSync(LOGO_PATH)) {
    return null;
  }

  return {
    filename: "brand-logo.png",
    path: LOGO_PATH,
    cid: LOGO_CID,
    contentDisposition: "inline",
  };
};

const buildEmailShell = ({ title, preheader, bodyHtml }) => {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader || "");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#065f46;padding:20px 28px;text-align:center;">
              <img src="cid:${LOGO_CID}" alt="RH Barbershop" width="140" style="display:inline-block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 0;text-align:center;">
              <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:#065f46;">${safeTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
              Hormat kami,<br />
              <strong style="color:#065f46;">RH Barbershop</strong><br />
              <span style="color:#d1d5db;">Email otomatis — mohon tidak membalas pesan ini.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendMail = async (options) => {
  const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
  );

  const request = mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: process.env.MJ_SENDER_EMAIL,
          Name: "Admin",
        },
        To: [
          {
            Email: options.email,
            Name: "Users",
          },
        ],
        Subject: options.subject,
        TextPart: options.messsage,
        HTMLPart:
          '<h3>Dear Users, welcome to our website</h3><br />Please click on the link below to activate your account:<br /><a href="' +
          options.url +
          '">Activate</a>',
      },
    ],
  });

  try {
    const result = await request;
    console.log(result.body);
    return result.body;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendMailForgotPW = async (options) => {
  const transporter = createGmailTransporter();
  const resetUrl = options.resetUrl || "";
  const safeResetUrl = escapeHtml(resetUrl);

  const textBody =
    options.messsage ||
    `Halo,\n\n` +
      `Kami menerima permintaan reset password untuk akun RH Barbershop Anda.\n` +
      `Silakan buka link berikut untuk membuat kata sandi baru (berlaku 15 menit):\n` +
      `${resetUrl}\n\n` +
      `Jika Anda tidak meminta reset password, abaikan email ini.\n\n` +
      `Hormat kami,\nRH Barbershop`;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#374151;">
      Halo,
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
      Kami menerima permintaan untuk mengatur ulang kata sandi akun admin Anda.
      Klik tombol di bawah untuk melanjutkan. Link ini berlaku selama <strong>15 menit</strong>.
    </p>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#065f46;font-weight:600;">
        Demi keamanan, jangan bagikan link ini kepada siapa pun.
      </p>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 22px;">
      <tr>
        <td align="center" bgcolor="#065f46" style="border-radius:8px;">
          <a href="${safeResetUrl}"
             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6b7280;">
      Jika tombol tidak berfungsi, salin dan tempel URL berikut di browser:
    </p>
    <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;color:#059669;">
      ${safeResetUrl}
    </p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
      Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini. Kata sandi Anda tidak akan berubah.
    </p>
  `;

  const htmlBody = buildEmailShell({
    title: "Reset Password",
    preheader: "Link reset password RH Barbershop berlaku 15 menit.",
    bodyHtml,
  });

  if (!transporter) {
    console.log("\n=======================================================");
    console.log("SMTP_USER / SMTP_PASS belum diisi di .env");
    console.log(`LINK RESET PASSWORD (${options.email}):`);
    console.log(resetUrl);
    console.log("=======================================================\n");
    return { status: "local_dev_mock", message: "Link reset diprint ke terminal konsol lokal" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const logoAttachment = getLogoAttachment();

  try {
    const result = await transporter.sendMail({
      from: `"RH Barbershop" <${from}>`,
      to: options.email,
      subject: options.subject || "Reset Password — RH Barbershop",
      text: textBody,
      html: htmlBody,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    return result;
  } catch (error) {
    console.error("Error sending email via Gmail SMTP:", error);
    throw error;
  }
};

const sendAttendanceReminder = async (options) => {
  const transporter = createGmailTransporter();
  const {
    email,
    name,
    dateLabel,
    hourLabel,
    capsterName,
    serviceName,
  } = options;

  const safeName = escapeHtml(name || "Pelanggan");
  const safeDate = escapeHtml(dateLabel || "-");
  const safeHour = escapeHtml(hourLabel || "-");
  const safeCapster = escapeHtml(capsterName || "-");
  const safeService = escapeHtml(serviceName || "-");

  const textBody =
    `Halo ${name || "Pelanggan"},\n\n` +
    `Ini pengingat kehadiran dari RH Barbershop.\n` +
    `Booking Anda akan dimulai dalam sekitar 15 menit.\n\n` +
    `Detail booking:\n` +
    `- Tanggal: ${dateLabel}\n` +
    `- Jam: ${hourLabel}\n` +
    `- Capster: ${capsterName || "-"}\n` +
    `- Layanan: ${serviceName || "-"}\n\n` +
    `Mohon hadir tepat waktu. Jika Anda sudah di lokasi atau booking dibatalkan, abaikan email ini.\n\n` +
    `Hormat kami,\nRH Barbershop`;

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;">Halo <strong>${safeName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
      Booking Anda akan segera dimulai. Mohon siapkan diri dan hadir tepat waktu.
    </p>
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin-bottom:22px;">
      <p style="margin:0;font-size:14px;color:#065f46;font-weight:600;">
        Booking dimulai dalam ±15 menit
      </p>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;font-size:13px;color:#6b7280;width:120px;">Tanggal</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;">${safeDate}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Jam</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">${safeHour}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Capster</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">${safeCapster}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;">Layanan</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">${safeService}</td>
      </tr>
    </table>
    <p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
      Jika Anda sudah berada di lokasi atau booking telah dibatalkan, Anda dapat mengabaikan email ini.
    </p>
  `;

  const htmlBody = buildEmailShell({
    title: "Pengingat Kehadiran",
    preheader: `Booking Anda pukul ${hourLabel} dimulai dalam ±15 menit.`,
    bodyHtml,
  });

  if (!transporter) {
    console.log("\n=======================================================");
    console.log("SMTP belum dikonfigurasi — preview pengingat kehadiran:");
    console.log(textBody);
    console.log("=======================================================\n");
    return { status: "local_dev_mock" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const logoAttachment = getLogoAttachment();

  return transporter.sendMail({
    from: `"RH Barbershop" <${from}>`,
    to: email,
    subject: `Pengingat Kehadiran — Booking pukul ${hourLabel}`,
    text: textBody,
    html: htmlBody,
    attachments: logoAttachment ? [logoAttachment] : [],
  });
};

module.exports = { sendMail, sendMailForgotPW, sendAttendanceReminder };
