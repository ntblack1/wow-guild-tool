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

const createEvent = async (status = "locked") => {
  const leader = await createMember("八块团长");

  return prisma.guildEvent.create({
    data: {
      title: "周四活动",
      raidName: "熔火之心",
      startTime: new Date("2026-08-01T12:00:00.000Z"),
      maxPlayers: 40,
      tankNeed: 2,
      healerNeed: 8,
      meleeNeed: 15,
      rangedNeed: 15,
      leaderId: leader.id,
      status
    }
  });
};

const createSignup = async (
  eventId: string,
  memberName: string,
  status: "signed" | "standby" | "leave" = "signed"
) => {
  const member = await createMember(memberName);
  const character = await createCharacter(member.id, `${memberName}角色`);
  const signup = await prisma.signup.create({
    data: {
      eventId,
      memberId: member.id,
      characterId: character.id,
      status,
      roleType: "tank"
    }
  });

  return { member, character, signup };
};

describe("Activity attendance API", () => {
  beforeEach(async () => {
    await prisma.attendance.deleteMany();
    await prisma.signup.deleteMany();
    await prisma.character.deleteMany();
    await prisma.guildEvent.deleteMany();
    await prisma.member.deleteMany();
  });

  it("generates attendance from signups", async () => {
    const event = await createEvent("locked");
    const signed = await createSignup(event.id, "正式成员", "signed");
    const standby = await createSignup(event.id, "候补成员", "standby");
    await createSignup(event.id, "请假成员", "leave");

    const response = await request(app)
      .post(`/events/${event.id}/attendance/from-signups`)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: signed.member.id,
          characterId: signed.character.id,
          signupId: signed.signup.id,
          status: "present"
        }),
        expect.objectContaining({
          memberId: standby.member.id,
          characterId: standby.character.id,
          signupId: standby.signup.id,
          status: "standby"
        })
      ])
    );
  });

  it("rejects generating attendance for draft events", async () => {
    const event = await createEvent("draft");
    await createSignup(event.id, "正式成员", "signed");

    const response = await request(app)
      .post(`/events/${event.id}/attendance/from-signups`)
      .expect(400);

    expect(response.body.error.code).toBe("EVENT_ATTENDANCE_NOT_ALLOWED");
  });

  it("allows locked events to generate attendance", async () => {
    const event = await createEvent("locked");
    await createSignup(event.id, "正式成员", "signed");

    const response = await request(app)
      .post(`/events/${event.id}/attendance/from-signups`)
      .expect(201);

    expect(response.body.data[0].status).toBe("present");
  });

  it("updates attendance status", async () => {
    const event = await createEvent("in_progress");
    const { member, character } = await createSignup(event.id, "迟到成员", "signed");
    const attendance = await prisma.attendance.create({
      data: {
        eventId: event.id,
        memberId: member.id,
        characterId: character.id,
        status: "present"
      }
    });

    const response = await request(app)
      .patch(`/attendance/${attendance.id}`)
      .send({
        status: "late",
        note: "晚到十分钟"
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: attendance.id,
      status: "late",
      note: "晚到十分钟"
    });
  });

  it("does not create duplicate attendance when generating from signups twice", async () => {
    const event = await createEvent("locked");
    await createSignup(event.id, "正式成员", "signed");

    await request(app).post(`/events/${event.id}/attendance/from-signups`).expect(201);
    await request(app).post(`/events/${event.id}/attendance/from-signups`).expect(201);

    const count = await prisma.attendance.count({
      where: { eventId: event.id }
    });
    expect(count).toBe(1);
  });

  it("allows manually adding attendance for a member without signup", async () => {
    const event = await createEvent("in_progress");
    const member = await createMember("空降成员");
    const character = await createCharacter(member.id, "空降角色");

    const response = await request(app)
      .post(`/events/${event.id}/attendance`)
      .send({
        memberId: member.id,
        characterId: character.id,
        status: "present",
        note: "未报名，现场补进团"
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      eventId: event.id,
      memberId: member.id,
      characterId: character.id,
      signupId: null,
      status: "present",
      note: "未报名，现场补进团"
    });
  });

  it("returns attendance summary", async () => {
    const event = await createEvent("in_progress");
    const present = await createSignup(event.id, "出勤成员", "signed");
    const late = await createSignup(event.id, "迟到成员", "signed");
    const absent = await createSignup(event.id, "缺席成员", "signed");
    const standby = await createSignup(event.id, "候补成员", "standby");

    await prisma.attendance.createMany({
      data: [
        {
          eventId: event.id,
          memberId: present.member.id,
          characterId: present.character.id,
          status: "present"
        },
        {
          eventId: event.id,
          memberId: late.member.id,
          characterId: late.character.id,
          status: "late"
        },
        {
          eventId: event.id,
          memberId: absent.member.id,
          characterId: absent.character.id,
          status: "absent"
        },
        {
          eventId: event.id,
          memberId: standby.member.id,
          characterId: standby.character.id,
          status: "standby"
        }
      ]
    });

    const response = await request(app)
      .get(`/events/${event.id}/attendance-summary`)
      .expect(200);

    expect(response.body.data).toEqual({
      presentCount: 1,
      lateCount: 1,
      absentCount: 1,
      standbyCount: 1,
      totalAttendanceCount: 4
    });
  });
});
