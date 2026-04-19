import express from "express";
import { createDivision, getDivisions, updateDivision, deleteDivision, getUsersByDivision } from "../controllers/divisionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.route("/")
  .post(createDivision)
  .get(getDivisions);

router.route("/:id")
  .put(updateDivision)
  .delete(deleteDivision);

router.route("/:divisionId/users")
  .get(getUsersByDivision);

export default router;