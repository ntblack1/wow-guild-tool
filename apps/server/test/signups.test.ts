import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

const createMember = async (displayName: string, active = true) =>
  prisma.member.create({
    data: {
      displayName,
      active
    }
  });

const createCharacter = async (memberId: string, name: string) =>
  prisma.character.create({
    data: {
      memberId,
      name,
      class: "WARRIOR",
      realm: "八块腹肌"
    }
  });

const createEvent = async (status = "signup_open", maxPlayers = 40) => {
  const leader = await createMember("八块团长");
  return prisma.guildEvent.create({
    data: {
      title: "周四活动",
      raidName: "熔火之心",
      startTime: new Date("2026-08-01T12:00:00.000Z"),
      maxPlayers,
      tankNeed: 2,
      healerNeed: 8,
      meleeNeed: 15,
      rangedNeed: 15,
      leaderId: leader.id,
      status
    }
  });
};

describe("Activity signup API", () => {
  beforeEach(async () => {
    await prisma.signup.deleteMany();
    await prisma.character.deleteMany();
    await prisma.guildEvent.deleteMany();
    await prisma.member.deleteMany();
  });

  it("allows a member to sign up for an open event with their character", async () => {
    const event = await createEvent();
    const member = await createMember("报名成员");
    const character = await createCharacter(member.id, "战士一号");

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank",
        status: "signed",
        note: "可以开荒"
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      eventId: event.id,
      memberId: member.id,
      characterId: character.id,
      roleType: "tank",
      status: "signed",
      note: "可以开荒"
    });
  });

  it("rejects signups for draft events", async () => {
    const event = await createEvent("draft");
    const member = await createMember("报名成员");
    const character = await createCharacter(member.id, "战士一号");

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(400);

    expect(response.body.error.code).toBe("EVENT_SIGNUP_NOT_OPEN");
  });

  it("rejects signups for locked events", async () => {
    const event = await createEvent("locked");
    const member = await createMember("报名成员");
    const character = await createCharacter(member.id, "战士一号");

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(400);

    expect(response.body.error.code).toBe("EVENT_SIGNUP_NOT_OPEN");
  });

  it("rejects signups when member does not exist", async () => {
    const event = await createEvent();

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: "missing-member",
        characterId: "missing-character",
        roleType: "tank"
      })
      .expect(400);

    expect(response.body.error.code).toBe("SIGNUP_MEMBER_NOT_FOUND");
  });

  it("rejects signups when character does not belong to member", async () => {
    const event = await createEvent();
    const member = await createMember("报名成员");
    const otherMember = await createMember("另一个成员");
    const character = await createCharacter(otherMember.id, "别人的角色");

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(400);

    expect(response.body.error.code).toBe("SIGNUP_CHARACTER_NOT_OWNED");
  });

  it("rejects duplicate active signups for the same member and event", async () => {
    const event = await createEvent();
    const member = await createMember("报名成员");
    const character = await createCharacter(member.id, "战士一号");

    await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(201);

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(409);

    expect(response.body.error.code).toBe("SIGNUP_ALREADY_EXISTS");
  });

  it("puts new signups into standby when signed players reach maxPlayers", async () => {
    const event = await createEvent("signup_open", 1);
    const firstMember = await createMember("一号成员");
    const firstCharacter = await createCharacter(firstMember.id, "一号角色");
    const secondMember = await createMember("二号成员");
    const secondCharacter = await createCharacter(secondMember.id, "二号角色");

    await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: firstMember.id,
        characterId: firstCharacter.id,
        roleType: "tank",
        status: "signed"
      })
      .expect(201);

    const response = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: secondMember.id,
        characterId: secondCharacter.id,
        roleType: "healer",
        status: "signed"
      })
      .expect(201);

    expect(response.body.data.status).toBe("standby");
  });

  it("returns signup summary with counts and role gaps", async () => {
    const event = await createEvent("signup_open", 3);
    const tank = await createMember("坦克");
    const healer = await createMember("治疗");
    const standby = await createMember("替补");
    const leave = await createMember("请假");
    const cancelled = await createMember("取消");

    await prisma.signup.createMany({
      data: [
        { eventId: event.id, memberId: tank.id, status: "signed", roleType: "tank" },
        { eventId: event.id, memberId: healer.id, status: "signed", roleType: "healer" },
        { eventId: event.id, memberId: standby.id, status: "standby", roleType: "melee" },
        { eventId: event.id, memberId: leave.id, status: "leave", roleType: "ranged" },
        { eventId: event.id, memberId: cancelled.id, status: "cancelled", roleType: "ranged" }
      ]
    });

    const response = await request(app).get(`/events/${event.id}/signup-summary`).expect(200);

    expect(response.body.data).toMatchObject({
      maxPlayers: 3,
      signedCount: 2,
      standbyCount: 1,
      leaveCount: 1,
      cancelledCount: 1,
      tankSigned: 1,
      healerSigned: 1,
      meleeSigned: 0,
      rangedSigned: 0,
      tankNeed: 2,
      healerNeed: 8,
      meleeNeed: 15,
      rangedNeed: 15,
      tankGap: 1,
      healerGap: 7,
      meleeGap: 15,
      rangedGap: 15
    });
  });

  it("cancels a signup without deleting it", async () => {
    const event = await createEvent();
    const member = await createMember("报名成员");
    const character = await createCharacter(member.id, "战士一号");
    const created = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: member.id,
        characterId: character.id,
        roleType: "tank"
      })
      .expect(201);

    const response = await request(app).delete(`/signups/${created.body.data.id}`).expect(200);

    expect(response.body.data.status).toBe("cancelled");

    const stored = await prisma.signup.findUnique({
      where: { id: created.body.data.id }
    });
    expect(stored?.status).toBe("cancelled");
  });
});
