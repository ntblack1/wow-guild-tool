const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const pagePath = path.resolve(__dirname, "../pages/event-detail/index.js");
const eventsServicePath = path.resolve(__dirname, "../services/events.js");

let capturedPage;

const loadEventDetailPage = () => {
  delete require.cache[pagePath];
  delete require.cache[eventsServicePath];

  require.cache[eventsServicePath] = {
    id: eventsServicePath,
    filename: eventsServicePath,
    loaded: true,
    exports: {
      getEvent: async () => ({
        id: "event_1",
        title: "测试开团",
        raidName: "烈焰熔炉",
        status: "signup_open",
        startTime: "2026-07-03T20:30:00.000Z",
        maxPlayers: 40,
        tankNeed: 2,
        healerNeed: 5,
        meleeNeed: 8,
        rangedNeed: 10,
        leader: { displayName: "团长" }
      }),
      getSignupSummary: async () => ({
        signedCount: 20,
        tankSigned: 1,
        healerSigned: 5,
        meleeSigned: 8,
        rangedSigned: 6
      }),
      listSignups: async () => []
    }
  };

  global.Page = (definition) => {
    capturedPage = {
      ...definition,
      data: JSON.parse(JSON.stringify(definition.data)),
      setData(update) {
        Object.assign(this.data, update);
      }
    };
  };

  require(pagePath);
  return capturedPage;
};

beforeEach(() => {
  capturedPage = null;
  global.wx = {
    showToast() {},
    navigateTo() {}
  };
});

test("adds raid artwork, progress, and role needs to event detail", async () => {
  const page = loadEventDetailPage();
  page.setData({ id: "event_1" });

  await page.loadDetail();

  assert.equal(page.data.event.artwork, "/assets/images/raid-forge.png");
  assert.equal(page.data.event.statusClass, "status-open");
  assert.equal(page.data.progress, 50);
  assert.deepEqual(page.data.roleNeeds[0], {
    key: "tank",
    label: "坦克",
    current: 1,
    need: 2,
    gap: 1,
    className: "role-tank"
  });
});
