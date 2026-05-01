import Resource from "../models/Resource.js";
import Bootcamp from "../models/Bootcamp.js";
import Enrollment from "../models/Enrollment.js";
import Session from "../models/Session.js";
import path from "path";
import fs from "fs";
import * as resourceService from "../services/resourceService.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

const normalizeFileType = (file) => {
  if (!file) return "link";
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (ext === "pdf") return "pdf";
  if (["zip"].includes(ext)) return "zip";
  if (["doc", "docx"].includes(ext)) return "docx";
  if (["ppt", "pptx"].includes(ext)) return "pptx";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return ext;
};

const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

const ensureResourceAccess = async (resource, user) => {
  if (user.role === "super-admin") return;

  const bootcamp = await Bootcamp.findById(resource.bootcamp_id).select("division");
  if (!bootcamp) {
    const err = new Error("Bootcamp does not exist");
    err.statusCode = 404;
    throw err;
  }

  if (user.role === "admin" && user.division?.toString() !== bootcamp.division.toString()) {
    const err = new Error("You only have access to your own division's resources");
    err.statusCode = 403;
    throw err;
  }

  if (user.role === "instructor") {
    const session = resource.session_id
      ? await Session.findById(resource.session_id).select("instructor")
      : null;
    if (session?.instructor?.toString() !== (user._id || user.id).toString()) {
      const err = new Error("You can only access resources for sessions assigned to you.");
      err.statusCode = 403;
      throw err;
    }
  }

  if (user.role === "student" || user.role === "member") {
    const enrollment = await Enrollment.findOne({
      student: user._id || user.id,
      bootcamp: resource.bootcamp_id,
      is_active: true,
    });
    if (!enrollment && resource.visibility !== "public") {
      const err = new Error("You must be enrolled in this bootcamp to view this resource.");
      err.statusCode = 403;
      throw err;
    }
  }
};

// ─── Upload Resource ──────────────────────────────────────────────────────────

export const uploadResource = async (req, res) => {
  try {
    const { title, description, bootcamp_id, session_id, visibility, external_url } = req.body;
    const userRole = req.user.role;
    const hasFile = Boolean(req.file);
    const hasExternalUrl = Boolean(external_url?.trim());

    // --- Required field validation ---
    if (!title?.trim()) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Title is required." });
    }

    if (!hasFile && !hasExternalUrl) {
      return res.status(400).json({ message: "Please upload a PDF file or provide an external link." });
    }

    // --- Role check ---
    const isGlobalAdmin = ["super-admin", "admin"].includes(userRole);
    if (!isGlobalAdmin && userRole !== "instructor") {
      removeUploadedFile(req.file);
      return res.status(403).json({ message: "You do not have permission to upload resources." });
    }

    // --- Session lookup (single, clean) ---
    let session = null;
    if (session_id) {
      session = await Session.findById(session_id);
      if (!session) {
        removeUploadedFile(req.file);
        return res.status(404).json({ message: "Session not found." });
      }

      // Instructor ownership check
      if (userRole === "instructor" && session.instructor?.toString() !== req.user._id.toString()) {
        removeUploadedFile(req.file);
        return res.status(403).json({ message: "You can only upload resources for sessions assigned to you." });
      }
    }

    // --- Bootcamp lookup ---
    let bootcamp = null;
    const resolvedBootcampId =
      bootcamp_id && bootcamp_id !== "undefined" && bootcamp_id !== "null"
        ? bootcamp_id
        : session?.bootcamp?.toString();

    if (resolvedBootcampId) {
      bootcamp = await Bootcamp.findById(resolvedBootcampId);
      if (!bootcamp) {
        removeUploadedFile(req.file);
        return res.status(404).json({ message: "Bootcamp not found." });
      }
    }

    // Validate session belongs to this bootcamp
    if (session && bootcamp && session.bootcamp.toString() !== bootcamp._id.toString()) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Session does not belong to this bootcamp." });
    }

    // Admin division check
    if (userRole === "admin" && req.user.division && bootcamp) {
      if (req.user.division.toString() !== bootcamp.division.toString()) {
        removeUploadedFile(req.file);
        return res.status(403).json({ message: "You can only upload resources to your assigned division." });
      }
    }

    // --- Create resource ---
    const file_url = req.file ? `/uploads/resources/${req.file.filename}` : undefined;
    const file_type = hasFile ? normalizeFileType(req.file) : "link";

    const newResource = await Resource.create({
      title: title.trim(),
      description: description?.trim() || "",
      resource_type: hasFile ? "file" : "link",
      file_url,
      external_url: hasFile ? undefined : external_url.trim(),
      file_type,
      bootcamp_id: bootcamp?._id || null,
      division_id: bootcamp?.division || null,
      session_id: session?._id || null,
      uploaded_by: req.user._id,
      uploader_role: req.user.role,
      visibility: visibility || "bootcamp",
    });

    return res.status(201).json({
      success: true,
      message: "Resource uploaded successfully",
      data: newResource,
    });
  } catch (error) {
    console.error("Resource Upload Error:", error);
    removeUploadedFile(req.file);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Get All Resources (grouped by session) ───────────────────────────────────

export const getResources = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole === "super-admin") {
      query = {};
    } else if (["admin", "instructor"].includes(userRole)) {
      if (req.user.division) {
        const bootcamps = await Bootcamp.find({ division: req.user.division }).select("_id");
        query = {
          $or: [
            { visibility: "public" },
            { bootcamp_id: { $in: bootcamps.map((b) => b._id) } },
          ],
        };
      } else {
        query = { visibility: "public" };
      }
    } else if (userRole === "student" || userRole === "member") {
      const enrollments = await Enrollment.find({
        student: req.user._id || req.user.id,
        is_active: true,
      }).select("bootcamp");
      query = {
        $or: [
          { visibility: "public" },
          { bootcamp_id: { $in: enrollments.map((e) => e.bootcamp) } },
        ],
      };
    }

    const resources = await Resource.find(query)
      .populate("uploaded_by", "email role")
      .populate("session_id", "title")
      .sort("-created_at");

    const groupedData = resources.reduce((acc, resource) => {
      const sessionId = resource.session_id ? resource.session_id._id.toString() : "uncategorized";
      const sessionTitle = resource.session_id ? resource.session_id.title : "General / No Session";
      if (!acc[sessionId]) {
        acc[sessionId] = { session_id: resource.session_id?._id || null, session_title: sessionTitle, resources: [] };
      }
      acc[sessionId].resources.push(resource);
      return acc;
    }, {});

    const responseArray = Object.values(groupedData);
    res.status(200).json({ success: true, count: resources.length, groups: responseArray.length, data: responseArray });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Get Resources by Division ────────────────────────────────────────────────

