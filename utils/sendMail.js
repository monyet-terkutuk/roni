const Mailjet = require("node-mailjet");

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
  if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE || !process.env.MJ_SENDER_EMAIL) {
    console.log("\n=======================================================");
    console.log("⚠️ Mailjet API Key belum diisi di config/.env!");
    console.log(`🔑 LINK RESET PASSWORD (${options.email}):`);
    console.log(options.resetUrl);
    console.log("=======================================================\n");
    return { status: "local_dev_mock", message: "Link reset diprint ke terminal konsol lokal" };
  }

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
          '<h3>Reset Password RH Barbershop</h3><br />Silakan klik link berikut untuk mereset kata sandi Anda (link ini berlaku selama 15 menit):<br /><a href="' +
          options.resetUrl +
          '">Reset Password</a><br /><br /><p>Jika Anda tidak meminta reset password, silakan abaikan email ini.</p>',
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

module.exports = { sendMail, sendMailForgotPW };
