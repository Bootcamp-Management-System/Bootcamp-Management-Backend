import express from "express";
import {
  createUser,
  getMe,
  getUsers,
  promoteUser,
  getUser,
  updateUser,
  deleteUser
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

// Allow initial setup of super-admin ONLY if no users exist
router.post("/setup", async (req, res) => {
  const User = (await import("../models/User.js")).default;
  const count = await User.countDocuments();
  if (count > 0) {
    return res.status(403).json({ message: "Setup already completed. Use regular login." });
  }

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const crypto = (await import("crypto")).default;
  const bcrypt = (await import("bcryptjs")).default;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword,
    role: "super-admin",
    firstLogin: false,
    verified: true
  });
  
  res.status(201).json({ success: true, message: "Super Admin created. You can now login.", data: { id: user._id, email, role: user.role }});
});

// Apply auth to all other user routes
router.use(authMiddleware);

// POST /users/promote
router.post("/promote", restrictTo("super-admin", "admin"), promoteUser);
// PATCH /users/:id/promote
router.patch("/:id/promote", restrictTo("super-admin", "admin"), promoteUser);

router
  .route("/")
  .post(restrictTo("super-admin", "admin"), createUser)
  .get(restrictTo("super-admin", "admin"), getUsers);

router.get("/me", getMe);

router.get("/:id", getUser);
router.put("/:id", restrictTo("super-admin", "admin"), updateUser);
router.delete("/:id", restrictTo("super-admin"), deleteUser);

export default router;
