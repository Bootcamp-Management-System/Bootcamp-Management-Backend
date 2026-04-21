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
            <h2 style="color: #1e293b; margin-top: 0;">${options.subject}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">${options.text}</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:5000/api/v1/auth/verify-otp?email=${options.to}" 
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Verify Your Account
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
              (You will need to provide your OTP and a new password to complete verification)
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>&copy; 2026 Bootcamp Management System. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
