const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const pagePath = path.resolve(__dirname, "../pages/my/index.js");
const currentMemberPath = path.resolve(__dirname, "../utils/current-member.js");
const membersServicePath = path.resolve(__dirname, "../services/members.js");

let capturedPage;
let storedMemberId;
let toastMessages;
let savedCharacterPayload;
let memberResponse;
let memberError;

const loadMyPage = () => {
  delete require.cache[pagePath];
  delete require.cache[currentMemberPath];
  delete require.cache[membersServicePath];

  require.cache[currentMemberPath] = {
    id: currentMemberPath,
    filename: currentMemberPath,
    loaded: true,
    exports: {
      clearCurrentMemberId: () => {
        storedMemberId = "";
      },
      getCurrentMemberId: () => storedMemberId || "seed_member_xiaoheiwa",
      getSelectedMemberId: () => storedMemberId || "",
      setCurrentMemberId: (memberId) => {
        storedMemberId = memberId;
      }
    }
  };
  require.cache[membersServicePath] = {
    id: membersServicePath,
    filename: membersServicePath,
    loaded: true,
    exports: {
      createCharacter: async (_memberId, data) => {
        savedCharacterPayload = data;
        return {};
      },
      deleteCharacter: async () => ({}),
      getMember: async () => {
        if (memberError) {
          throw memberError;
        }
        return memberResponse;
      },
      getMemberSignups: async () => [],
      listMembers: async () => [],
      setMainCharacter: async () => ({}),
      updateCharacter: async () => ({})
    }
  };

  global.Page = (definition) => {
    capturedPage = {
      ...definition,
      data: JSON.parse(JSON.stringify(definition.data)),
      setData(update) {
        Object.keys(update).forEach((key) => {
          const parts = key.split(".");
          let target = this.data;
          while (parts.length > 1) {
            const part = parts.shift();
            target[part] = target[part] || {};
            target = target[part];
          }
          target[parts[0]] = update[key];
        });
      }
    };
  };

  require(pagePath);
  return capturedPage;
};

beforeEach(() => {
  capturedPage = null;
  storedMemberId = "";
  toastMessages = [];
  savedCharacterPayload = null;
  memberResponse = null;
  memberError = new Error("backend is not ready");
  global.wx = {
    showToast(options) {
      toastMessages.push(options.title);
    },
    showModal(options) {
      options.success?.({ confirm: true });
    }
  };
});

test("saves character without requiring item level", async () => {
  storedMemberId = "seed_member_xiaoheiwa";
  const page = loadMyPage();
  page.setData({
    selectedMemberId: "seed_member_xiaoheiwa",
    "characterForm.name": "毁灭术",
    "characterForm.className": "术士",
    "characterForm.spec": "毁灭",
    "characterForm.roleType": "ranged",
    "characterForm.itemLevel": "",
    "characterForm.isMain": true
  });

  await page.saveCharacter();

  assert.equal(savedCharacterPayload.itemLevel, null);
  assert.equal(toastMessages.includes("装等必须是正整数"), false);
});

test("treats zero item level as not filled", async () => {
  storedMemberId = "seed_member_xiaoheiwa";
  const page = loadMyPage();
  page.setData({
    selectedMemberId: "seed_member_xiaoheiwa",
    "characterForm.name": "毁灭术",
    "characterForm.className": "术士",
    "characterForm.roleType": "ranged",
    "characterForm.itemLevel": "0"
  });

  await page.saveCharacter();

  assert.equal(savedCharacterPayload.itemLevel, null);
  assert.equal(toastMessages.includes("装等必须是正整数"), false);
});

test("opens character form with fallback member even when member detail request fails", async () => {
  const page = loadMyPage();

  await page.startCreateCharacter();

  assert.equal(page.data.selectedMemberId, "seed_member_xiaoheiwa");
  assert.equal(page.data.showCharacterForm, true);
  assert.equal(page.data.editingCharacterId, "");
  assert.equal(toastMessages.includes("已使用默认成员"), true);
});

test("keeps fallback member available when member list request fails on page load", async () => {
  const page = loadMyPage();

  await page.loadMine();
  await page.startCreateCharacter();

  assert.equal(page.data.currentMemberId, "seed_member_xiaoheiwa");
  assert.equal(page.data.selectedMemberId, "seed_member_xiaoheiwa");
  assert.equal(page.data.showCharacterForm, true);
});

test("adds avatar and role class to character roster entries", async () => {
  storedMemberId = "seed_member_xiaoheiwa";
  memberError = null;
  memberResponse = {
    id: "seed_member_xiaoheiwa",
    displayName: "小黑蛙",
    characters: [
      {
        id: "character_tank",
        name: "盾墙",
        className: "PALADIN",
        roleType: "tank",
        itemLevel: 245
      }
    ]
  };
  const page = loadMyPage();

  await page.loadMemberDetail("seed_member_xiaoheiwa");

  assert.equal(page.data.characters[0].avatar, "/assets/images/chibi-tank.png");
  assert.equal(page.data.characters[0].roleClassName, "role-tank");
});
