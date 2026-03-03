import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

import { User } from "@/models/userModels";
import AppError from "@/utils/appErrors";

interface RegisterInput {
  email: string;
  password: string;
  [key: string]: any;
}

export class AuthService {
  constructor() {}

  async registerUser(data: RegisterInput) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const newUser = await User.create({
        ...data,
        password: hashedPassword,
      });
      return newUser;
    } catch (error: any) {
      throw new AppError(error.message || "Failed to register User", 500, true);
    }
  }
}
