import express from "express";
import { 
    getGroups, 
    createGroup, 
    updateGroup, 
    deleteGroup 
} from "../controllers/groupController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
    .get(getGroups)
    .post(authorize("admin", "super-admin"), createGroup);

router.route("/:id")
    .put(authorize("admin", "super-admin"), updateGroup)
    .delete(authorize("admin", "super-admin"), deleteGroup);

export default router;
