import express from "express";
import { createDivision, getDivisions } from "../controllers/divisionController.js";
import { restrictTo, authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("super-admin"), createDivision)
  .get(restrictTo("super-admin", "admin"), getDivisions);


export default router;