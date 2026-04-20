import express from "express";
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from "../controllers/taskController.js";
import { authMiddleware as protect, restrictTo, checkDivisionAccess } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("super-admin", "admin", "instructor"), checkDivisionAccess, createTask)
  .get(checkDivisionAccess, getTasks);

router.route("/:id")
  .get(checkDivisionAccess, getTaskById)
  .put(restrictTo("super-admin", "admin", "instructor"), checkDivisionAccess, updateTask)
  .delete(restrictTo("super-admin", "admin", "instructor"), checkDivisionAccess, deleteTask);

export default router;
