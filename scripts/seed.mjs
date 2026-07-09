import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ids = {
  leader: "seed_member_laodongrenmin",
  xiaohei: "seed_member_xiaoheiwa",
  meipin: "seed_member_meipinxiaoqian",
  leaderCharacter: "seed_character_laodongrenmin_warrior",
  xiaoheiCharacter: "seed_character_xiaoheiwa_warlock",
  meipinCharacter: "seed_character_meipinxiaoqian_paladin",
  event: "seed_event_ulduar_25"
};

const members = [
  {
    id: ids.leader,
    displayName: "劳动人民",
    guildName: "劳动人民",
    role: "raid_leader"
  },
  {
    id: ids.xiaohei,
    displayName: "小黑蛙",
    guildName: "小黑蛙",
    role: "member"
  },
  {
    id: ids.meipin,
    displayName: "眉贫笑浅",
    guildName: "眉贫笑浅",
    role: "member"
  }
];

const characters = [
  {
    id: ids.leaderCharacter,
    memberId: ids.leader,
    name: "战士",
    class: "WARRIOR",
    realm: "八块腹肌",
    spec: "武器",
    roleType: "melee",
    itemLevel: 245,
    isMain: true
  },
  {
    id: ids.xiaoheiCharacter,
    memberId: ids.xiaohei,
    name: "毁灭术",
    class: "WARLOCK",
    realm: "八块腹肌",
    spec: "毁灭",
    roleType: "ranged",
    itemLevel: 245,
    isMain: true
  },
  {
    id: ids.meipinCharacter,
    memberId: ids.meipin,
    name: "防骑",
    class: "PALADIN",
    realm: "八块腹肌",
    spec: "防护",
    roleType: "tank",
    itemLevel: 245,
    isMain: true
  }
];

const main = async () => {
  await prisma.attendance.deleteMany({
    where: {
      OR: [
        { member: { displayName: { in: ["出勤成员", "迟到成员", "缺席成员", "候补成员"] } } },
        { event: { title: { in: ["周四活动"] } } }
      ]
    }
  });

  await prisma.signup.deleteMany({
    where: {
      OR: [
        { member: { displayName: { in: ["出勤成员", "迟到成员", "缺席成员", "候补成员"] } } },
        { event: { title: { in: ["周四活动"] } } }
      ]
    }
  });

  await prisma.guildEvent.deleteMany({
    where: {
      title: {
        in: ["周四活动"]
      }
    }
  });

  await prisma.character.deleteMany({
    where: {
      member: {
        displayName: {
          in: ["八块团长", "出勤成员", "迟到成员", "缺席成员", "候补成员"]
        }
      }
    }
  });

  await prisma.member.deleteMany({
    where: {
      displayName: {
        in: ["八块团长", "出勤成员", "迟到成员", "缺席成员", "候补成员"]
      }
    }
  });

  await prisma.attendance.deleteMany({
    where: {
      eventId: ids.event
    }
  });

  await prisma.signup.deleteMany({
    where: {
      eventId: ids.event
    }
  });

  for (const member of members) {
    await prisma.member.upsert({
      where: { id: member.id },
      update: {
        displayName: member.displayName,
        guildName: member.guildName,
        role: member.role,
        active: true
      },
      create: {
        ...member,
        active: true
      }
    });
  }

  for (const character of characters) {
    await prisma.character.upsert({
      where: { id: character.id },
      update: character,
      create: character
    });
  }

  await prisma.guildEvent.upsert({
    where: { id: ids.event },
    update: {
      title: "八块腹肌今晚开团",
      raidName: "奥杜尔 25人",
      status: "signup_open",
      startTime: new Date("2026-08-08T12:00:00.000Z"),
      maxPlayers: 25,
      tankNeed: 2,
      healerNeed: 5,
      meleeNeed: 8,
      rangedNeed: 10,
      leaderId: ids.leader,
      description: "测试数据：今晚 20:00 集合，提前准备合剂和食物。"
    },
    create: {
      id: ids.event,
      title: "八块腹肌今晚开团",
      raidName: "奥杜尔 25人",
      status: "signup_open",
      startTime: new Date("2026-08-08T12:00:00.000Z"),
      maxPlayers: 25,
      tankNeed: 2,
      healerNeed: 5,
      meleeNeed: 8,
      rangedNeed: 10,
      leaderId: ids.leader,
      description: "测试数据：今晚 20:00 集合，提前准备合剂和食物。"
    }
  });

  console.log("Seed data ready.");
  console.log(`CURRENT_MEMBER_ID=${ids.xiaohei}`);
  console.log(`LEADER_ID=${ids.leader}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
