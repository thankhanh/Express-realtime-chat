import exxpress from "express";
import { authMe } from "../controllers/userController.js";

const router = exxpress.Router();

router.get("/me", authMe);

export default router; 