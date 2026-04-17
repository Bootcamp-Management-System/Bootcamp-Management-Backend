import express from "express";
import { createDivision, getDivisions } from "../controllers/divisionController.js";
import { restrictTo, authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("admin"), createDivision)
  .get(getDivisions);

export default router;