import express from "express";
import { createUser, getMe, getUserById, getUsers, promoteUser } from "../controllers/userController.js";
import { authMiddleware as protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/promote", restrictTo("super-admin", "admin"), promoteUser);

router.route("/")
  .post(restrictTo("super-admin", "admin"), createUser)
  .get(restrictTo("super-admin", "admin"), getUsers);

router.get("/me", getMe);
router.get("/:id", restrictTo("super-admin", "admin"), getUserById);


export default router;
