import * as recruitmentService from "../services/recruitmentService.js";

// ─── ADMIN: Template Management ──────────────────────────────────────────────

export const createOrUpdateTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const template = await recruitmentService.createOrUpdateTemplateRepo(bootcampId, req.body, req.user.id);
    res.status(200).json({ success: true, message: "Template saved", data: template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const publishTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const template = await recruitmentService.publishTemplateRepo(bootcampId, req.user.id);
    res.status(200).json({ success: true, message: "Application form is now LIVE for students", data: template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const unpublishTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const template = await recruitmentService.unpublishTemplateRepo(bootcampId, req.user.id);
    res.status(200).json({ success: true, message: "Application form hidden from students", data: template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const { bootcampId } = req.params;
    const template = await recruitmentService.getTemplateByBootcampRepo(bootcampId);
    if (!template) {
      if (req.user.role === 'super-admin' || req.user.role === 'super_admin' || req.user.role === 'admin') {
        return res.status(200).json({ 
          success: true, 
          data: { phase1Fields: [], phase2Fields: [], waitlistFields: [], isPublished: false, bootcamp: bootcampId } 
        });
      }
      return res.status(404).json({ error: "No template found for this bootcamp" });
    }

    // Students only see published templates
    if (req.user.role === 'student' && !template.isPublished) {
      return res.status(404).json({ error: "Applications for this bootcamp are not open yet" });
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
    const application = await recruitmentService.applyToBootcampRepo(req.user.id, bootcampId, phase1Answers);
    res.status(201).json({ success: true, message: "Application submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitTechnicalTask = async (req, res) => {
  try {
    const { applicationId, ...taskData } = req.body;
    const application = await recruitmentService.submitTechnicalTaskRepo(applicationId, req.user.id, taskData);
    res.status(200).json({ success: true, message: "Technical task submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitWaitlistTask = async (req, res) => {
  try {
    const { applicationId, ...waitlistData } = req.body;
    const application = await recruitmentService.submitWaitlistTaskRepo(applicationId, req.user.id, waitlistData);
    res.status(200).json({ success: true, message: "Waitlist task submitted", data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ─── ADMIN: Decision & Viewing ────────────────────────────────────────────────

export const makeDecision = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await recruitmentService.handleAdminDecisionRepo(applicationId, req.user.id, req.body);
    res.status(200).json({ success: true, message: `Decision '${req.body.decision}' applied`, data: application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getApplications = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id || req.user.id;
    } else {
      // For admin and super-admin, allow filtering by bootcamp
      if (req.query.bootcampId) {
        filter.bootcamp = req.query.bootcampId;
      }
      // Allow filtering by status
      if (req.query.status) {
        filter.status = req.query.status;
      }
      // For admin, also filter by division if no specific bootcamp
      if (req.user.role === 'admin' && !req.query.bootcampId) {
        // Filter will be handled in service
      }
    }
    // super-admin sees all
    const applications = await recruitmentService.fetchApplicationsRepo(filter, req.user.role === 'admin' && !req.query.bootcampId ? req.user.division : null);
    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
