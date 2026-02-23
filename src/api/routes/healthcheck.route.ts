import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

import { DatabaseInitialize } from "@/config/db.config";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    db: DatabaseInitialize.state,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
