import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

const createLeader = async (displayName = "八块团长") =>
  prisma.member.create({
    data: {
      displayName
    }
  });

const validEventInput = (leaderId: string) => ({
  title: "周四开荒团",
  raidName: "熔火之心",
  startTime: "2026-08-01T12:00:00.000Z",
  maxPlayers: 40,
  tankNeed: 2,
  healerNeed: 8,
  meleeNeed: 15,
  rangedNeed: 15,
  leaderId,
  description: "准时集合，药剂自备"
});

describe("Guild event management API", () => {
  beforeEach(async () => {
    await prisma.signup.deleteMany();
    await prisma.guildEvent.deleteMany();
    await prisma.member.deleteMany();
  });

  it("creates a guild event", async () => {
    const leader = await createLeader();

    const response = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      title: "周四开荒团",
      raidName: "熔火之心",
      status: "draft",
      maxPlayers: 40,
      tankNeed: 2,
      healerNeed: 8,
      meleeNeed: 15,
      rangedNeed: 15,
      leaderId: leader.id
    });
  });

  it("rejects role needs greater than maxPlayers", async () => {
    const leader = await createLeader();

    const response = await request(app)
      .post("/events")
      .send({
        ...validEventInput(leader.id),
        maxPlayers: 10,
        tankNeed: 2,
        healerNeed: 3,
        meleeNeed: 4,
        rangedNeed: 5
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        message: "role needs cannot exceed maxPlayers",
        code: "EVENT_ROLE_NEEDS_EXCEED_MAX_PLAYERS"
      }
    });
  });

  it("rejects creating an event when leaderId does not exist", async () => {
    const response = await request(app)
      .post("/events")
      .send(validEventInput("missing-leader"))
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        message: "leaderId must reference an active member",
        code: "EVENT_LEADER_NOT_FOUND"
      }
    });
  });

  it("lists events by status and raidName with newest startTime first", async () => {
    const leader = await createLeader();
    const oldEvent = await request(app)
      .post("/events")
      .send({
        ...validEventInput(leader.id),
        title: "旧活动",
        raidName: "黑翼之巢",
        startTime: "2026-08-01T12:00:00.000Z"
      })
      .expect(201);
    const newEvent = await request(app)
      .post("/events")
      .send({
        ...validEventInput(leader.id),
        title: "新活动",
        raidName: "黑翼之巢",
        startTime: "2026-08-02T12:00:00.000Z"
      })
      .expect(201);
    await request(app).post(`/events/${oldEvent.body.data.id}/cancel`).expect(200);

    const response = await request(app)
      .get("/events")
      .query({ status: "draft", raidName: "黑翼" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.map((event: { id: string }) => event.id)).toEqual([
      newEvent.body.data.id
    ]);
  });

  it("updates event information before the event is finished", async () => {
    const leader = await createLeader();
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);

    const response = await request(app)
      .patch(`/events/${created.body.data.id}`)
      .send({
        title: "周五 farm 团",
        raidName: "黑翼之巢"
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      title: "周五 farm 团",
      raidName: "黑翼之巢"
    });
  });

  it("rejects core updates for finished events", async () => {
    const leader = await createLeader();
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);
    await prisma.guildEvent.update({
      where: { id: created.body.data.id },
      data: { status: "finished" }
    });

    const response = await request(app)
      .patch(`/events/${created.body.data.id}`)
      .send({
        title: "不能改名"
      })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: {
        message: "finished events cannot be modified",
        code: "EVENT_ALREADY_FINISHED"
      }
    });
  });

  it("opens signup for a draft event", async () => {
    const leader = await createLeader();
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);

    const response = await request(app).post(`/events/${created.body.data.id}/open-signup`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("signup_open");
  });

  it("locks signup for an open event", async () => {
    const leader = await createLeader();
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);
    await request(app).post(`/events/${created.body.data.id}/open-signup`).expect(200);

    const response = await request(app).post(`/events/${created.body.data.id}/lock`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("locked");
  });

  it("cancels an event", async () => {
    const leader = await createLeader();
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);

    const response = await request(app).post(`/events/${created.body.data.id}/cancel`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("cancelled");
  });

  it("returns event details with leader and signup statistics", async () => {
    const leader = await createLeader();
    const tank = await createLeader("一号坦克");
    const healer = await createLeader("治疗之光");
    const melee = await createLeader("近战小王");
    const ranged = await createLeader("远程炮台");
    const created = await request(app).post("/events").send(validEventInput(leader.id)).expect(201);

    await prisma.signup.createMany({
      data: [
        { eventId: created.body.data.id, memberId: tank.id, roleType: "tank" },
        { eventId: created.body.data.id, memberId: healer.id, roleType: "healer" },
        { eventId: created.body.data.id, memberId: melee.id, roleType: "melee" },
        { eventId: created.body.data.id, memberId: ranged.id, roleType: "ranged" }
      ]
    });

    const response = await request(app).get(`/events/${created.body.data.id}`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.leader).toMatchObject({
      id: leader.id,
      displayName: leader.displayName
    });
    expect(response.body.data.signupStats).toEqual({
      total: 4,
      byRole: {
        tank: 1,
        healer: 1,
        melee: 1,
        ranged: 1
      }
    });
  });
});
