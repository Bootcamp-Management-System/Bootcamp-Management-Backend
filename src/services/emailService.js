import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER || "test@gmail.com",
        pass: process.env.EMAIL_PASS || "testpass",
      },
    });

    const mailOptions = {
      from: "Bootcamp Management System <noreply@bms.com>",
      to: options.to,
      subject: options.subject,
      text: options.text,
    };

    // Log the email content exactly to the terminal BEFORE trying to send it
    console.log(`\n=======================================`);
    console.log(`✉️  EMAIL CONTENT (FOR TESTING)`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Content: ${options.text}`);
    console.log(`=======================================\n`);

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
