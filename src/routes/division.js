import express from "express";
import { 
  createDivision, 
  getDivisions, 
  updateDivision, 
  deleteDivision, 
  getUsersByDivision 
} from "../controllers/divisionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("super-admin"), createDivision)
  .get(restrictTo("super-admin", "admin"), getDivisions);

router.route("/:id")
  .patch(restrictTo("super-admin"), updateDivision)
  .delete(restrictTo("super-admin"), deleteDivision);

router.get("/:divisionId/users", restrictTo("super-admin", "admin"), getUsersByDivision);

export default router;