export const getResourcesByDivision = async (req, res) => {
  try {
    const { division_id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "super-admin") {
      if (req.user.division && req.user.division.toString() !== division_id) {
        return res.status(403).json({ message: "You only have access to your own division's resources" });
      }
    }

    const resources = await Resource.find({ division_id })
      .populate("session_id", "title")
      .sort("-created_at");

    const groupedData = resources.reduce((acc, resource) => {
      const sessionId = resource.session_id ? resource.session_id._id.toString() : "uncategorized";
      const sessionTitle = resource.session_id ? resource.session_id.title : "General / No Session";
      if (!acc[sessionId]) {
        acc[sessionId] = { session_id: resource.session_id?._id || null, session_title: sessionTitle, resources: [] };
      }
      acc[sessionId].resources.push(resource);
      return acc;
    }, {});

    const responseArray = Object.values(groupedData);
    res.status(200).json({ success: true, count: resources.length, groups: responseArray.length, data: responseArray });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Delete Resource ──────────────────────────────────────────────────────────

export const deleteResource = async (req, res) => {
  try {
    const { resource_id } = req.params;
    const userRole = req.user.role;

    const resource = await Resource.findById(resource_id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (userRole === "super-admin") {
      // allowed
    } else if (userRole === "admin") {
      const bootcamp = await Bootcamp.findById(resource.bootcamp_id);
      if (req.user.division?.toString() !== bootcamp?.division?.toString()) {
        return res.status(403).json({ message: "You can only delete resources within your own division" });
      }
      if (resource.uploader_role === "super-admin") {
        return res.status(403).json({ message: "Admins cannot delete resources uploaded by Super Admin" });
      }
    } else if (userRole === "instructor") {
      if (req.user._id.toString() !== resource.uploaded_by.toString()) {
        return res.status(403).json({ message: "Instructors can only delete their own uploaded resources" });
      }
    } else {
      return res.status(403).json({ message: "Students cannot delete resources" });
    }

    const filepath = resource.file_url
      ? path.join(process.cwd(), resource.file_url.replace(/^\//, ""))
      : null;
    if (filepath && fs.existsSync(filepath)) fs.unlinkSync(filepath);

    await resource.deleteOne();
    res.status(200).json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Get Resource by ID ───────────────────────────────────────────────────────

export const getResourceById = async (req, res) => {
  try {
    const { resource_id } = req.params;
    const userRole = req.user.role;

    const resource = await Resource.findById(resource_id)
      .populate("uploaded_by", "email role")
      .populate("session_id", "title")
      .populate("bootcamp_id", "name");

    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (userRole !== "super-admin") {
      await ensureResourceAccess(resource, req.user);
    }

    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Get Resources by Session ─────────────────────────────────────────────────

export const getResourcesBySession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userRole = req.user?.role || "super-admin";

    const sessionExists = await Session.findById(session_id);
    if (!sessionExists) return res.status(404).json({ message: "Session not found" });

    if (userRole === "student" || userRole === "member") {
      const enrollment = await Enrollment.findOne({
        student: req.user._id || req.user.id,
        bootcamp: sessionExists.bootcamp,
        is_active: true,
      });
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled in this bootcamp to view its resources." });
      }
    }

    // NOTE: instructors can view resources for any session (not restricted to their own)
    // so students enrolled and instructors can all see resources

    const resources = await Resource.find({ session_id })
      .populate("uploaded_by", "email role")
      .populate("session_id", "title")
      .sort("-created_at");

    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ─── Download Resource ────────────────────────────────────────────────────────

export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resource_id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    await ensureResourceAccess(resource, req.user);
    await Resource.findByIdAndUpdate(resource._id, { $inc: { download_count: 1 } });

    if (resource.resource_type === "link") {
      return res.status(200).json({ success: true, url: resource.external_url });
    }

    const { path: filePath, filename } = await resourceService.getDownloadableResource(
      req.params.resource_id,
      req.user
    );
    res.download(filePath, filename);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};
