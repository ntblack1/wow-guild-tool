import { Router } from "express";
import {
  AttendanceStatus,
  createSuccess,
  GuildEventStatus,
  GuildEventType,
  SignupRole,
  SignupStatus
} from "@wow-guild-tool/shared";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

export const eventsRouter = Router();

type EventInput = {
  title?: string;
  raidName?: string;
  startTime?: string;
  maxPlayers?: number;
  tankNeed?: number;
  healerNeed?: number;
  meleeNeed?: number;
  rangedNeed?: number;
  leaderId?: string;
  description?: string;
};

type SignupInput = {
  memberId?: string;
  characterId?: string;
  note?: string;
  status?: SignupStatus;
  roleType?: SignupRole;
};

type AttendanceInput = {
  memberId?: string;
  characterId?: string;
  status?: AttendanceStatus;
  note?: string;
};

const activeSignupWhere = {
  status: {
    not: SignupStatus.Cancelled
  }
};

const parsePositiveInteger = (value: unknown, field: string) => {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new HttpError(`${field} must be greater than 0`, 400, "INVALID_EVENT_INPUT");
  }

  return Number(value);
};

const parseNonNegativeInteger = (value: unknown, field: string) => {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new HttpError(`${field} cannot be negative`, 400, "INVALID_EVENT_INPUT");
  }

  return Number(value);
};

const parseStartTime = (value: unknown) => {
  if (typeof value !== "string") {
    throw new HttpError("startTime must be a valid time", 400, "INVALID_EVENT_INPUT");
  }

  const startTime = new Date(value);

  if (Number.isNaN(startTime.getTime())) {
    throw new HttpError("startTime must be a valid time", 400, "INVALID_EVENT_INPUT");
  }

  return startTime;
};

const validateEventInput = async (input: EventInput) => {
  const title = input.title?.trim();
  const raidName = input.raidName?.trim();

  if (!title) {
    throw new HttpError("title is required", 400, "INVALID_EVENT_INPUT");
  }

  if (!raidName) {
    throw new HttpError("raidName is required", 400, "INVALID_EVENT_INPUT");
  }

  const startTime = parseStartTime(input.startTime);
  const maxPlayers = parsePositiveInteger(input.maxPlayers, "maxPlayers");
  const tankNeed = parseNonNegativeInteger(input.tankNeed, "tankNeed");
  const healerNeed = parseNonNegativeInteger(input.healerNeed, "healerNeed");
  const meleeNeed = parseNonNegativeInteger(input.meleeNeed, "meleeNeed");
  const rangedNeed = parseNonNegativeInteger(input.rangedNeed, "rangedNeed");

  if (tankNeed + healerNeed + meleeNeed + rangedNeed > maxPlayers) {
    throw new HttpError(
      "role needs cannot exceed maxPlayers",
      400,
      "EVENT_ROLE_NEEDS_EXCEED_MAX_PLAYERS"
    );
  }

  if (!input.leaderId) {
    throw new HttpError("leaderId must reference an active member", 400, "EVENT_LEADER_NOT_FOUND");
  }

  const leader = await prisma.member.findFirst({
    where: {
      id: input.leaderId,
      active: true
    }
  });

  if (!leader) {
    throw new HttpError("leaderId must reference an active member", 400, "EVENT_LEADER_NOT_FOUND");
  }

  return {
    title,
    raidName,
    startTime,
    maxPlayers,
    tankNeed,
    healerNeed,
    meleeNeed,
    rangedNeed,
    leaderId: input.leaderId,
    description: input.description
  };
};

const findEventOrThrow = async (id: string) => {
  const event = await prisma.guildEvent.findUnique({
    where: { id }
  });

  if (!event) {
    throw new HttpError("Event not found", 404, "EVENT_NOT_FOUND");
  }

  return event;
};

const changeEventStatus = async (id: string, status: GuildEventStatus) => {
  await findEventOrThrow(id);

  return prisma.guildEvent.update({
    where: { id },
    data: { status }
  });
};

const buildSignupStats = async (eventId: string) => {
  const signups = await prisma.signup.findMany({
    where: {
      eventId,
      ...activeSignupWhere
    },
    select: {
      roleType: true
    }
  });

  return {
    total: signups.length,
    byRole: {
      tank: signups.filter((signup) => signup.roleType === SignupRole.Tank).length,
      healer: signups.filter((signup) => signup.roleType === SignupRole.Healer).length,
      melee: signups.filter((signup) => signup.roleType === SignupRole.Melee).length,
      ranged: signups.filter((signup) => signup.roleType === SignupRole.Ranged).length
    }
  };
};

