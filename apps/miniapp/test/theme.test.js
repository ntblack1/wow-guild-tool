const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  buildRoleNeeds,
  characterAvatar,
  eventArtwork,
  eventProgress,
  roleClass,
  statusClass
} = require("../utils/theme");

test("maps role types to stable visual classes", () => {
  assert.equal(roleClass("tank"), "role-tank");
  assert.equal(roleClass("healer"), "role-healer");
  assert.equal(roleClass("melee"), "role-melee");
  assert.equal(roleClass("ranged"), "role-ranged");
  assert.equal(roleClass("unknown"), "role-ranged");
});

test("maps event statuses to stable badge classes", () => {
  assert.equal(statusClass("signup_open"), "status-open");
  assert.equal(statusClass("signup_locked"), "status-locked");
  assert.equal(statusClass("locked"), "status-locked");
  assert.equal(statusClass("finished"), "status-finished");
  assert.equal(statusClass("draft"), "status-draft");
});

test("chooses deterministic raid artwork from raid name", () => {
  assert.equal(eventArtwork({ raidName: "幽暗渊喉" }), "/assets/images/raid-abyss.png");
  assert.equal(eventArtwork({ raidName: "烈焰熔炉" }), "/assets/images/raid-forge.png");
  assert.equal(eventArtwork({ raidName: "风暴王座" }), "/assets/images/raid-storm.png");
  assert.equal(eventArtwork({ raidName: "未知副本" }), "/assets/images/raid-abyss.png");
});

test("calculates capped signup progress percentage", () => {
  assert.equal(eventProgress({ signedCount: 20, maxPlayers: 40 }), 50);
  assert.equal(eventProgress({ signedCount: 60, maxPlayers: 40 }), 100);
  assert.equal(eventProgress({ signedCount: 3, maxPlayers: 0 }), 0);
});

test("builds role need summary for event detail", () => {
  const needs = buildRoleNeeds(
    {
      tankNeed: 2,
      healerNeed: 5,
      meleeNeed: 8,
      rangedNeed: 10
    },
    {
      tankSigned: 1,
      healerSigned: 5,
      meleeSigned: 6,
      rangedSigned: 11
    }
  );

  assert.deepEqual(needs, [
    { key: "tank", label: "坦克", current: 1, need: 2, gap: 1, className: "role-tank" },
    { key: "healer", label: "治疗", current: 5, need: 5, gap: 0, className: "role-healer" },
    { key: "melee", label: "近战", current: 6, need: 8, gap: 2, className: "role-melee" },
    { key: "ranged", label: "远程", current: 11, need: 10, gap: 0, className: "role-ranged" }
  ]);
});

test("maps character role to project avatar artwork", () => {
  assert.equal(characterAvatar({ roleType: "tank" }), "/assets/images/chibi-tank.png");
  assert.equal(characterAvatar({ roleType: "healer" }), "/assets/images/chibi-healer.png");
  assert.equal(characterAvatar({ roleType: "melee" }), "/assets/images/chibi-dps.png");
  assert.equal(characterAvatar({ roleType: "ranged" }), "/assets/images/chibi-dps.png");
});
