import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BMS Portal" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">BMS Portal</h1>
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">${options.subject}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">${options.text}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>&copy; 2026 Bootcamp Management System. All rights reserved.</p>
          </div>
        </div>
      `
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
