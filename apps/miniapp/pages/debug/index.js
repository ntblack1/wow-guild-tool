const { API_BASE_URL, LEADER_ID } = require("../../config/index");
const {
  clearApiBaseUrl,
  getApiBaseUrl,
  getStoredApiBaseUrl,
  setApiBaseUrl
} = require("../../utils/api-config");
const {
  clearCurrentMemberId,
  getCurrentMemberId,
  getSelectedMemberId
} = require("../../utils/current-member");
const { health } = require("../../services/api");
const { getMember } = require("../../services/members");

Page({
  data: {
    apiBaseUrl: "",
    configuredApiBaseUrl: API_BASE_URL,
    storedApiBaseUrl: "",
    apiBaseUrlInput: "",
    currentMemberId: "",
    selectedMemberId: "",
    leaderId: LEADER_ID,
    currentMember: null,
    checking: false,
    lastResult: "尚未请求"
  },

  onShow() {
    this.refreshApiConfig();
    this.refreshCurrentMember();
  },

  refreshApiConfig() {
    const storedApiBaseUrl = getStoredApiBaseUrl();
    const apiBaseUrl = getApiBaseUrl();
    this.setData({
      apiBaseUrl,
      storedApiBaseUrl,
      apiBaseUrlInput: storedApiBaseUrl || apiBaseUrl
    });
  },

  async refreshCurrentMember() {
    const selectedMemberId = getSelectedMemberId();
    const currentMemberId = getCurrentMemberId();
    this.setData({
      selectedMemberId,
      currentMemberId,
      currentMember: null
    });

    if (!selectedMemberId) {
      return;
    }

    try {
      const currentMember = await getMember(selectedMemberId);
      this.setData({ currentMember });
    } catch (error) {
      wx.showToast({ title: error.message || "当前成员加载失败", icon: "none" });
    }
  },

  async testHealth() {
    this.refreshApiConfig();
    this.setData({ checking: true });
    try {
      const result = await health();
      this.setData({ lastResult: JSON.stringify(result, null, 2) });
      wx.showToast({ title: "后端正常", icon: "success" });
    } catch (error) {
      this.setData({
        lastResult: JSON.stringify({ message: error.message, code: error.code }, null, 2)
      });
      wx.showToast({ title: "后端不可用", icon: "none" });
    } finally {
      this.setData({ checking: false });
    }
  },

  changeApiBaseUrl(event) {
    this.setData({ apiBaseUrlInput: event.detail.value });
  },

  saveApiBaseUrl() {
    const value = this.data.apiBaseUrlInput.trim();
    if (!value) {
      wx.showToast({ title: "请填写后端地址", icon: "none" });
      return;
    }
    setApiBaseUrl(value);
    this.refreshApiConfig();
    wx.showToast({ title: "后端地址已保存", icon: "success" });
  },

  clearApiBaseUrl() {
    clearApiBaseUrl();
    this.refreshApiConfig();
    wx.showToast({ title: "已恢复默认地址", icon: "none" });
  },

  clearMember() {
    clearCurrentMemberId();
    this.refreshCurrentMember();
    wx.showToast({ title: "已清除当前成员", icon: "none" });
  },

  showSeedHelp() {
    const help = [
      "请在项目根目录运行：",
      "npm run db:migrate",
      "npm run db:seed",
      "",
      "Seed 会创建劳动人民、小黑蛙、眉贫笑浅、三名角色和一个开放报名活动。"
    ].join("\n");
    this.setData({ lastResult: help });
    wx.showModal({
      title: "测试数据",
      content: "请在项目根目录运行 npm run db:seed。",
      showCancel: false
    });
  }
});
