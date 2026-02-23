import { Response, Router } from "express";
import { StatusCodes } from "http-status-codes";

import { DatabaseInitialize } from "@/config/db.config";

const router = Router();

// Health check route — useful for Docker/K8s probes
router.get("/health", (_, res: Response) => {
  res.status(StatusCodes.OK).json({
    status: "ok",
    db: DatabaseInitialize.state,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
