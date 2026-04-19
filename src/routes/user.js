import express from "express";
import { createUser, getUsers, promoteUser, getMe, getUser, updateUser, deleteUser } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js"; // We will add security later

const router = express.Router();

// Normally this route would be restricted to Admins only like this:
// router.post("/", protect, authorize("admin"), createUser);

// For testing right now, keeping it open so you can create your first user
router.post("/", createUser);
router.get("/", getUsers);

// GET /users/me - Requires auth to know who "me" is
router.get("/me", authMiddleware, getMe);

// GET /users/:id - Must come AFTER /me 
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// PATCH /users/:id/promote
router.patch("/:id/promote", promoteUser);

export default router;
