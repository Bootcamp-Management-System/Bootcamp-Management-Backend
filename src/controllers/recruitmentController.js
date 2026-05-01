import {
  createOrUpdateTemplateRepo,
  publishTemplateRepo,
  unpublishTemplateRepo,
  getTemplateByBootcampRepo,
  applyToBootcampRepo,
  submitTechnicalTaskRepo,
  submitWaitlistTaskRepo,
  handleAdminDecisionRepo,
  fetchApplicationsRepo,
  fetchApplicationByIdRepo
} from "../services/recruitmentService.js";
import Bootcamp from "../models/Bootcamp.js";

const applicantRoles = ["student", "instructor"];

const canManageBootcamp = async (bootcampId, user) => {
  if (user.role === "super-admin" || user.role === "super_admin") return true;
  if (user.role !== "admin" || !user.division) return false;

  const bootcamp = await Bootcamp.findById(bootcampId).select("division");
  return bootcamp?.division?.toString() === user.division.toString();
};

const ensureBootcampAccess = async (bootcampId, user) => {
  const allowed = await canManageBootcamp(bootcampId, user);
  if (!allowed) {
    const err = new Error("You can only manage recruitment for bootcamps in your division.");
    err.statusCode = 403;
    throw err;
  }
};

// ─── ADMIN: Template Management ──────────────────────────────────────────────

export const createOrUpdateTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    await ensureBootcampAccess(bootcampId, req.user);
    const template = await createOrUpdateTemplateRepo(bootcampId, req.body, req.user.id);
    res.status(200).json({ success: true, message: "Template saved", data: template });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const publishTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    await ensureBootcampAccess(bootcampId, req.user);
    const template = await publishTemplateRepo(bootcampId, req.user.id);
    res.status(200).json({ success: true, message: "Application form is now LIVE for students", data: template });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const unpublishTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    await ensureBootcampAccess(bootcampId, req.user);
    const template = await unpublishTemplateRepo(bootcampId, req.user.id);
    res.status(200).json({ success: true, message: "Application form hidden from students", data: template });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const bootcamp = await Bootcamp.findById(bootcampId).select("bootcampType");
    if (bootcamp?.bootcampType === "internal" && applicantRoles.includes(req.user.role)) {
      return res.status(404).json({ error: "Applications are not available for this internal bootcamp" });
    }

    const template = await getTemplateByBootcampRepo(bootcampId);
    if (!template) {
      if (req.user.role === 'super-admin' || req.user.role === 'super_admin' || req.user.role === 'admin') {
        return res.status(200).json({
          success: true,
          data: { phase1Fields: [], phase2Fields: [], waitlistFields: [], isPublished: false, bootcamp: bootcampId }
        });
      }
      return res.status(404).json({ error: "No template found for this bootcamp" });
    }

    // Applicants only see published templates, UNLESS they already have an application.
    if (applicantRoles.includes(req.user.role) && !template.isPublished) {
      const existingApp = await fetchApplicationsRepo({ 
        student: req.user._id || req.user.id, 
        bootcamp: bootcampId 
      });
      
      if (!existingApp || existingApp.length === 0) {
        return res.status(404).json({ error: "Applications for this bootcamp are not open yet" });
      }
    }

    res.status(200).json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── STUDENT: Applying ────────────────────────────────────────────────────────

export const apply = async (req, res) => {
  try {
    const { bootcampId, phase1Answers } = req.body;
    const application = await applyToBootcampRepo(req.user.id, bootcampId, phase1Answers);
    res.status(201).json({ success: true, message: "Application submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitTechnicalTask = async (req, res) => {
  try {
    const { applicationId, ...taskData } = req.body;
    const application = await submitTechnicalTaskRepo(applicationId, req.user.id, taskData);
    res.status(200).json({ success: true, message: "Technical task submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitWaitlistTask = async (req, res) => {
  try {
    const { applicationId, ...waitlistData } = req.body;
    const application = await submitWaitlistTaskRepo(applicationId, req.user.id, waitlistData);
    res.status(200).json({ success: true, message: "Waitlist task submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── ADMIN: Decision & Viewing ────────────────────────────────────────────────

export const makeDecision = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const existingApplication = await fetchApplicationByIdRepo(applicationId);
    if (!existingApplication) return res.status(404).json({ error: "Application not found" });
    await ensureBootcampAccess(existingApplication.bootcamp?._id || existingApplication.bootcamp, req.user);

    const application = await handleAdminDecisionRepo(applicationId, req.user.id, req.body);
    res.status(200).json({ success: true, message: `Decision '${req.body.decision}' applied`, data: application });
  } catch (error) {
    res.status(error.statusCode || 400).json({ error: error.message });
  }
};

export const getApplications = async (req, res) => {
  try {
    let filter = {};
    if (applicantRoles.includes(req.user.role)) {
      filter.student = req.user._id || req.user.id;
    } else {
      if (req.user.role === "admin" && !req.user.division) {
        return res.status(403).json({ error: "Admin is not assigned to a division." });
      }

      // For admin and super-admin, allow filtering by bootcamp
      if (req.query.bootcampId) {
        filter.bootcamp = req.query.bootcampId;
      }
      // Allow filtering by status
      if (req.query.status) {
        if (req.query.status === 'TASK_EVALUATION') {
          filter.status = { $in: ['TASK_EVALUATION', 'WAITLIST_TASK_EVALUATION'] };
        } else {
          filter.status = req.query.status;
        }
      }
    }
    const applications = await fetchApplicationsRepo(filter, req.user.role === 'admin' ? req.user.division : null);
    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('DEBUG: getApplications Error ->', error);
    res.status(500).json({ error: error.message });
  }
};

export const getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await fetchApplicationByIdRepo(applicationId);
    
    if (!application) return res.status(404).json({ error: "Application not found" });

    // Security: Students can only see their own application
    const studentId = application.student._id || application.student;
    const currentUserId = req.user._id || req.user.id;
    const isStaff = ['super-admin', 'super_admin', 'admin'].includes(req.user.role);
    
    if (!isStaff && studentId.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role === "admin") {
      const allowed = await canManageBootcamp(application.bootcamp?._id || application.bootcamp, req.user);
      if (!allowed) return res.status(403).json({ error: "Access denied" });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
