import Resource from "../models/Resource.js";
import Division from "../models/Division.js";
import Session from "../models/Session.js";
import path from "path";
import fs from "fs";
import * as resourceService from "../services/resourceService.js";
import { notifyDivision } from "../services/notificationService.js";

export const uploadResource = async (req, res) => {
  try {
    const { title, description, division_id, session_id, visibility } = req.body;
    const userRole = req.user.role; // Extract from auth middleware

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded or invalid file format" });
    }

    if (!title || !division_id) {
      return res.status(400).json({ message: "Title and division_id are required fields" });
    }

    const division = await Division.findById(division_id);
    if (!division) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Division does not exist" });
    }

    if (session_id) {
      const session = await Session.findById(session_id);
      if (!session) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Session does not exist" });
      }
    }

    // Role-based Access Control for Uploads
    if (userRole === "admin" || userRole === "instructor") {
      // Must be same division for admin or instructor
      if (req.user.division && req.user.division.toString() !== division_id.toString()) {
         // Cleanup uploaded file since they shouldn't have uploaded it here
         fs.unlinkSync(req.file.path);
         return res.status(403).json({ message: "You can only upload resources to your assigned division" });
      }
    } else if (userRole !== "super-admin") {
      // Default students/others block
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: "You do not have permission to upload resources" });
    }

    const file_type = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const file_url = `/uploads/resources/${req.file.filename}`;

    const newResource = await Resource.create({
      title,
      description,
      file_url,
      file_type,
      division_id,
      session_id: session_id || null,
      uploaded_by: req.user._id,
      uploader_role: req.user.role,
      visibility: visibility || "division",
    });

    res.status(201).json({
      message: "Resource uploaded successfully",
      resource_id: newResource._id,
      file_url: newResource.file_url,
    });

    // Notify division members about the new resource
    notifyDivision({
      senderId: req.user.id,
      divisionId: division_id,
      title: "New Resource Uploaded",
      message: `A new resource "${title}" has been uploaded to your division.`,
      type: "info",
      link: `/resources/${newResource._id}`,
      requester: req.user
    }).catch(err => console.error("Notification Error:", err));
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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
    } else if (["admin", "instructor", "student"].includes(userRole)) {
      if (req.user.division) {
         // See public resources or resources in their division
         query = {
           $or: [
             { visibility: "public" },
             { division_id: req.user.division }
           ]
         };
      } else {
         query = { visibility: "public" };
      }
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
       if (req.user.division?.toString() !== resource.division_id.toString()) {
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
    const filepath = path.join(process.cwd(), resource.file_url);
    if (fs.existsSync(filepath)) {
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
      .populate("division_id", "name");

    if (!resource) return res.status(404).json({ message: "Resource not found" });

    // Validate Read Privileges
    if (userRole !== "super_admin") {
       if (resource.visibility !== "public" && req.user.division && req.user.division.toString() !== resource.division_id._id.toString()) {
          return res.status(403).json({ message: "You don't have permission to view this resource." });
       }
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

    let query = { session_id };

    if (userRole !== "super_admin" && req.user) {
      if (req.user.division) {
         query = {
           ...query,
           $or: [
             { visibility: "public" },
             { division_id: req.user.division }
           ]
         };
      } else {
         query = { ...query, visibility: "public" };
      }
    }

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
    const { path: filePath, filename } = await resourceService.getDownloadableResource(
      req.params.resource_id,
      req.user
    );

    res.download(filePath, filename);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};