import express from "express";
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from "../controllers/taskController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { checkDivisionAccess } from "../middlewares/divisionGuard.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.route("/")
  .post(restrictTo("super-admin", "admin", "instructor"), checkDivisionAccess, createTask)
  .get(getTasks);

router.route("/:id")
  .get(getTaskById)
  .patch(restrictTo("super-admin", "admin", "instructor"), updateTask)
  .delete(restrictTo("super-admin", "admin", "instructor"), deleteTask);

export default router;
