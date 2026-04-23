import nodemailer from "nodemailer";

class EmailService {
  static getTransporter() {
    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  static async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"BMS Portal" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };
      await this.getTransporter().sendMail(mailOptions);
      console.log(`📧 Email sent to ${options.to}`);
    } catch (error) {
      console.error("❌ Email Dispatch Failed:", error.message);
    }
  }

  // 1. Initial Verification Email
  static async sendVerificationEmail(email, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #2563eb;">Verify Your Account</h2>
        <p>Welcome to the Bootcamp Management System! Use the OTP below to verify your email and set up your password.</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">Or click the button below to go to the verification page:</p>
        <a href="http://localhost:5173/verify?email=${email}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Verify Now</a>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Action Required: Verify Your Account", html });
  }

  // 2. Phase 2: Selection for Technical Task
  static async sendPhase2TaskEmail(email, divisionName) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Congratulations! 🚀</h2>
        <p>You have passed Phase 1: Assessment for the <strong>${divisionName}</strong> Bootcamp!</p>
        <p><strong>Your Next Step:</strong> Please complete the technical task in your dashboard.</p>
        <p><a href="http://localhost:5173/dashboard/application" style="padding: 10px 15px; background: #0f172a; color: white; text-decoration: none; border-radius: 5px;">Access Technical Task</a></p>
        <p><em>Deadline: Please submit your links within 48 hours.</em></p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Round Two: Technical Task - Bootcamp Selection", html });
  }

  // 3. Final Acceptance (Platinum Email)
  static async sendAcceptanceEmail(email, otp, divisionName) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Official Acceptance 🎉</h2>
        <p>You have officially been accepted into the <strong>${divisionName}</strong> Bootcamp!</p>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p>To unlock your Full Bootcamp Experience, use this secure OTP for your first login:</p>
            <p style="font-size: 32px; letter-spacing: 10px; color: #065f46; text-align: center;"><strong>${otp}</strong></p>
        </div>
        <p>Welcome to the family!</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Bootcamp Acceptance - Secure Verification Required", html });
  }

  // 4. Waitlist Notification
  static async sendWaitlistEmail(email) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #f59e0b;">Application Status: Waitlisted</h2>
        <p>Your application is currently in our Waitlist queue.</p>
        <p>To increase your chances, please complete the secondary application task in your dashboard.</p>
        <p><a href="http://localhost:5173/dashboard/application" style="padding: 10px 15px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px;">Go to Waitlist Portal</a></p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Update: Your Bootcamp Application", html });
  }

  // 5. Rejection Email
  static async sendRejectionEmail(email) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Application Update</h2>
        <p>Thank you for applying to our bootcamp. After careful review, we regret to inform you that we will not be moving forward with your application at this time.</p>
        <p>We appreciate your interest and wish you the best in your career pursuits.</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Application Status Update", html });
  }

  // 6. Membership Acceptance (Post-Bootcamp)
  static async sendMembershipAcceptance(email, divisionName) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #2563eb; border-radius: 15px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to the Family! 🎉</h2>
        <p>Congratulations! You have been officially accepted as a **Member** of the <strong>${divisionName}</strong> Division!</p>
        <p>You now have permanent access to the division resources and are eligible to be promoted as a Mentor/Instructor for future bootcamps.</p>
        <div style="background: #eff6ff; padding: 15px; border-radius: 10px; margin: 20px 0;">
           <p style="margin: 0;"><strong>Membership Status:</strong> ACTIVE</p>
           <p style="margin: 0;"><strong>Division:</strong> ${divisionName}</p>
        </div>
        <p>Your dashboard has been updated with the Membership Nav Bar.</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: `Welcome to the ${divisionName} Division Membership!`, html });
  }

  // 7. Membership Rejection
  static async sendMembershipRejection(email, divisionName) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Membership Update</h2>
        <p>Thank you for your dedication throughout the bootcamp and for completing the membership assessment for the ${divisionName} division.</p>
        <p>While we appreciate your efforts, we have decided not to grant membership status at this time. We encourage you to keep building and applying your skills!</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Update regarding your Membership Application", html });
  }
}

export default EmailService;
