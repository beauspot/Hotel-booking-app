import { Router } from "express";

import { AuthController } from "@/controllers/auth";

import { AuthService } from "../services/auth.service";

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/register", authController.register);

export default router;
