import express from "express";
import { getCurrentUser } from "../../controllers/self.controller.js";

const router = express.Router();

router.route("/").get(getCurrentUser);

export default router;
