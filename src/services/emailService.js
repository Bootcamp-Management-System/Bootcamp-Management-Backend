import nodemailer from "nodemailer";

class EmailService {
  static transporter = null;

  static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
    return this.transporter;
  }

  static async verifyConnection() {
    try {
      await this.getTransporter().verify();
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
    }
  }

  static async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"BMS Portal" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const result = await this.getTransporter().sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error("❌ Email Dispatch Failed:", error.message);
      console.error("❌ Full error:", error);
      
      // For development, don't throw error to prevent signup failure
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      
      return null;
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
        <a href="http://localhost:5173/otp?email=${email}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Verify Now</a>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Action Required: Verify Your Account", html });
  }

  // 2. Phase 2: Selection for Technical Task
  static async sendPhase2TaskEmail(email, divisionName, applicationId) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Round Two: Technical Screening 🚀</h2>
        <p>Congratulations! Your initial application for <strong>${divisionName}</strong> has been accepted for the next stage.</p>
        <p><strong>Your Task:</strong> To evaluate your technical skills, we have assigned you a specific task. Please complete it and submit your work through the portal.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5173/recruitment/submit/${applicationId}" style="display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Submit Technical Task</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">If you cannot click the button, copy and paste this link: http://localhost:5173/recruitment/submit/${applicationId}</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: `Action Required: Technical Task for ${divisionName}`, html });
  }

  // 3. Final Acceptance (Platinum Email)
  static async sendAcceptanceEmail(email, otp, divisionName) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Congratulations 🎉</h2>
        <p>You have officially been selected for the <strong>${divisionName}</strong> Bootcamp!</p>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p>To finalize your enrollment, use this secure OTP for your first login:</p>
            <p style="font-size: 32px; letter-spacing: 10px; color: #065f46; text-align: center;"><strong>${otp}</strong></p>
        </div>
        <p>Welcome to CSEC ASTU!</p>
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
        <p>Thank you for your interest in our bootcamp program.</p>
        <p>After careful review, we regret to inform you that we will not be moving forward with your application at this time. We appreciate your interest and encourage you to apply for future opportunities.</p>
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

  // 8. Session Invitation (For Students)
  static async sendSessionNotification(email, session) {
    const icsContent = this.generateICS(session);
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 5px solid #2563eb;">
        <h2 style="color: #2563eb;">New Session Scheduled: ${session.title}</h2>
        <p>A new session has been added to your bootcamp schedule.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
          <p><strong>Date:</strong> ${new Date(session.startTime).toLocaleString()}</p>
          <p><strong>Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>
          <p><strong>Description:</strong> ${session.description}</p>
        </div>
        <p>We have attached a calendar invite to this email. Open it to add this session to your Google or Outlook calendar.</p>
      </div>
    `;
    
    const mailOptions = {
      to: email,
      subject: `Upcoming Session: ${session.title}`,
      html,
      attachments: [{
        filename: 'session.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }]
    };
    await this.sendEmail(mailOptions);
  }

  // 9. Instructor Assignment
  static async sendInstructorAssignment(email, session) {
    const icsContent = this.generateICS(session);
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 5px solid #10b981;">
        <h2 style="color: #10b981;">Assignment Notification: ${session.title}</h2>
        <p>You have been assigned as the **Lead Instructor** for the upcoming session.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">
          <p><strong>Session:</strong> ${session.title}</p>
          <p><strong>Time:</strong> ${new Date(session.startTime).toLocaleString()}</p>
          <p><strong>Action Required:</strong> Please prepare your resources and ensure you are ready 10 minutes before start time.</p>
        </div>
        <p>Don't forget to generate the **Attendance QR Code** during the session!</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Teaching Assignment: ${session.title}`,
      html,
      attachments: [{
        filename: 'assignment.ics',
        content: icsContent,
        contentType: 'text/calendar'
      }]
    });
  }

  // 10. Password Reset OTP
  static async sendPasswordResetOTP(email, otp) {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 5px solid #ef4444;">
        <h2 style="color: #ef4444;">Password Reset Request</h2>
        <p>We received a request to reset your password for the Bootcamp Management System.</p>
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; font-size: 1.2rem; text-align: center;">
          <p>Your 6-digit Reset Code is:</p>
          <h1 style="letter-spacing: 5px; color: #b91c1c;">${otp}</h1>
        </div>
        <p>This code is valid for **10 minutes**. If you did not request this, please ignore this email and ensure your account is secure.</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Password Reset Code", html });
  }

  // 11. Welcome Email for Imported Members
  static async sendImportWelcomeEmail(email, tempPassword, name, divisionNames) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
           <h1 style="color: #2563eb; margin: 0;">Welcome to CSEC ASTU! 🎉</h1>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been officially added as a Member of CSEC ASTU. You are now part of the following divisions: <strong>${divisionNames.join(", ")}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563; font-size: 14px;">Use these credentials for your first login:</p>
          <p style="margin: 10px 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0; font-size: 16px;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 4px;">${tempPassword}</code></p>
        </div>

        <p>For your security, you will be asked to change this password immediately after your first login.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:5173/login" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Login to Member Portal</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">If you have any questions, please contact your Division Head or the Super Admin.</p>
      </div>
    `;
    await this.sendEmail({ to: email, subject: "Welcome to CSEC ASTU - Your Member Credentials", html });
  }

  static generateICS(session) {
    const format = (d) => new Date(d).toISOString().replace(/-|:|\.\d+/g, '');
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:${format(new Date())}
DTSTART:${format(session.startTime)}
DTEND:${format(session.endTime)}
SUMMARY:${session.title}
DESCRIPTION:${session.description}
LOCATION:${session.meetingLink || 'Virtual'}
END:VEVENT
END:VCALENDAR`;
  }
}

export default EmailService;
