const assert = require("node:assert/strict");
const { beforeEach, test } = require("node:test");

const storage = new Map();

global.wx = {
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
  clearCurrentMemberId,
  getCurrentMemberId,
  getSelectedMemberId,
  setCurrentMemberId
} = require("../utils/current-member");

beforeEach(() => {
  storage.clear();
});

test("uses configured default member only as fallback", () => {
  assert.equal(getSelectedMemberId(), "");
  assert.equal(getCurrentMemberId(), "seed_member_xiaoheiwa");
});

test("stores and reads selected member id from local storage first", () => {
  setCurrentMemberId("seed_member_meipinxiaoqian");

  assert.equal(getSelectedMemberId(), "seed_member_meipinxiaoqian");
  assert.equal(getCurrentMemberId(), "seed_member_meipinxiaoqian");
});

test("clears selected member id without deleting the configured fallback", () => {
  setCurrentMemberId("seed_member_meipinxiaoqian");
  clearCurrentMemberId();

  assert.equal(getSelectedMemberId(), "");
  assert.equal(getCurrentMemberId(), "seed_member_xiaoheiwa");
});
