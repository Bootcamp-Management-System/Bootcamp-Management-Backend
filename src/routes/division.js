import express from "express";
import { 
  createDivision, 
  getDivisions, 
  updateDivision, 
  deleteDivision, 
  getUsersByDivision 
} from "../controllers/divisionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(authorizeRole("super-admin"), createDivision)
  .get(authorizeRole("super-admin", "admin"), getDivisions);

router.route("/:id")
  .patch(authorizeRole("super-admin"), updateDivision)
  .delete(authorizeRole("super-admin"), deleteDivision);

router.get("/:divisionId/users", authorizeRole("super-admin", "admin"), getUsersByDivision);

export default router;
