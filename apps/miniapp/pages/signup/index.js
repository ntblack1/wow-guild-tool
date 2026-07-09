const { getCurrentMemberId, getSelectedMemberId } = require("../../utils/current-member");
const { getCharacters } = require("../../services/members");
const { createSignup } = require("../../services/signups");
const { roleText } = require("../../utils/format");
const { getApiBaseUrl } = require("../../utils/api-config");

const roleOptions = [
  { label: roleText.tank, value: "tank" },
  { label: roleText.healer, value: "healer" },
  { label: roleText.melee, value: "melee" },
  { label: roleText.ranged, value: "ranged" }
];

Page({
  data: {
    eventId: "",
    currentMemberId: "",
    apiBaseUrl: getApiBaseUrl(),
    loadError: "",
    loading: false,
    submitting: false,
    needsMemberSelection: false,
    characters: [],
    characterOptions: [],
    characterIndex: 0,
    roleOptions,
    roleIndex: 0,
    note: "",
    selectedCharacterText: "请选择角色",
    selectedRoleText: roleOptions[0].label
  },

  onLoad(options) {
    this.setData({ eventId: options.eventId || "" });
    this.loadCharacters();
  },

  onShow() {
    if (this.data.eventId) {
      this.loadCharacters();
    }
  },

  async loadCharacters() {
    const memberId = getCurrentMemberId();
    this.setData({
      apiBaseUrl: getApiBaseUrl(),
      loadError: ""
    });
    if (!memberId) {
      this.setData({
        currentMemberId: "",
        needsMemberSelection: true,
        characters: [],
        characterOptions: [],
        selectedCharacterText: "请先选择当前成员"
      });
      wx.showToast({ title: "请先在我的页面选择当前成员", icon: "none" });
      return;
    }

    this.setData({
      currentMemberId: memberId,
      needsMemberSelection: false,
      loading: true
    });
    try {
      const characters = await getCharacters(memberId);
      const characterOptions = characters.map((character) => {
        const role = character.roleType ? ` / ${roleText[character.roleType] || character.roleType}` : "";
        return `${character.name}（${character.class || character.className || "-"}${role}）`;
      });
      this.setData({
        characters,
        characterOptions,
        characterIndex: 0,
        selectedCharacterText: characterOptions[0] || "请选择角色"
      });
    } catch (error) {
      this.setData({
        characters: [],
        characterOptions: [],
        selectedCharacterText: "请选择角色",
        loadError: error.message || "角色加载失败"
      });
      wx.showToast({ title: error.message || "角色加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goSelectMember() {
    wx.switchTab
      ? wx.switchTab({ url: "/pages/my/index" })
      : wx.navigateTo({ url: "/pages/my/index" });
  },

  changeCharacter(event) {
    const characterIndex = Number(event.detail.value);
    this.setData({
      characterIndex,
      selectedCharacterText: this.data.characterOptions[characterIndex]
    });
  },

  changeRole(event) {
    const roleIndex = Number(event.detail.value);
    this.setData({
      roleIndex,
      selectedRoleText: this.data.roleOptions[roleIndex].label
    });
  },

  changeNote(event) {
    this.setData({ note: event.detail.value });
  },

  async submitSignup() {
    const memberId = getCurrentMemberId();
    const character = this.data.characters[this.data.characterIndex];
    const role = this.data.roleOptions[this.data.roleIndex];

    if (!memberId) {
      wx.showToast({ title: "请先在我的页面选择当前成员", icon: "none" });
      return;
    }

    if (!this.data.eventId || !character || !role) {
      wx.showToast({ title: "报名信息不完整", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    try {
      await createSignup(this.data.eventId, {
        memberId,
        characterId: character.id,
        roleType: role.value,
        status: "signed",
        note: this.data.note
      });
      wx.showToast({ title: "报名成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (error) {
      wx.showToast({ title: error.message || "报名失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
