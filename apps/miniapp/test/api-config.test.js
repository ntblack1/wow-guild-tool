const assert = require("node:assert/strict");
const { beforeEach, test } = require("node:test");

const storage = new Map();

global.wx = {
  envVersion: "develop",
  getStorageSync(key) {
    return storage.get(key);
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
  removeStorageSync(key) {
    storage.delete(key);
  }
};

const {
  API_BASE_URL_STORAGE_KEY,
  clearApiBaseUrl,
  getApiBaseUrlForEnv,
  getMiniappEnvVersion,
  getApiBaseUrl,
  getStoredApiBaseUrl,
  setApiBaseUrl
} = require("../utils/api-config");

beforeEach(() => {
  storage.clear();
  global.wx.envVersion = "develop";
  global.wx.getAccountInfoSync = () => ({
    miniProgram: {
      envVersion: global.wx.envVersion
    }
  });
});

test("uses configured API address when no runtime address is stored", () => {
  assert.equal(getStoredApiBaseUrl(), "");
  assert.equal(getApiBaseUrl(), "http://192.168.50.101:3000");
});

test("uses runtime API address from local storage first", () => {
  setApiBaseUrl("http://192.168.1.23:3000/");

  assert.equal(storage.get(API_BASE_URL_STORAGE_KEY), "http://192.168.1.23:3000");
  assert.equal(getStoredApiBaseUrl(), "http://192.168.1.23:3000");
  assert.equal(getApiBaseUrl(), "http://192.168.1.23:3000");
});

test("ignores runtime API address outside develop environment", () => {
  global.wx.envVersion = "trial";
  setApiBaseUrl("http://192.168.1.23:3000/");

  assert.equal(getStoredApiBaseUrl(), "");
  assert.equal(getApiBaseUrl(), "");
});

test("uses configured HTTPS API address for trial environment", () => {
  assert.equal(getApiBaseUrlForEnv("trial", {
    develop: "http://192.168.50.101:3000",
    trial: "https://api.example.com",
    release: "https://api.example.com"
  }), "https://api.example.com");
});

test("detects WeChat miniapp environment version", () => {
  global.wx.envVersion = "release";

  assert.equal(getMiniappEnvVersion(), "release");
});

test("ignores legacy localhost runtime API address after switching to lan default", () => {
  storage.set(API_BASE_URL_STORAGE_KEY, "http://127.0.0.1:3000");

  assert.equal(getStoredApiBaseUrl(), "");
  assert.equal(getApiBaseUrl(), "http://192.168.50.101:3000");
});

test("clears runtime API address back to configured default", () => {
  setApiBaseUrl("http://192.168.1.23:3000");
  clearApiBaseUrl();

  assert.equal(getStoredApiBaseUrl(), "");
  assert.equal(getApiBaseUrl(), "http://192.168.50.101:3000");
});
