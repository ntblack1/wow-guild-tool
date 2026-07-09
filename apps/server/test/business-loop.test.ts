import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

const expectSuccess = <T = unknown>(body: { success: boolean; data: T }) => {
  expect(body.success).toBe(true);
  expect(body.data).toBeDefined();
  return body.data;
};

const createMemberWithCharacter = async (displayName: string, characterName: string) => {
  const member = await prisma.member.create({
    data: {
      displayName,
      active: true
    }
  });
  const character = await prisma.character.create({
    data: {
      memberId: member.id,
      name: characterName,
      class: "WARRIOR",
      realm: "八块腹肌",
      isMain: true
    }
  });

  return { member, character };
};

describe("Member-character-event-signup-attendance business loop", () => {
  beforeEach(async () => {
    await prisma.attendance.deleteMany();
    await prisma.signup.deleteMany();
    await prisma.character.deleteMany();
    await prisma.guildEvent.deleteMany();
    await prisma.member.deleteMany();
  });

  it("runs the first business loop through activity signup and attendance APIs", async () => {
    const leader = await createMemberWithCharacter("八块团长", "团长战士");
    const firstMember = await createMemberWithCharacter("腹肌一号", "一号坦克");
    const secondMember = await createMemberWithCharacter("腹肌二号", "二号治疗");

    const createdEventResponse = await request(app)
      .post("/events")
      .send({
        title: "闭环验收活动",
        raidName: "熔火之心",
        startTime: "2026-08-08T12:00:00.000Z",
        maxPlayers: 10,
        tankNeed: 1,
        healerNeed: 1,
        meleeNeed: 4,
        rangedNeed: 4,
        leaderId: leader.member.id,
        description: "T010 闭环验收"
      })
      .expect(201);
    const event = expectSuccess<{ id: string; status: string }>(createdEventResponse.body);
    expect(event.status).toBe("draft");

    const openSignupResponse = await request(app)
      .post(`/events/${event.id}/open-signup`)
      .expect(200);
    expectSuccess<{ status: string }>(openSignupResponse.body);
    expect(openSignupResponse.body.data.status).toBe("signup_open");

    const firstSignupResponse = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: firstMember.member.id,
        characterId: firstMember.character.id,
        roleType: "tank",
        status: "signed",
        note: "主坦"
      })
      .expect(201);
    const firstSignup = expectSuccess<{ id: string; status: string; roleType: string }>(
      firstSignupResponse.body
    );
    expect(firstSignup).toMatchObject({ status: "signed", roleType: "tank" });

    const secondSignupResponse = await request(app)
      .post(`/events/${event.id}/signups`)
      .send({
        memberId: secondMember.member.id,
        characterId: secondMember.character.id,
        roleType: "healer",
        status: "signed",
        note: "治疗"
      })
      .expect(201);
    const secondSignup = expectSuccess<{ id: string; status: string; roleType: string }>(
      secondSignupResponse.body
    );
    expect(secondSignup).toMatchObject({ status: "signed", roleType: "healer" });

    const signupListResponse = await request(app).get(`/events/${event.id}/signups`).expect(200);
    const signupList = expectSuccess<
      Array<{
        id: string;
        member: { id: string; displayName: string };
        character: { id: string; name: string };
      }>
    >(signupListResponse.body);
    expect(signupList).toHaveLength(2);
    expect(signupList.map((signup) => signup.member.displayName).sort()).toEqual([
      "腹肌一号",
      "腹肌二号"
    ]);
    expect(signupList.every((signup) => signup.character?.id)).toBe(true);

    const signupSummaryResponse = await request(app)
      .get(`/events/${event.id}/signup-summary`)
      .expect(200);
    const signupSummary = expectSuccess<{
      signedCount: number;
      tankSigned: number;
      healerSigned: number;
      tankGap: number;
      healerGap: number;
    }>(signupSummaryResponse.body);
    expect(signupSummary).toMatchObject({
      signedCount: 2,
      tankSigned: 1,
      healerSigned: 1,
      tankGap: 0,
      healerGap: 0
    });

    const lockResponse = await request(app).post(`/events/${event.id}/lock`).expect(200);
    expectSuccess<{ status: string }>(lockResponse.body);
    expect(lockResponse.body.data.status).toBe("locked");

    const generatedAttendanceResponse = await request(app)
      .post(`/events/${event.id}/attendance/from-signups`)
      .expect(201);
    const generatedAttendance = expectSuccess<
      Array<{ id: string; memberId: string; signupId: string; status: string }>
    >(generatedAttendanceResponse.body);
    expect(generatedAttendance).toHaveLength(2);
    expect(generatedAttendance.every((attendance) => attendance.status === "present")).toBe(true);
    expect(generatedAttendance.map((attendance) => attendance.signupId).sort()).toEqual(
      [firstSignup.id, secondSignup.id].sort()
    );

    const lateAttendance = generatedAttendance.find(
      (attendance) => attendance.memberId === secondMember.member.id
    );
    expect(lateAttendance).toBeDefined();

    const updatedAttendanceResponse = await request(app)
      .patch(`/attendance/${lateAttendance?.id}`)
      .send({
        status: "late",
        note: "晚到十分钟"
      })
      .expect(200);
    expectSuccess<{ status: string; note: string }>(updatedAttendanceResponse.body);
    expect(updatedAttendanceResponse.body.data).toMatchObject({
      status: "late",
      note: "晚到十分钟"
    });

    const attendanceListResponse = await request(app)
      .get(`/events/${event.id}/attendance`)
      .expect(200);
    const attendanceList = expectSuccess<
      Array<{
        status: string;
        member: { id: string; displayName: string };
        character: { id: string; name: string };
      }>
    >(attendanceListResponse.body);
    expect(attendanceList).toHaveLength(2);
    expect(attendanceList.map((attendance) => attendance.status).sort()).toEqual([
      "late",
      "present"
    ]);
    expect(attendanceList.every((attendance) => attendance.member?.id)).toBe(true);
    expect(attendanceList.every((attendance) => attendance.character?.id)).toBe(true);

    const attendanceSummaryResponse = await request(app)
      .get(`/events/${event.id}/attendance-summary`)
      .expect(200);
    const attendanceSummary = expectSuccess<{
      presentCount: number;
      lateCount: number;
      absentCount: number;
      standbyCount: number;
      totalAttendanceCount: number;
    }>(attendanceSummaryResponse.body);
    expect(attendanceSummary).toEqual({
      presentCount: 1,
      lateCount: 1,
      absentCount: 0,
      standbyCount: 0,
      totalAttendanceCount: 2
    });
  });
});
