import express from "express";

import { attendanceRouter } from "./routes/attendance.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";
import { membersRouter } from "./routes/members.js";
import { signupsRouter } from "./routes/signups.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/events", eventsRouter);
  app.use("/attendance", attendanceRouter);
  app.use("/members", membersRouter);
  app.use("/signups", signupsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
