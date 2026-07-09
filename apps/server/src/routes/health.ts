import { Router } from "express";
import { createSuccess } from "@wow-guild-tool/shared";

import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(createSuccess({ status: "ok", database: "ok" }));
  } catch (error) {
    next(error);
  }
});
