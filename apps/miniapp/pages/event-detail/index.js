const { getEvent, getSignupSummary, listSignups } = require("../../services/events");
const { formatDateTime, roleText, statusText } = require("../../utils/format");
const {
  buildRoleNeeds,
  eventArtwork,
  eventProgress,
  roleClass,
  statusClass
} = require("../../utils/theme");

Page({
  data: {
    id: "",
    loading: false,
    error: "",
    event: null,
    summary: {},
    progress: 0,
    roleNeeds: [],
    signups: [],
    showSignups: false
  },

  onLoad(options) {
    this.setData({ id: options.id || "" });
    this.loadDetail();
  },

  onShow() {
    if (this.data.id) {
      this.loadDetail();
    }
  },

  async loadDetail() {
    if (!this.data.id) return;
    this.setData({ loading: true, error: "" });
    try {
      const [event, summary] = await Promise.all([
        getEvent(this.data.id),
        getSignupSummary(this.data.id)
      ]);
      this.setData({
        event: {
          ...event,
          statusText: statusText[event.status] || event.status,
          statusClass: statusClass(event.status),
          startTimeText: formatDateTime(event.startTime),
          leaderName: event.leader ? event.leader.displayName : "-",
          artwork: eventArtwork(event)
        },
        summary,
        progress: eventProgress({
          signedCount: summary.signedCount || 0,
          maxPlayers: summary.maxPlayers || event.maxPlayers
        }),
        roleNeeds: buildRoleNeeds(event, summary)
      });
      if (this.data.showSignups) {
        await this.loadSignups();
      }
    } catch (error) {
      this.setData({ error: error.message || "活动详情加载失败" });
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goSignup() {
    wx.navigateTo({ url: `/pages/signup/index?eventId=${this.data.id}` });
  },

  async toggleSignups() {
    const next = !this.data.showSignups;
    this.setData({ showSignups: next });
    if (next) {
      await this.loadSignups();
    }
  },

  async loadSignups() {
    const signups = await listSignups(this.data.id);
    this.setData({
      signups: signups.map((signup) => ({
        ...signup,
        statusText: statusText[signup.status] || signup.status,
        roleText: roleText[signup.roleType] || signup.roleType,
        roleClassName: roleClass(signup.roleType)
      }))
    });
  }
});
