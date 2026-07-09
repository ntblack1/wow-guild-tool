import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

describe("Member API", () => {
  beforeEach(async () => {
    await prisma.attendance.deleteMany();
    await prisma.signup.deleteMany();
    await prisma.character.deleteMany();
    await prisma.guildEvent.deleteMany();
    await prisma.member.deleteMany();
  });

  it("lists active members for miniapp member switching", async () => {
    const inactive = await prisma.member.create({
      data: {
        displayName: "Inactive Member",
        active: false
      }
    });
    const olderMember = await prisma.member.create({
      data: {
        displayName: "Older Member",
        guildName: "Older",
        role: "member",
        active: true
      }
    });
    const newerMember = await prisma.member.create({
      data: {
        displayName: "Newer Member",
        guildName: "Newer",
        role: "raid_leader",
        active: true
      }
    });

    const response = await request(app).get("/members").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.map((member: { id: string }) => member.id)).toEqual([
      olderMember.id,
      newerMember.id
    ]);
    expect(response.body.data).not.toContainEqual(expect.objectContaining({ id: inactive.id }));
    expect(response.body.data[0]).toMatchObject({
      displayName: "Older Member",
      guildName: "Older",
      role: "member",
      active: true
    });
  });

  it("returns member details with characters", async () => {
    const member = await prisma.member.create({
      data: {
        displayName: "小黑娃",
        guildName: "小黑娃",
        role: "member"
      }
    });
    await prisma.character.create({
      data: {
        memberId: member.id,
        name: "毁灭术",
        class: "WARLOCK",
        spec: "毁灭",
        roleType: "ranged",
        itemLevel: 245,
        isMain: true
      }
    });

    const response = await request(app).get(`/members/${member.id}`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: member.id,
      displayName: "小黑娃",
      guildName: "小黑娃",
      role: "member"
    });
    expect(response.body.data.characters).toHaveLength(1);
  });

  it("creates a character for a member", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });

    const response = await request(app)
      .post(`/members/${member.id}/characters`)
      .send({
        name: "毁灭术",
        className: "WARLOCK",
        spec: "毁灭",
        roleType: "ranged",
        itemLevel: 245,
        isMain: true
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      memberId: member.id,
      name: "毁灭术",
      class: "WARLOCK",
      className: "WARLOCK",
      spec: "毁灭",
      roleType: "ranged",
      itemLevel: 245,
      isMain: true
    });
  });

  it("updates a character", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });
    const character = await prisma.character.create({
      data: {
        memberId: member.id,
        name: "毁灭术",
        class: "WARLOCK",
        roleType: "ranged",
        itemLevel: 245
      }
    });

    const response = await request(app)
      .patch(`/members/${member.id}/characters/${character.id}`)
      .send({
        name: "痛苦术",
        className: "WARLOCK",
        spec: "痛苦",
        roleType: "ranged",
        itemLevel: 252
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: character.id,
      name: "痛苦术",
      className: "WARLOCK",
      spec: "痛苦",
      roleType: "ranged",
      itemLevel: 252
    });
  });

  it("sets a character as main", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });
    const oldMain = await prisma.character.create({
      data: { memberId: member.id, name: "毁灭术", class: "WARLOCK", isMain: true }
    });
    const newMain = await prisma.character.create({
      data: { memberId: member.id, name: "防骑", class: "PALADIN", isMain: false }
    });

    const response = await request(app)
      .post(`/members/${member.id}/characters/${newMain.id}/set-main`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ id: newMain.id, isMain: true });

    const characters = await prisma.character.findMany({
      where: { memberId: member.id },
      orderBy: { id: "asc" }
    });
    expect(characters.filter((item) => item.isMain)).toHaveLength(1);
    expect(characters.find((item) => item.id === oldMain.id)?.isMain).toBe(false);
  });

  it("deletes a character", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });
    const character = await prisma.character.create({
      data: { memberId: member.id, name: "毁灭术", class: "WARLOCK" }
    });

    const response = await request(app)
      .delete(`/members/${member.id}/characters/${character.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({ id: character.id });
    await expect(prisma.character.findUnique({ where: { id: character.id } })).resolves.toBeNull();
  });

  it("keeps only one main character per member", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });
    const first = await prisma.character.create({
      data: { memberId: member.id, name: "毁灭术", class: "WARLOCK", isMain: true }
    });

    await request(app)
      .post(`/members/${member.id}/characters`)
      .send({
        name: "防骑",
        className: "PALADIN",
        roleType: "tank",
        isMain: true
      })
      .expect(201);

    const characters = await prisma.character.findMany({ where: { memberId: member.id } });
    expect(characters.filter((item) => item.isMain)).toHaveLength(1);
    expect(characters.find((item) => item.id === first.id)?.isMain).toBe(false);
  });

  it("returns member signup records", async () => {
    const member = await prisma.member.create({ data: { displayName: "小黑娃" } });
    const leader = await prisma.member.create({ data: { displayName: "劳动人民" } });
    const character = await prisma.character.create({
      data: { memberId: member.id, name: "毁灭术", class: "WARLOCK" }
    });
    const event = await prisma.guildEvent.create({
      data: {
        title: "八块腹肌今晚开团",
        raidName: "奥杜尔 25人",
        startTime: new Date("2026-08-08T12:00:00.000Z"),
        maxPlayers: 25,
        tankNeed: 2,
        healerNeed: 5,
        meleeNeed: 8,
        rangedNeed: 10,
        leaderId: leader.id,
        status: "signup_open"
      }
    });
    await prisma.signup.create({
      data: {
        eventId: event.id,
        memberId: member.id,
        characterId: character.id,
        roleType: "ranged",
        status: "signed"
      }
    });

    const response = await request(app).get(`/members/${member.id}/signups`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].event.title).toBe("八块腹肌今晚开团");
  });
});
