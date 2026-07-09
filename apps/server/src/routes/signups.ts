import { Router } from "express";
import { createSuccess, SignupRole, SignupStatus } from "@wow-guild-tool/shared";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

export const signupsRouter = Router();

const signupStatuses = new Set<string>(Object.values(SignupStatus));
const signupRoles = new Set<string>(Object.values(SignupRole));

const findSignupOrThrow = async (id: string) => {
  const signup = await prisma.signup.findUnique({
    where: { id }
  });

  if (!signup) {
    throw new HttpError("Signup not found", 404, "SIGNUP_NOT_FOUND");
  }

  return signup;
};

const validateStatus = (status: unknown) => {
  if (status === undefined) {
    return undefined;
  }

  if (typeof status !== "string" || !signupStatuses.has(status)) {
    throw new HttpError("status is invalid", 400, "INVALID_SIGNUP_STATUS");
  }

  return status;
};

const validateRoleType = (roleType: unknown) => {
  if (roleType === undefined) {
    return undefined;
  }

  if (typeof roleType !== "string" || !signupRoles.has(roleType)) {
    throw new HttpError("roleType is invalid", 400, "INVALID_SIGNUP_ROLE_TYPE");
  }

  return roleType;
};

const validateCharacterOwnership = async (memberId: string, characterId: unknown) => {
  if (characterId === undefined) {
    return undefined;
  }

  if (typeof characterId !== "string") {
    throw new HttpError("characterId is invalid", 400, "SIGNUP_CHARACTER_NOT_OWNED");
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

  return characterId;
};

signupsRouter.patch("/:id", async (req, res, next) => {
  try {
    const currentSignup = await findSignupOrThrow(req.params.id);
    const status = validateStatus(req.body.status);
    const roleType = validateRoleType(req.body.roleType);
    const characterId = await validateCharacterOwnership(currentSignup.memberId, req.body.characterId);

    const signup = await prisma.signup.update({
      where: { id: currentSignup.id },
      data: {
        ...(characterId !== undefined ? { characterId } : {}),
        ...(roleType !== undefined ? { roleType } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(req.body.note !== undefined ? { note: req.body.note } : {})
      }
    });

    res.json(createSuccess(signup));
  } catch (error) {
    next(error);
  }
});

signupsRouter.delete("/:id", async (req, res, next) => {
  try {
    await findSignupOrThrow(req.params.id);

    const signup = await prisma.signup.update({
      where: { id: req.params.id },
      data: {
        status: SignupStatus.Cancelled
      }
    });

    res.json(createSuccess(signup));
  } catch (error) {
    next(error);
  }
});