const signupStatuses = new Set<string>(Object.values(SignupStatus));
const signupRoles = new Set<string>(Object.values(SignupRole));
const attendanceStatuses = new Set<string>(Object.values(AttendanceStatus));

const validateSignupStatus = (status: unknown) => {
  if (status === undefined) {
    return SignupStatus.Signed;
  }

  if (typeof status !== "string" || !signupStatuses.has(status)) {
    throw new HttpError("status is invalid", 400, "INVALID_SIGNUP_STATUS");
  }

  return status;
};

const validateSignupRoleType = (roleType: unknown) => {
  if (typeof roleType !== "string" || !signupRoles.has(roleType)) {
    throw new HttpError("roleType is invalid", 400, "INVALID_SIGNUP_ROLE_TYPE");
  }

  return roleType;
};

const findActiveMemberOrThrow = async (memberId: unknown) => {
  if (typeof memberId !== "string") {
    throw new HttpError("memberId must reference an active member", 400, "SIGNUP_MEMBER_NOT_FOUND");
  }

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      active: true
    }
  });

  if (!member) {
    throw new HttpError("memberId must reference an active member", 400, "SIGNUP_MEMBER_NOT_FOUND");
  }

  return member;
};

const validateSignupCharacter = async (memberId: string, characterId: unknown) => {
  if (typeof characterId !== "string") {
    throw new HttpError("characterId must belong to memberId", 400, "SIGNUP_CHARACTER_NOT_OWNED");
  }

  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      memberId
    }
  });

  if (!character) {
    throw new HttpError("characterId must belong to memberId", 400, "SIGNUP_CHARACTER_NOT_OWNED");
  }

  return character;
};

const getSignupSummary = async (eventId: string) => {
  const event = await findEventOrThrow(eventId);
  const signups = await prisma.signup.findMany({
    where: { eventId }
  });
  const signed = signups.filter((signup) => signup.status === SignupStatus.Signed);
  const signedByRole = (roleType: SignupRole) =>
    signed.filter((signup) => signup.roleType === roleType).length;
  const tankSigned = signedByRole(SignupRole.Tank);
  const healerSigned = signedByRole(SignupRole.Healer);
  const meleeSigned = signedByRole(SignupRole.Melee);
  const rangedSigned = signedByRole(SignupRole.Ranged);

  return {
    maxPlayers: event.maxPlayers,
    signedCount: signed.length,
    standbyCount: signups.filter((signup) => signup.status === SignupStatus.Standby).length,
    leaveCount: signups.filter((signup) => signup.status === SignupStatus.Leave).length,
    cancelledCount: signups.filter((signup) => signup.status === SignupStatus.Cancelled).length,
    tankSigned,
    healerSigned,
    meleeSigned,
    rangedSigned,
    tankNeed: event.tankNeed,
    healerNeed: event.healerNeed,
    meleeNeed: event.meleeNeed,
    rangedNeed: event.rangedNeed,
    tankGap: Math.max(event.tankNeed - tankSigned, 0),
    healerGap: Math.max(event.healerNeed - healerSigned, 0),
    meleeGap: Math.max(event.meleeNeed - meleeSigned, 0),
    rangedGap: Math.max(event.rangedNeed - rangedSigned, 0)
  };
};

const ensureAttendanceEditableEvent = async (eventId: string) => {
  const event = await findEventOrThrow(eventId);

  if (event.status !== GuildEventStatus.Locked && event.status !== GuildEventStatus.InProgress) {
    throw new HttpError("event attendance is not allowed", 400, "EVENT_ATTENDANCE_NOT_ALLOWED");
  }

  return event;
};

const validateAttendanceStatus = (status: unknown) => {
  if (typeof status !== "string" || !attendanceStatuses.has(status)) {
    throw new HttpError("status is invalid", 400, "INVALID_ATTENDANCE_STATUS");
  }

  return status;
};

const findAttendanceMemberOrThrow = async (memberId: unknown) => {
  if (typeof memberId !== "string") {
    throw new HttpError("memberId must reference an active member", 400, "ATTENDANCE_MEMBER_NOT_FOUND");
  }

  const member = await prisma.member.findFirst({
    where: {
      id: memberId,
      active: true
    }
  });

  if (!member) {
    throw new HttpError("memberId must reference an active member", 400, "ATTENDANCE_MEMBER_NOT_FOUND");
  }

  return member;
};

