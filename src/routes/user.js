import express from "express";
import {
  createUser,
  getMe,
  getUserById,
  getUsers,
  promoteUser,
} from "../controllers/userController.js";
import { authMiddleware as protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/promote", restrictTo("super-admin", "admin"), promoteUser);

router
  .route("/")
  .post(restrictTo("super-admin", "admin"), createUser)
  .get(restrictTo("super-admin", "admin"), getUsers);

router.get("/me", getMe);
router.get("/:id", restrictTo("super-admin", "admin"), getUserById);
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
