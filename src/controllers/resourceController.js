import Resource from "../models/Resource.js";
import Bootcamp from "../models/Bootcamp.js";
import Enrollment from "../models/Enrollment.js";
import Session from "../models/Session.js";
import path from "path";
import fs from "fs";
import * as resourceService from "../services/resourceService.js";

const normalizeFileType = (file) => {
  if (!file) return "link";

  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  if (ext === "pdf") return "pdf";
  if (["zip"].includes(ext)) return "zip";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  return ext;
};

const removeUploadedFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
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

export const uploadResource = async (req, res) => {
  try {
    const { title, description, bootcamp_id, session_id, visibility, external_url } = req.body;
    const userRole = req.user.role; // Extract from auth middleware
    const hasFile = Boolean(req.file);
    const hasExternalUrl = Boolean(external_url?.trim());

    if (!title) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: "Title is a required field" });
    }

    if (!hasFile && !hasExternalUrl) {
      return res.status(400).json({ message: "Upload a file or provide an external resource link." });
    }

    let bootcamp = null;
    if (bootcamp_id && bootcamp_id !== "undefined" && bootcamp_id !== "null") {
      bootcamp = await Bootcamp.findById(bootcamp_id);
      if (!bootcamp) {
        removeUploadedFile(req.file);
        return res.status(404).json({ message: "Bootcamp does not exist" });
      }
    }

    let session = null;
    if (session_id) {
      session = await Session.findById(session_id);
      if (!session) {
        removeUploadedFile(req.file);
        return res.status(404).json({ message: "Session does not exist" });
      }

      if (session.bootcamp.toString() !== bootcamp_id.toString()) {
        removeUploadedFile(req.file);
        return res.status(400).json({ message: "Resource bootcamp must match the session bootcamp." });
      }
    }

    // Role-based Access Control for Uploads (Contextual)
    const isGlobalAdmin = ["super-admin", "admin"].includes(userRole);
    let isSessionInstructor = false;

    if (session_id) {
       isSessionInstructor = session?.instructor?.toString() === req.user.id.toString();
    }

    if (!isGlobalAdmin && !isSessionInstructor) {
       // If not admin and not the specific instructor for this session, block.
       removeUploadedFile(req.file);
       return res.status(403).json({ message: "You do not have permission to upload resources. Only assigned instructors or admins can do this." });
    }

    // Admin Division Check
    if (userRole === "admin" && req.user.division && req.user.division.toString() !== bootcamp.division.toString()) {
       removeUploadedFile(req.file);
       return res.status(403).json({ message: "Admins can only upload resources to their assigned division" });
    }

    const file_type = normalizeFileType(req.file);
    const file_url = req.file ? `/uploads/resources/${req.file.filename}` : undefined;

    const newResource = await Resource.create({
      title,
      description,
      resource_type: hasFile ? "file" : "link",
      file_url,
      external_url: hasFile ? undefined : external_url.trim(),
      file_type,
      bootcamp_id: bootcamp ? bootcamp._id : null,
      division_id: bootcamp ? bootcamp.division : (session ? session.division : null),
      session_id: session_id || null,
      uploaded_by: req.user._id,
      uploader_role: req.user.role,
      visibility: visibility || "bootcamp",
    });

    res.status(201).json({
      success: true,
      message: "Resource uploaded successfully",
      data: newResource,
    });
  } catch (error) {
    removeUploadedFile(req.file);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getResources = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter resources by role logic
    if (userRole === "super-admin") {
      query = {}; // Access all resources
    } else if (["admin", "instructor"].includes(userRole)) {
      if (req.user.division) {
        const bootcamps = await Bootcamp.find({ division: req.user.division }).select("_id");
        query = {
          $or: [
            { visibility: "public" },
            { bootcamp_id: { $in: bootcamps.map((bootcamp) => bootcamp._id) } }
          ]
        };
      } else {
        query = { visibility: "public" };
      }
    } else if (userRole === "student" || userRole === "member") {
      const enrollments = await Enrollment.find({ student: req.user._id || req.user.id, is_active: true }).select("bootcamp");
      query = {
        $or: [
          { visibility: "public" },
          { bootcamp_id: { $in: enrollments.map((enrollment) => enrollment.bootcamp) } }
        ]
      };
    }

    const resources = await Resource.find(query).populate("uploaded_by", "email role").populate("session_id", "title").sort("-created_at");

    // Group resources by session
    const groupedData = resources.reduce((acc, resource) => {
      const sessionId = resource.session_id ? resource.session_id._id.toString() : "uncategorized";
      const sessionTitle = resource.session_id ? resource.session_id.title : "General / No Session";

      if (!acc[sessionId]) {
        acc[sessionId] = {
          session_id: resource.session_id ? resource.session_id._id : null,
          session_title: sessionTitle,
          resources: []
        };
      }
      
      acc[sessionId].resources.push(resource);
      return acc;
    }, {});

    // Convert object map out to a clean array
    const responseArray = Object.values(groupedData);

    res.status(200).json({ success: true, count: resources.length, groups: responseArray.length, data: responseArray });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getResourcesByDivision = async (req, res) => {
  try {
    const { division_id } = req.params;
    const userRole = req.user.role;

    if (userRole !== "super-admin") {
      if (req.user.division && req.user.division.toString() !== division_id) {
         return res.status(403).json({ message: "You only have access to your own division's resources" });
      }
    }

    const resources = await Resource.find({ division_id }).populate("session_id", "title").sort("-created_at");

    // Group resources by session
    const groupedData = resources.reduce((acc, resource) => {
      const sessionId = resource.session_id ? resource.session_id._id.toString() : "uncategorized";
      const sessionTitle = resource.session_id ? resource.session_id.title : "General / No Session";

      if (!acc[sessionId]) {
        acc[sessionId] = {
          session_id: resource.session_id ? resource.session_id._id : null,
          session_title: sessionTitle,
          resources: []
        };
      }
      
      acc[sessionId].resources.push(resource);
      return acc;
    }, {});

    // Convert object map out to a clean array
    const responseArray = Object.values(groupedData);

    res.status(200).json({ success: true, count: resources.length, groups: responseArray.length, data: responseArray });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const { resource_id } = req.params;
    const userRole = req.user.role;

    const resource = await Resource.findById(resource_id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Validate Delete Privileges
    if (userRole === "super-admin") {
       // Super Admin deletes anything
    } else if (userRole === "admin") {
       const bootcamp = await Bootcamp.findById(resource.bootcamp_id);
       if (req.user.division?.toString() !== bootcamp?.division?.toString()) {
          return res.status(403).json({ message: "You can only delete resources within your own division" });
       }
       // Admins cannot delete Super Admin resources
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

    // Delete the file from the file system
    const filepath = resource.file_url ? path.join(process.cwd(), resource.file_url.replace(/^\//, "")) : null;
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    await resource.deleteOne();

    res.status(200).json({ success: true, message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const { resource_id } = req.params;
    const userRole = req.user.role;

    const resource = await Resource.findById(resource_id)
      .populate("uploaded_by", "email role")
      .populate("session_id", "title")
      .populate("bootcamp_id", "name");

    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Validate Read Privileges
    if (userRole !== "super_admin") {
       await ensureResourceAccess(resource, req.user);
    }

    res.status(200).json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getResourcesBySession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const userRole = req.user ? req.user.role : "super_admin"; // Default to super_admin for testing if auth is disabled

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

    if (userRole === "instructor" && sessionExists.instructor?.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({ message: "You can only view resources for sessions assigned to you." });
    }

    let query = { session_id };

    const resources = await Resource.find(query)
      .populate("uploaded_by", "email role")
      .populate("session_id", "title")
      .sort("-created_at");

    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resource_id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    await ensureResourceAccess(resource, req.user);
    await Resource.findByIdAndUpdate(resource._id, { $inc: { download_count: 1 } });

    if (resource.resource_type === "link") {
      return res.status(200).json({ success: true, url: resource.external_url });
    }

    const { path: filePath, filename } = await resourceService.getDownloadableResource(req.params.resource_id, req.user);

    res.download(filePath, filename);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};