const validateAttendanceCharacter = async (memberId: string, characterId: unknown) => {
  if (typeof characterId !== "string") {
    throw new HttpError("characterId must belong to memberId", 400, "ATTENDANCE_CHARACTER_NOT_OWNED");
  }

  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      memberId
    }
  });

  if (!character) {
    throw new HttpError("characterId must belong to memberId", 400, "ATTENDANCE_CHARACTER_NOT_OWNED");
  }

  return character;
};

const findSignupForAttendance = async (eventId: string, memberId: string) =>
  prisma.signup.findUnique({
    where: {
      eventId_memberId: {
        eventId,
        memberId
      }
    }
  });

const buildAttendanceSummary = async (eventId: string) => {
  await findEventOrThrow(eventId);

  const attendance = await prisma.attendance.findMany({
    where: { eventId },
    select: { status: true }
  });

  return {
    presentCount: attendance.filter((item) => item.status === AttendanceStatus.Present).length,
    lateCount: attendance.filter((item) => item.status === AttendanceStatus.Late).length,
    absentCount: attendance.filter((item) => item.status === AttendanceStatus.Absent).length,
    standbyCount: attendance.filter((item) => item.status === AttendanceStatus.Standby).length,
    totalAttendanceCount: attendance.length
  };
};

eventsRouter.get("/", async (req, res, next) => {
  try {
    const { status, raidName } = req.query;
    const events = await prisma.guildEvent.findMany({
      where: {
        ...(typeof status === "string" ? { status } : {}),
        ...(typeof raidName === "string" ? { raidName: { contains: raidName } } : {})
      },
      orderBy: { startTime: "desc" }
    });

    res.json(createSuccess(events));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/", async (req, res, next) => {
  try {
    const input = await validateEventInput(req.body as EventInput);

    const event = await prisma.guildEvent.create({
      data: {
        ...input,
        status: GuildEventStatus.Draft,
        type: GuildEventType.Raid
      }
    });

    res.status(201).json(createSuccess(event));
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    const event = await prisma.guildEvent.findUnique({
      where: { id: req.params.id },
      include: {
        leader: true
      }
    });

    if (!event) {
      throw new HttpError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    const signupStats = await buildSignupStats(event.id);

    res.json(
      createSuccess({
        ...event,
        signupStats
      })
    );
  } catch (error) {
    next(error);
  }
});

eventsRouter.patch("/:id", async (req, res, next) => {
  try {
    const currentEvent = await findEventOrThrow(req.params.id);

    if (currentEvent.status === GuildEventStatus.Finished) {
      throw new HttpError("finished events cannot be modified", 400, "EVENT_ALREADY_FINISHED");
    }

    const input = await validateEventInput({
      title: req.body.title ?? currentEvent.title,
      raidName: req.body.raidName ?? currentEvent.raidName,
      startTime: req.body.startTime ?? currentEvent.startTime.toISOString(),
      maxPlayers: req.body.maxPlayers ?? currentEvent.maxPlayers,
      tankNeed: req.body.tankNeed ?? currentEvent.tankNeed,
      healerNeed: req.body.healerNeed ?? currentEvent.healerNeed,
      meleeNeed: req.body.meleeNeed ?? currentEvent.meleeNeed,
      rangedNeed: req.body.rangedNeed ?? currentEvent.rangedNeed,
      leaderId: req.body.leaderId ?? currentEvent.leaderId ?? undefined,
      description: req.body.description ?? currentEvent.description ?? undefined
    });

    const event = await prisma.guildEvent.update({
      where: { id: req.params.id },
      data: input
    });

    res.json(createSuccess(event));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    const event = await changeEventStatus(req.params.id, GuildEventStatus.Cancelled);

    res.json(createSuccess(event));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/open-signup", async (req, res, next) => {
  try {
    const event = await changeEventStatus(req.params.id, GuildEventStatus.SignupOpen);

    res.json(createSuccess(event));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/lock", async (req, res, next) => {
  try {
    const event = await changeEventStatus(req.params.id, GuildEventStatus.Locked);

    res.json(createSuccess(event));
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/:id/signups", async (req, res, next) => {
  try {
    const { status, roleType } = req.query;
    const signups = await prisma.signup.findMany({
      where: {
        eventId: req.params.id,
        ...(typeof status === "string" ? { status } : {}),
        ...(typeof roleType === "string" ? { roleType } : {})
      },
      orderBy: { createdAt: "asc" },
      include: {
        member: true,
        character: true
      }
    });

    res.json(createSuccess(signups));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/signups", async (req, res, next) => {
  try {
    const event = await findEventOrThrow(req.params.id);

    if (event.status !== GuildEventStatus.SignupOpen) {
      throw new HttpError("event signup is not open", 400, "EVENT_SIGNUP_NOT_OPEN");
    }

    const { memberId, characterId, note, status, roleType } = req.body as SignupInput;
    const member = await findActiveMemberOrThrow(memberId);
    const character = await validateSignupCharacter(member.id, characterId);
    const requestedStatus = validateSignupStatus(status);
    const validRoleType = validateSignupRoleType(roleType);

    const existingSignup = await prisma.signup.findUnique({
      where: {
        eventId_memberId: {
          eventId: event.id,
          memberId: member.id
        }
      }
    });

    if (existingSignup && existingSignup.status !== SignupStatus.Cancelled) {
      throw new HttpError("member already has an active signup", 409, "SIGNUP_ALREADY_EXISTS");
    }

    const signedCount = await prisma.signup.count({
      where: {
        eventId: event.id,
        status: SignupStatus.Signed
      }
    });
    const finalStatus =
      requestedStatus === SignupStatus.Signed && signedCount >= event.maxPlayers
        ? SignupStatus.Standby
        : requestedStatus;

    const data = {
      eventId: event.id,
      memberId: member.id,
      characterId: character.id,
      note,
      status: finalStatus,
      roleType: validRoleType
    };

    const signup = existingSignup
      ? await prisma.signup.update({
          where: { id: existingSignup.id },
          data
        })
      : await prisma.signup.create({
          data
        });


    res.status(201).json(createSuccess(signup));
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/:id/signup-summary", async (req, res, next) => {
  try {
    const summary = await getSignupSummary(req.params.id);

    res.json(createSuccess(summary));
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/:id/attendance", async (req, res, next) => {
  try {
    const { status } = req.query;
    await findEventOrThrow(req.params.id);

    const attendance = await prisma.attendance.findMany({
      where: {
        eventId: req.params.id,
        ...(typeof status === "string" ? { status } : {})
      },
      orderBy: { createdAt: "asc" },
      include: {
        member: true,
        character: true
      }
    });

    res.json(createSuccess(attendance));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/attendance", async (req, res, next) => {
  try {
    const event = await ensureAttendanceEditableEvent(req.params.id);
    const { memberId, characterId, status, note } = req.body as AttendanceInput;
    const member = await findAttendanceMemberOrThrow(memberId);
    const character = await validateAttendanceCharacter(member.id, characterId);
    const validStatus = validateAttendanceStatus(status);
    const signup = await findSignupForAttendance(event.id, member.id);

    const data = {
      eventId: event.id,
      memberId: member.id,
      characterId: character.id,
      signupId: signup?.id ?? null,
      status: validStatus,
      note
    };

    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_memberId: {
          eventId: event.id,
          memberId: member.id
        }
      },
      create: data,
      update: data
    });

    res.status(201).json(createSuccess(attendance));
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/:id/attendance/from-signups", async (req, res, next) => {
  try {
    const event = await ensureAttendanceEditableEvent(req.params.id);
    const signups = await prisma.signup.findMany({
      where: {
        eventId: event.id,
        status: {
          in: [SignupStatus.Signed, SignupStatus.Standby]
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const attendance = [];

    for (const signup of signups) {
      const status =
        signup.status === SignupStatus.Standby
          ? AttendanceStatus.Standby
          : AttendanceStatus.Present;
      const item = await prisma.attendance.upsert({
        where: {
          eventId_memberId: {
            eventId: event.id,
            memberId: signup.memberId
          }
        },
        create: {
          eventId: event.id,
          memberId: signup.memberId,
          characterId: signup.characterId,
          signupId: signup.id,
          status
        },
        update: {
          characterId: signup.characterId,
          signupId: signup.id,
          status
        }
      });

      attendance.push(item);
    }

    res.status(201).json(createSuccess(attendance));
  } catch (error) {
    next(error);
  }
});

eventsRouter.get("/:id/attendance-summary", async (req, res, next) => {
  try {
    const summary = await buildAttendanceSummary(req.params.id);

    res.json(createSuccess(summary));
  } catch (error) {
    next(error);
  }
});
