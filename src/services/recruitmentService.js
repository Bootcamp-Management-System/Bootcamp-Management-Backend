import Application from "../models/Application.js";
import ApplicationTemplate from "../models/ApplicationTemplate.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Bootcamp from "../models/Bootcamp.js";
import EmailService from "./emailService.js";

const sendRecruitmentEmail = (sendEmail, context) => {
  Promise.resolve()
    .then(sendEmail)
    .catch((error) => console.error(`Recruitment email failed (${context}):`, error.message));
};

// ─── ADMIN: Template Management ──────────────────────────────────────────────

export const createOrUpdateTemplateRepo = async (bootcampId, templateData, adminId) => {
  const bootcamp = await Bootcamp.findById(bootcampId);
  if (!bootcamp) throw new Error("Bootcamp not found");

  // We allow the admin to adjust phase1Fields, phase2Fields, and waitlistFields here
  const template = await ApplicationTemplate.findOneAndUpdate(
    { bootcamp: bootcampId },
    { 
      ...templateData, 
      bootcamp: bootcampId, 
      lastUpdatedBy: adminId, 
      createdBy: adminId 
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return template;
};

export const publishTemplateRepo = async (bootcampId, adminId) => {
  const template = await ApplicationTemplate.findOneAndUpdate(
    { bootcamp: bootcampId },
    { isPublished: true, lastUpdatedBy: adminId },
    { new: true }
  );
  if (!template) throw new Error("No template found. Create one first.");
  return template;
};

export const unpublishTemplateRepo = async (bootcampId, adminId) => {
  const template = await ApplicationTemplate.findOneAndUpdate(
    { bootcamp: bootcampId },
    { isPublished: false, lastUpdatedBy: adminId },
    { new: true }
  );
  if (!template) throw new Error("No template found.");
  return template;
};

export const getTemplateByBootcampRepo = async (bootcampId) => {
  return await ApplicationTemplate.findOne({ bootcamp: bootcampId })
    .populate('bootcamp', 'name')
    .populate('createdBy', 'email');
};

// ─── STUDENT: Applying (Phase 1) ─────────────────────────────────────────────

export const applyToBootcampRepo = async (studentId, bootcampId, phase1Answers) => {
  const template = await ApplicationTemplate.findOne({ bootcamp: bootcampId, isPublished: true });
  if (!template) throw new Error("Applications for this bootcamp are not currently open.");

  const existingApp = await Application.findOne({ student: studentId, bootcamp: bootcampId });
  if (existingApp) throw new Error("You have already applied for this bootcamp.");

  const bootcamp = await Bootcamp.findById(bootcampId);
  if (!bootcamp) throw new Error("Bootcamp not found");

  return await Application.create({
    student: studentId,
    bootcamp: bootcampId,
    bootcampApplied: bootcamp.name,
    phase1Answers, // Dynamic answers matching template phase1Fields
    status: 'PENDING'
  });
};

// ─── STUDENT: Submit Phase 2 (Technical Task) ───────────────────────────────

export const submitTechnicalTaskRepo = async (applicationId, studentId, phase2Answers) => {
  const app = await Application.findOne({ _id: applicationId, student: studentId });
  if (!app) throw new Error("Application not found.");
  
  if (app.status !== 'SCREENED_ROUND_1') {
    throw new Error("You are not eligible to submit this task at this time.");
  }

  // Admin-defined fields are captured here in data
  app.phase2Submission.data = phase2Answers; 
  app.phase2Submission.submittedAt = new Date();
  app.status = 'TASK_EVALUATION';
  
  return await app.save();
};

// ─── STUDENT: Submit Waitlist Items ──────────────────────────────────────────

export const submitWaitlistTaskRepo = async (applicationId, studentId, waitlistAnswers) => {
  const app = await Application.findOne({ _id: applicationId, student: studentId });
  if (!app) throw new Error("Application not found.");
  
  if (app.status !== 'WAITLISTED') {
    throw new Error("You are not currently on the waitlist for this task.");
  }

  // Admin-defined fields are captured here in data
  app.waitlistSubmission.data = waitlistAnswers;
  app.waitlistSubmission.submittedAt = new Date();
  app.status = 'WAITLIST_TASK_EVALUATION';
  
  return await app.save();
};

// ─── ADMIN: Decision Engine ───────────────────────────────────────────────────

export const handleAdminDecisionRepo = async (applicationId, adminId, decisionPayload) => {
  const { decision, note } = decisionPayload;
  const app = await Application.findById(applicationId).populate('student').populate('bootcamp');
  if (!app) throw new Error("Application not found");

  const student = app.student;
  let nextStatus = app.status;

  if (decision === 'PASS') {
    if (app.status !== 'PENDING') throw new Error("Only PENDING apps can be passed to the next round.");
    nextStatus = 'SCREENED_ROUND_1';
    app.phase2Submission.taskLinkSent = true;
    sendRecruitmentEmail(
      () => EmailService.sendPhase2TaskEmail(student.email, app.bootcampApplied, app._id),
      "phase 2 task"
    );
  }

  else if (decision === 'REJECT') {
    nextStatus = 'REJECTED';
    sendRecruitmentEmail(
      () => EmailService.sendRejectionEmail(student.email),
      "rejection"
    );
  }

  else if (decision === 'WAIT') {
    if (app.status !== 'TASK_EVALUATION') throw new Error("WAIT status is only for technical task evaluation phase.");
    nextStatus = 'WAITLISTED';
    sendRecruitmentEmail(
      () => EmailService.sendWaitlistEmail(student.email),
      "waitlist"
    );
  }

  else if (decision === 'ACCEPT') {
    if (!['PENDING', 'TASK_EVALUATION', 'WAITLIST_TASK_EVALUATION', 'WAITLISTED'].includes(app.status)) {
        throw new Error("Students can only be ACCEPTED from Pending, Evaluation, or Waitlist stages.");
    }
    nextStatus = 'ACCEPTED';

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const existingEnrollment = await Enrollment.findOne({ student: student._id, bootcamp: app.bootcamp._id });
    if (!existingEnrollment) {
      await Enrollment.create({
        student: student._id,
        bootcamp: app.bootcamp._id,
        is_active: false,
        enrollment_otp: { code: otp, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 } // Valid for 7 days
      });
    } else {
      existingEnrollment.enrollment_otp = { code: otp, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
      await existingEnrollment.save();
    }

    sendRecruitmentEmail(
      () => EmailService.sendAcceptanceEmail(student.email, otp, app.bootcampApplied),
      "acceptance"
    );

  }

  else if (decision === 'MEMBER') {
    if (app.status !== 'ACCEPTED') {
      throw new Error("Only ACCEPTED bootcamp students can be promoted to official Division Members.");
    }
    nextStatus = 'MEMBER';

    // Officially assign the student to the division as a full member
    if (app.bootcamp && app.bootcamp.division) {
      student.division = app.bootcamp.division;
      
      const membership = student.memberships.find(m => m.division.toString() === app.bootcamp.division.toString());
      if (!membership) {
        student.memberships.push({
          division: app.bootcamp.division,
          isMember: true 
        });
      } else {
        membership.isMember = true;
      }
      
      student.is_Member = true; // Global flag to unlock Member Hub
      await student.save();
    }
  }

  app.status = nextStatus;
  app.decisionHistory.push({ decision, admin: adminId, note });
  return await app.save();
};

export const fetchApplicationsRepo = async (filter, adminDivision = null) => {
  let query = Application.find(filter)
    .populate('student', 'email name')
    .populate({
      path: 'bootcamp',
      select: 'name division',
      populate: {
        path: 'division',
        select: 'name'
      }
    })
    .sort('-createdAt');

  // For admin, filter by bootcamp division
  if (adminDivision) {
    const bootcamps = await Bootcamp.find({ division: adminDivision }).select('_id');
    const bootcampIds = bootcamps.map(b => b._id);
    query = query.where('bootcamp').in(bootcampIds);
  }

  return await query;
};
export const fetchApplicationByIdRepo = async (id) => {
  return await Application.findById(id)
    .populate('student', 'email name')
    .populate({
      path: 'bootcamp',
      select: 'name division',
      populate: {
        path: 'division',
        select: 'name'
      }
    });
};
