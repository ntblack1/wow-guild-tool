import { Router } from "express";
import { AttendanceStatus, createSuccess, GuildEventStatus } from "@wow-guild-tool/shared";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

export const attendanceRouter = Router();

const attendanceStatuses = new Set<string>(Object.values(AttendanceStatus));

const validateAttendanceStatus = (status: unknown) => {
  if (typeof status !== "string" || !attendanceStatuses.has(status)) {
    throw new HttpError("status is invalid", 400, "INVALID_ATTENDANCE_STATUS");
  }

  return status;
};

attendanceRouter.patch("/:id", async (req, res, next) => {
  try {
    const currentAttendance = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      include: {
        event: true
      }
    });

    if (!currentAttendance) {
      throw new HttpError("Attendance not found", 404, "ATTENDANCE_NOT_FOUND");
    }

    if (
      currentAttendance.event.status === GuildEventStatus.Finished ||
      currentAttendance.event.status === GuildEventStatus.Cancelled
    ) {
      throw new HttpError("event attendance cannot be modified", 400, "EVENT_ATTENDANCE_CLOSED");
    }

    const status = validateAttendanceStatus(req.body.status);

    const attendance = await prisma.attendance.update({
      where: { id: currentAttendance.id },
      data: {
        status,
        ...(req.body.note !== undefined ? { note: req.body.note } : {})
      }
    });

    res.json(createSuccess(attendance));
  } catch (error) {
    next(error);
  }
});
