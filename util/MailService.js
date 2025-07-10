const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    // user: "info@pillpharm.co.uk",
    // pass: "vyxmftktkudzzlmo",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is Ready to Take Messages");
  }
});

const sendingEmail = async (to, subject, body) => {
  const mailOptions = {
    // from: "hello@pillpharm.co.uk",
    to,
    subject,
    html: body,
  };
  await transporter.sendMail(mailOptions);
};

const handleVerificationEmail = async ({
  firstName,
  email,
  verificationLink,
}) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/user_register.html"
    );

    // Use async file reading to avoid blocking execution
    let template = await fs.promises.readFile(templatePath, "utf8");
    template = template
      .replace("{{firstName}}", firstName)
      .replace("{{email}}", email)
      .replace("{{verificationLink}}", verificationLink);

    // Attempt to send the email
    await mailSend(
      email,
      "hassimughal960@gmail.com",
      "Verify User From Mobil Tech",
      template
    );

    return { success: true, message: "Mail sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};

const handleForgotPasswordEmail = async ({ firstName, email, token, url }) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/reset_password.html"
    );

    // Use async file reading to avoid blocking execution
    let template = await fs.promises.readFile(templatePath, "utf8");
    template = template
      .replace("{{firstName}}", firstName)
      .replace("{{email}}", email)
      .replace("{{token}}", token)
      .replace("{{url}}", url);

    // Attempt to send the email
    await mailSend(
      email,
      "hassimughal960@gmail.com",
      "Reset Passowrd",
      template
    );

    return {
      success: true,
      message: "Password reset link has been sent to your email",
    };
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return { success: false, error: error.message };
  }
};

const mailSend = async (customerEmail, to, subject, body) => {
  //   const mailOptions = {
  //     from: `Contact Us Form Pharmora`, // Updated from field
  //     to,
  //     subject,
  //     html: body,
  //     replyTo: customerEmail,
  //   };
  console.log("=====customerEmail", customerEmail);
  const mailOptions = {
    from: "Verify User Form Mobil Tech",
    to,
    subject,
    html: body,
    cc: customerEmail,
    bcc: "hassimughal960@gmail.com",
  };

  await transporter.sendMail(mailOptions);
};

const handleContactUsForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const templatePath = path.join(__dirname, "../templates/contact-us.html");
    let template = fs.readFileSync(templatePath, "utf8");
    template = template
      .replace("{{name}}", name)
      .replace("{{email}}", email)
      .replace("{{subject}}", subject)
      .replace("{{message}}", message);
    await mailSend(
      email,
      "hassimughal960@gmail.com",
      "Contact Us Form Mobil Tech",
      template
    );

    return res.json({ success: true, message: "Mail sent successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, error: error.message });
  }
};

module.exports = {
  sendingEmail,
  mailSend,
  handleContactUsForm,
  handleVerificationEmail,
  handleForgotPasswordEmail,
};
