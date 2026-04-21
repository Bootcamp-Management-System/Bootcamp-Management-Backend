import express from "express";
import { uploadResource, getResources, getResourcesByDivision, deleteResource, getResourceById, downloadResource } from "../controllers/resourceController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Apply auth to all resource routes
router.use(authMiddleware);

// Upload a new resource
// Must use multer upload.single('file') before the controller
router.post(
  "/upload",
  authorizeRole("super-admin", "admin", "instructor"),
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadResource
);

// Get all resources
router.get("/", getResources);

// Get resources by division
router.get("/division/:division_id", getResourcesByDivision);

// Get single resource
router.get("/:resource_id", getResourceById);

// Download single resource file
router.get("/:resource_id/download", downloadResource);

// Delete resource
router.delete("/:resource_id", authorizeRole("super-admin", "admin", "instructor"), deleteResource);

export default router;