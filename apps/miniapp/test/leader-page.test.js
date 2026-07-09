const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const pagePath = path.resolve(__dirname, "../pages/leader/index.js");
const eventsServicePath = path.resolve(__dirname, "../services/events.js");
const attendanceServicePath = path.resolve(__dirname, "../services/attendance.js");
const apiConfigPath = path.resolve(__dirname, "../utils/api-config.js");

let capturedPage;
let eventsResult;
let eventsError;
let toastMessages;

const loadLeaderPage = () => {
  delete require.cache[pagePath];
  delete require.cache[eventsServicePath];
  delete require.cache[attendanceServicePath];
  delete require.cache[apiConfigPath];

  require.cache[eventsServicePath] = {
    id: eventsServicePath,
    filename: eventsServicePath,
    loaded: true,
    exports: {
      createEvent: async () => ({}),
      listEvents: async () => {
        if (eventsError) {
          throw eventsError;
        }
        return eventsResult;
      },
      listSignups: async () => [],
      lockEvent: async () => ({}),
      openSignup: async () => ({})
    }
  };
  require.cache[attendanceServicePath] = {
    id: attendanceServicePath,
    filename: attendanceServicePath,
    loaded: true,
    exports: {
      generateAttendanceFromSignups: async () => [],
      getAttendanceSummary: async () => null,
      listAttendance: async () => [],
      updateAttendance: async () => ({})
    }
  };
  require.cache[apiConfigPath] = {
    id: apiConfigPath,
    filename: apiConfigPath,
    loaded: true,
    exports: {
      getApiBaseUrl: () => "http://127.0.0.1:3000"
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
  eventsResult = [
    {
      id: "event_1",
      title: "八块腹肌今晚开团",
      raidName: "奥杜尔 25人",
      status: "signup_open",
      startTime: "2026-08-08T12:00:00.000Z"
    }
  ];
  eventsError = null;
  toastMessages = [];
  global.wx = {
    showToast(options) {
      toastMessages.push(options.title);
    }
  };
});

test("leader page shows backend url and clears stale load errors after success", async () => {
  const page = loadLeaderPage();
  page.setData({ loadError: "旧错误" });

  await page.loadEvents();

  assert.equal(page.data.apiBaseUrl, "http://127.0.0.1:3000");
  assert.equal(page.data.loadError, "");
  assert.equal(page.data.events[0].title, "八块腹肌今晚开团");
  assert.equal(page.data.events[0].statusClass, "status-open");
});

test("leader page keeps backend load errors visible", async () => {
  eventsError = {
    message: "后端未连接：http://127.0.0.1:3000/events",
    code: "NETWORK_ERROR"
  };
  const page = loadLeaderPage();

  await page.loadEvents();

  assert.equal(page.data.loadError, "后端未连接：http://127.0.0.1:3000/events");
  assert.deepEqual(page.data.events, []);
  assert.equal(toastMessages.at(-1), "后端未连接：http://127.0.0.1:3000/events");
});
