import { Request, Response } from "express";

import { AuthService } from "@/services/auth.service";
import AppError from "@/utils/appErrors";

export class AuthController {
  private authService: AuthService;
  constructor(authService: AuthService) {
    this.authService = authService;
    this.register = this.register.bind(this);
  }

  async register(req: Request, res: Response) {
    try {
      const user = await this.authService.registerUser(req.body);
      res.status(201).json({ status: "success", data: user });
    } catch (error: any) {
      throw new AppError(error.message || "Failed to register User", 500, true);
    }
  }
}
