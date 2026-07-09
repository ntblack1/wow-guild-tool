import { Router } from "express";
import { createSuccess, SignupRole } from "@wow-guild-tool/shared";

import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

export const membersRouter = Router();

type CharacterInput = {
  name?: string;
  className?: string;
  spec?: string | null;
  roleType?: string | null;
  itemLevel?: number | null;
  isMain?: boolean;
};

const signupRoles = new Set<string>(Object.values(SignupRole));

const serializeCharacter = <T extends { class: string }>(character: T) => ({
  ...character,
  className: character.class
});

const findMemberOrThrow = async (memberId: string) => {
  const member = await prisma.member.findUnique({
    where: { id: memberId }
  });

  if (!member) {
    throw new HttpError("Member not found", 404, "MEMBER_NOT_FOUND");
  }

  return member;
};

const findMemberCharacterOrThrow = async (memberId: string, characterId: string) => {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      memberId
    }
  });

  if (!character) {
    throw new HttpError("Character not found", 404, "CHARACTER_NOT_FOUND");
  }

  return character;
};

const validateCharacterInput = (input: CharacterInput, current?: CharacterInput) => {
  const name = (input.name ?? current?.name)?.trim();
  const className = (input.className ?? current?.className)?.trim();
  const spec = input.spec ?? current?.spec ?? undefined;
  const roleType = input.roleType ?? current?.roleType ?? undefined;
  const itemLevel = input.itemLevel ?? current?.itemLevel ?? null;
  const isMain = input.isMain ?? current?.isMain ?? false;

  if (!name) {
    throw new HttpError("name is required", 400, "INVALID_CHARACTER_INPUT");
  }

  if (!className) {
    throw new HttpError("className is required", 400, "INVALID_CHARACTER_CLASS");
  }

  if (roleType !== undefined && roleType !== "" && !signupRoles.has(roleType)) {
    throw new HttpError("roleType is invalid", 400, "INVALID_CHARACTER_ROLE_TYPE");
  }

  if (
    itemLevel !== null &&
    itemLevel !== undefined &&
    (!Number.isInteger(itemLevel) || Number(itemLevel) < 0)
  ) {
    throw new HttpError("itemLevel must be a non-negative integer", 400, "INVALID_CHARACTER_ITEM_LEVEL");
  }

  return {
    name,
    class: className,
    spec: spec?.trim() || null,
    roleType: roleType || null,
    itemLevel: itemLevel && itemLevel > 0 ? itemLevel : null,
    isMain
  };
};

const unsetOtherMainCharacters = async (memberId: string, characterId?: string) => {
  await prisma.character.updateMany({
    where: {
      memberId,
      ...(characterId ? { id: { not: characterId } } : {})
    },
    data: {
      isMain: false
    }
  });
};

membersRouter.get("/", async (_req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: {
        active: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    res.json(createSuccess(members));
  } catch (error) {
    next(error);
  }
});

membersRouter.get("/:id", async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        characters: {
          orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
        }
      }
    });

    if (!member) {
      throw new HttpError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    res.json(createSuccess(member));
  } catch (error) {
    next(error);
  }
});

membersRouter.get("/:id/characters", async (req, res, next) => {
  try {
    await findMemberOrThrow(req.params.id);

    const characters = await prisma.character.findMany({
      where: { memberId: req.params.id },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }]
    });

    res.json(createSuccess(characters.map(serializeCharacter)));
  } catch (error) {
    next(error);
  }
});

membersRouter.post("/:id/characters", async (req, res, next) => {
  try {
    await findMemberOrThrow(req.params.id);
    const input = validateCharacterInput(req.body as CharacterInput);

    if (input.isMain) {
      await unsetOtherMainCharacters(req.params.id);
    }

    const character = await prisma.character.create({
      data: {
        ...input,
        memberId: req.params.id
      }
    });

    res.status(201).json(createSuccess(serializeCharacter(character)));
  } catch (error) {
    next(error);
  }
});

membersRouter.patch("/:id/characters/:characterId", async (req, res, next) => {
  try {
    const current = await findMemberCharacterOrThrow(req.params.id, req.params.characterId);
    const input = validateCharacterInput(req.body as CharacterInput, {
      ...current,
      className: current.class
    });

    if (input.isMain) {
      await unsetOtherMainCharacters(req.params.id, current.id);
    }

    const character = await prisma.character.update({
      where: { id: current.id },
      data: input
    });

    res.json(createSuccess(serializeCharacter(character)));
  } catch (error) {
    next(error);
  }
});

membersRouter.post("/:id/characters/:characterId/set-main", async (req, res, next) => {
  try {
    const current = await findMemberCharacterOrThrow(req.params.id, req.params.characterId);
    await unsetOtherMainCharacters(req.params.id, current.id);

    const character = await prisma.character.update({
      where: { id: current.id },
      data: {
        isMain: true
      }
    });

    res.json(createSuccess(serializeCharacter(character)));
  } catch (error) {
    next(error);
  }
});

membersRouter.delete("/:id/characters/:characterId", async (req, res, next) => {
  try {
    const current = await findMemberCharacterOrThrow(req.params.id, req.params.characterId);
    const character = await prisma.character.delete({
      where: { id: current.id }
    });

    res.json(createSuccess(serializeCharacter(character)));
  } catch (error) {
    next(error);
  }
});

membersRouter.get("/:id/signups", async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id }
    });

    if (!member) {
      throw new HttpError("Member not found", 404, "MEMBER_NOT_FOUND");
    }

    const signups = await prisma.signup.findMany({
      where: { memberId: req.params.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: true,
        character: true
      }
    });

    res.json(createSuccess(signups));
  } catch (error) {
    next(error);
  }
});
