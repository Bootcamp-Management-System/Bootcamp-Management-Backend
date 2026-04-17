import express from "express";
import { createUser, getMe, getUserById, getUsers } from "../controllers/userController.js";
import { authMiddleware, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// Normally this route would be restricted to Admins only like this:
// router.post("/", authMiddleware, restrictTo("admin"), createUser);
// router.get("/", authMiddleware, restrictTo("admin"), getUsers);
// router.get("/:id", authMiddleware, restrictTo("admin"), getUserById);

// For testing right now, keeping it open so you can create your first user
router.post("/", createUser);
router.get("/", getUsers);
router.get("/me", authMiddleware, getMe);
router.get("/:id", authMiddleware, restrictTo("admin"), getUserById);

export default router;
