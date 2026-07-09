const { health } = require("../../services/api");
const { listEvents } = require("../../services/events");
const { formatDateTime, statusText } = require("../../utils/format");
const { eventArtwork, eventProgress, statusClass } = require("../../utils/theme");

Page({
  data: {
    loading: false,
    error: "",
    apiStatus: "\u68c0\u67e5\u4e2d",
    events: []
  },

  onLoad() {
    this.loadEvents();
  },

  onPullDownRefresh() {
    this.loadEvents().finally(() => wx.stopPullDownRefresh());
  },

  async loadEvents() {
    this.setData({ loading: true, error: "", apiStatus: "\u68c0\u67e5\u4e2d" });
    try {
      const [healthResult, events] = await Promise.all([health(), listEvents()]);
      this.setData({
        apiStatus: healthResult.status === "ok" ? "\u540e\u7aef\u6b63\u5e38" : "\u540e\u7aef\u672a\u77e5",
        events: events.map((event) => ({
          ...event,
          statusText: statusText[event.status] || event.status,
          statusClass: statusClass(event.status),
          startTimeText: formatDateTime(event.startTime),
          artwork: eventArtwork(event),
          progress: eventProgress({
            signedCount: event.signedCount || event.signupCount || 0,
            maxPlayers: event.maxPlayers
          })
        }))
      });
    } catch (error) {
      this.setData({
        apiStatus: "\u540e\u7aef\u8fde\u63a5\u5931\u8d25",
        error: error.message || "\u6d3b\u52a8\u5217\u8868\u52a0\u8f7d\u5931\u8d25"
      });
      wx.showToast({ title: "\u52a0\u8f7d\u5931\u8d25", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/event-detail/index?id=${event.currentTarget.dataset.id}`
    });
  }
});
