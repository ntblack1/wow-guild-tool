const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const pagePath = path.resolve(__dirname, "../pages/index/index.js");
const apiServicePath = path.resolve(__dirname, "../services/api.js");
const eventsServicePath = path.resolve(__dirname, "../services/events.js");

let capturedPage;

const loadIndexPage = () => {
  delete require.cache[pagePath];
  delete require.cache[apiServicePath];
  delete require.cache[eventsServicePath];

  require.cache[apiServicePath] = {
    id: apiServicePath,
    filename: apiServicePath,
    loaded: true,
    exports: {
      health: async () => ({ status: "ok" })
    }
  };
  require.cache[eventsServicePath] = {
    id: eventsServicePath,
    filename: eventsServicePath,
    loaded: true,
    exports: {
      listEvents: async () => [
        {
          id: "event_1",
          title: "测试开团",
          raidName: "幽暗渊喉",
          status: "signup_open",
          startTime: "2026-07-03T20:30:00.000Z",
          maxPlayers: 40,
          signedCount: 20
        }
      ]
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
    showToast() {}
  };
});

test("adds theme presentation fields to homepage events", async () => {
  const page = loadIndexPage();

  await page.loadEvents();

  assert.equal(page.data.events[0].artwork, "/assets/images/raid-abyss.png");
  assert.equal(page.data.events[0].statusClass, "status-open");
  assert.equal(page.data.events[0].progress, 50);
});
