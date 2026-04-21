import express from "express";
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from "../controllers/taskController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";
import { checkDivisionAccess } from "../middlewares/roleBase/divisionMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(authorizeRole("super-admin", "admin", "instructor"), checkDivisionAccess, createTask)
  .get(checkDivisionAccess, getTasks);

router.route("/:id")
  .get(checkDivisionAccess, getTaskById)
  .put(authorizeRole("super-admin", "admin", "instructor"), checkDivisionAccess, updateTask)
  .delete(authorizeRole("super-admin", "admin", "instructor"), checkDivisionAccess, deleteTask);

export default router;
