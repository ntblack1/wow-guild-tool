const assert = require("node:assert/strict");
const path = require("node:path");
const { beforeEach, test } = require("node:test");

const pagePath = path.resolve(__dirname, "../pages/signup/index.js");
const currentMemberPath = path.resolve(__dirname, "../utils/current-member.js");
const membersServicePath = path.resolve(__dirname, "../services/members.js");

let capturedPage;
let toastMessages;
let navigateCalls;
let characterMemberIds;
let selectedMemberId;
let charactersError;

const loadSignupPage = () => {
  delete require.cache[pagePath];
  delete require.cache[currentMemberPath];
  delete require.cache[membersServicePath];

  require.cache[currentMemberPath] = {
    id: currentMemberPath,
    filename: currentMemberPath,
    loaded: true,
    exports: {
      getSelectedMemberId: () => selectedMemberId,
      getCurrentMemberId: () => selectedMemberId || "seed_member_xiaoheiwa"
    }
  };
  require.cache[membersServicePath] = {
    id: membersServicePath,
    filename: membersServicePath,
    loaded: true,
    exports: {
      getCharacters: async (memberId) => {
        characterMemberIds.push(memberId);
        if (charactersError) {
          throw charactersError;
        }
        return [
          {
            id: "character_1",
            name: "测试角色",
            class: "WARLOCK",
            roleType: "ranged"
          }
        ];
      }
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
  toastMessages = [];
  navigateCalls = [];
  characterMemberIds = [];
  selectedMemberId = "";
  charactersError = null;
  global.wx = {
    showToast(options) {
      toastMessages.push(options.title);
    },
    navigateTo(options) {
      navigateCalls.push(options.url);
    }
  };
});

test("loads characters for the configured fallback member when no member was selected", async () => {
  const page = loadSignupPage();

  await page.loadCharacters();

  assert.equal(page.data.currentMemberId, "seed_member_xiaoheiwa");
  assert.equal(page.data.needsMemberSelection, false);
  assert.deepEqual(characterMemberIds, ["seed_member_xiaoheiwa"]);
  assert.equal(page.data.characterOptions[0], "测试角色（WARLOCK / 远程）");
});

test("loads characters for the selected member on signup page", async () => {
  selectedMemberId = "seed_member_meipinxiaoqian";
  const page = loadSignupPage();

  await page.loadCharacters();

  assert.equal(page.data.currentMemberId, "seed_member_meipinxiaoqian");
  assert.equal(page.data.needsMemberSelection, false);
  assert.deepEqual(characterMemberIds, ["seed_member_meipinxiaoqian"]);
  assert.equal(page.data.characterOptions[0], "测试角色（WARLOCK / 远程）");
});

test("keeps character loading errors visible on the signup page", async () => {
  charactersError = {
    message: "后端未连接：http://127.0.0.1:3000/members/seed_member_xiaoheiwa/characters",
    code: "NETWORK_ERROR"
  };
  const page = loadSignupPage();

  await page.loadCharacters();

  assert.equal(
    page.data.loadError,
    "后端未连接：http://127.0.0.1:3000/members/seed_member_xiaoheiwa/characters"
  );
  assert.equal(toastMessages.at(-1), page.data.loadError);
});
