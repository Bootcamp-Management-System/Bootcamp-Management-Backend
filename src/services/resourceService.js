import Resource from "../models/Resource.js";
import Division from "../models/Division.js";
import Session from "../models/Session.js";
import path from "path";
import fs from "fs";

export const uploadResource = async (resourceData, file, user) => {
  const { title, description, division_id, session_id, visibility } = resourceData;
  const userRole = user.role;

  if (!file) {
    const err = new Error("No file uploaded or invalid file format");
    err.statusCode = 400;
    throw err;
  }

  if (!title || !division_id) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const err = new Error("Title and division_id are required fields");
    err.statusCode = 400;
    throw err;
  }

  const division = await Division.findById(division_id);
  if (!division) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const err = new Error("Division does not exist");
    err.statusCode = 404;
    throw err;
  }

  if (session_id) {
    const session = await Session.findById(session_id);
    if (!session) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      const err = new Error("Session does not exist");
      err.statusCode = 404;
      throw err;
    }
  }

  if (userRole === "admin" || userRole === "instructor") {
    if (user.division && user.division.toString() !== division_id.toString()) {
       if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
       const err = new Error("You can only upload resources to your assigned division");
       err.statusCode = 403;
       throw err;
    }
  } else if (userRole !== "super-admin") {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    const err = new Error("You do not have permission to upload resources");
    err.statusCode = 403;
    throw err;
  }

  const file_type = path.extname(file.originalname).toLowerCase().replace('.', '');
  const file_url = `/uploads/resources/${file.filename}`;

  const newResource = await Resource.create({
    title,
    description,
    file_url,
    file_type,
    division_id,
    session_id: session_id || null,
    uploaded_by: user._id,
    uploader_role: user.role,
    visibility: visibility || "division",
  });

  return newResource;
};

export const getResources = async (user) => {
  const userRole = user.role;
  let query = {};

  if (userRole === "super-admin") {
    query = {};
  } else if (["admin", "instructor", "student"].includes(userRole)) {
    if (user.division) {
       query = {
         $or: [
           { visibility: "public" },
           { division_id: user.division }
         ]
       };
    } else {
       query = { visibility: "public" };
    }
  }

  const resources = await Resource.find(query).populate("uploaded_by", "email role").populate("session_id", "title").sort("-created_at");

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

  return Object.values(groupedData);
};

export const getResourcesByDivision = async (division_id, user) => {
  const userRole = user.role;

  if (userRole !== "super-admin") {
    if (user.division && user.division.toString() !== division_id) {
       const err = new Error("You only have access to your own division's resources");
       err.statusCode = 403;
       throw err;
    }
  }

  const resources = await Resource.find({ division_id }).populate("session_id", "title").sort("-created_at");

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

  return Object.values(groupedData);
};

export const deleteResource = async (resource_id, user) => {
  const userRole = user.role;

  const resource = await Resource.findById(resource_id);
  if (!resource) {
    const err = new Error("Resource not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole === "super-admin") {
     // Super Admin deletes anything
  } else if (userRole === "admin") {
     if (user.division?.toString() !== resource.division_id.toString()) {
        const err = new Error("You can only delete resources within your own division");
        err.statusCode = 403;
        throw err;
     }
     if (resource.uploader_role === "super-admin") {
        const err = new Error("Admins cannot delete resources uploaded by Super Admin");
        err.statusCode = 403;
        throw err;
     }
  } else if (userRole === "instructor") {
     if (user._id.toString() !== resource.uploaded_by.toString()) {
        const err = new Error("Instructors can only delete their own uploaded resources");
        err.statusCode = 403;
        throw err;
     }
  } else {
     const err = new Error("Students cannot delete resources");
     err.statusCode = 403;
     throw err;
  }

  const filepath = path.join(process.cwd(), resource.file_url);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }

  await resource.deleteOne();
  return resource;
};

export const getResourceById = async (resource_id, user) => {
  const userRole = user.role;

  const resource = await Resource.findById(resource_id)
    .populate("uploaded_by", "email role")
    .populate("session_id", "title")
    .populate("division_id", "name");

  if (!resource) {
    const err = new Error("Resource not found");
    err.statusCode = 404;
    throw err;
  }

  if (userRole !== "super_admin") {
     if (resource.visibility !== "public" && user.division && user.division.toString() !== resource.division_id._id.toString()) {
        const err = new Error("You don't have permission to view this resource.");
        err.statusCode = 403;
        throw err;
     }
  }

  return resource;
};

export const getResourcesBySession = async (session_id, user) => {
  const userRole = user ? user.role : "super_admin";

  const sessionExists = await Session.findById(session_id);
  if (!sessionExists) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  let query = { session_id };

  if (userRole !== "super_admin" && user) {
    if (user.division) {
       query = {
         ...query,
         $or: [
           { visibility: "public" },
           { division_id: user.division }
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

  return resources;
};

export const getDownloadableResource = async (resource_id, user) => {
  const resource = await Resource.findById(resource_id).populate("division_id", "name");

  if (!resource) {
    const err = new Error("Resource not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== "super-admin") {
    const resourceDivisionId = resource.division_id?._id?.toString() || resource.division_id?.toString();
    if (resource.visibility !== "public" && user.division?.toString() !== resourceDivisionId) {
      const err = new Error("You don't have permission to download this resource.");
      err.statusCode = 403;
      throw err;
    }
  }

  const absolutePath = path.join(process.cwd(), resource.file_url.replace(/^\//, ""));
  if (!fs.existsSync(absolutePath)) {
    const err = new Error("Resource file not found on server");
    err.statusCode = 404;
    throw err;
  }

  return {
    path: absolutePath,
    filename: `${resource.title}.${resource.file_type}`,
  };
};