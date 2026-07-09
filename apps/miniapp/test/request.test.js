const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const requestPath = path.resolve(__dirname, "../utils/request.js");
const apiConfigPath = path.resolve(__dirname, "../utils/api-config.js");

const loadRequest = () => {
  delete require.cache[requestPath];
  delete require.cache[apiConfigPath];
  return require(requestPath);
};

beforeEach(() => {
  global.wx = {
    getStorageSync() {
      return "";
    },
    request(options) {
      options.fail({ errMsg: "connect failed" });
    }
  };
});

test("network errors include the concrete backend url", async () => {
  const { request } = loadRequest();

  await assert.rejects(
    request({ path: "/events" }),
    (error) => {
      assert.equal(error.code, "NETWORK_ERROR");
      assert.match(error.message, /http:\/\/192\.168\.50\.101:3000\/events/);
      assert.match(error.message, /connect failed/);
      return true;
    }
  );
});

test("rejects before request when backend url is not configured", async () => {
  global.wx.getAccountInfoSync = () => ({
    miniProgram: {
      envVersion: "trial"
    }
  });
  let requested = false;
  global.wx.request = () => {
    requested = true;
  };
  const { request } = loadRequest();

  await assert.rejects(
    request({ path: "/events" }),
    (error) => {
      assert.equal(error.code, "API_BASE_URL_NOT_CONFIGURED");
      assert.equal(requested, false);
      return true;
    }
  );
});
