import express from "express";
import { 
  createDivision, 
  getDivisions, 
  updateDivision, 
  deleteDivision, 
  getUsersByDivision,
  assignDivisionAdmin
} from "../controllers/divisionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

// Public Route for Landing Page
router.get("/public", getDivisions);

router.use(protect);

router.route("/")
  .post(restrictTo("super-admin"), createDivision)
  .get(restrictTo("super-admin", "admin"), getDivisions);

router.route("/:id")
  .patch(restrictTo("super-admin"), updateDivision)
  .delete(restrictTo("super-admin"), deleteDivision);

router.get("/:divisionId/users", restrictTo("super-admin", "admin"), getUsersByDivision);

router.post(
  "/:divisionId/assign-admin",
  restrictTo("super-admin"),
  assignDivisionAdmin
);

export default router;
