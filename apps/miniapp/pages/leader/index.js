const { LEADER_ID } = require("../../config/index");
const { createEvent, listEvents, listSignups, lockEvent, openSignup } = require("../../services/events");
const {
  generateAttendanceFromSignups,
  getAttendanceSummary,
  listAttendance,
  updateAttendance
} = require("../../services/attendance");
const { formatDateTime, roleText, statusText } = require("../../utils/format");
const { getApiBaseUrl } = require("../../utils/api-config");
const { statusClass } = require("../../utils/theme");

const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date.toISOString();
};

const attendanceStatusOptions = [
  { label: "出勤", value: "present" },
  { label: "迟到", value: "late" },
  { label: "缺席", value: "absent" },
  { label: "候补", value: "standby" }
];

Page({
  data: {
    leaderId: LEADER_ID,
    apiBaseUrl: getApiBaseUrl(),
    loadError: "",
    creating: false,
    events: [],
    signups: [],
    attendance: [],
    attendanceSummary: null,
    attendanceStatusOptions,
    selectedEventId: "",
    selectedEventTitle: "",
    form: {
      title: "八块腹肌今晚开团",
      raidName: "奥杜尔 25人",
      startTime: tomorrowIso(),
      maxPlayers: 25,
      tankNeed: 2,
      healerNeed: 5,
      meleeNeed: 8,
      rangedNeed: 10,
      description: "小程序 V0.1 创建的测试活动"
    }
  },

  onShow() {
    this.loadEvents();
  },

  changeField(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({ [`form.${field}`]: value });
  },

  async loadEvents() {
    this.setData({
      apiBaseUrl: getApiBaseUrl(),
      loadError: ""
    });
    try {
      const events = await listEvents();
      this.setData({
        events: events.map((item) => ({
          ...item,
          startTimeText: formatDateTime(item.startTime),
          statusText: statusText[item.status] || item.status,
          statusClass: statusClass(item.status)
        }))
      });
    } catch (error) {
      this.setData({
        events: [],
        loadError: error.message || "活动加载失败"
      });
      wx.showToast({ title: error.message || "活动加载失败", icon: "none" });
    }
  },

  async createNewEvent() {
    const form = this.data.form;
    this.setData({ creating: true });
    try {
      await createEvent({
        title: form.title,
        raidName: form.raidName,
        startTime: form.startTime,
        maxPlayers: Number(form.maxPlayers),
        tankNeed: Number(form.tankNeed),
        healerNeed: Number(form.healerNeed),
        meleeNeed: Number(form.meleeNeed),
        rangedNeed: Number(form.rangedNeed),
        leaderId: LEADER_ID,
        description: form.description
      });
      wx.showToast({ title: "创建成功", icon: "success" });
      await this.loadEvents();
    } catch (error) {
      wx.showToast({ title: error.message || "创建失败", icon: "none" });
    } finally {
      this.setData({ creating: false });
    }
  },

  async openSignup(event) {
    await this.runEventAction(event.currentTarget.dataset.id, openSignup, "已开放报名");
  },

  async lockEvent(event) {
    await this.runEventAction(event.currentTarget.dataset.id, lockEvent, "已锁定报名");
  },

  async runEventAction(eventId, action, successText) {
    try {
      await action(eventId);
      wx.showToast({ title: successText, icon: "success" });
      await this.loadEvents();
    } catch (error) {
      wx.showToast({ title: error.message || "操作失败", icon: "none" });
    }
  },

  async showSignups(event) {
    const eventId = event.currentTarget.dataset.id;
    const currentEvent = this.data.events.find((item) => item.id === eventId);
    try {
      const signups = await listSignups(eventId);
      this.setData({
        selectedEventId: eventId,
        selectedEventTitle: currentEvent ? currentEvent.title : "当前活动",
        signups: signups.map((item) => ({
          ...item,
          roleText: roleText[item.roleType] || item.roleType,
          statusText: statusText[item.status] || item.status
        }))
      });
    } catch (error) {
      wx.showToast({ title: error.message || "报名加载失败", icon: "none" });
    }
  },

  async generateAttendance(event) {
    const eventId = event.currentTarget.dataset.id;
    try {
      const result = await generateAttendanceFromSignups(eventId);
      wx.showToast({ title: `生成${result.length}条签到`, icon: "success" });
      await this.refreshAttendance(eventId);
    } catch (error) {
      wx.showToast({ title: error.message || "生成签到失败", icon: "none" });
    }
  },

  async showAttendance(event) {
    await this.refreshAttendance(event.currentTarget.dataset.id);
  },

  async refreshAttendance(eventId) {
    const currentEvent = this.data.events.find((item) => item.id === eventId);
    try {
      const [attendance, attendanceSummary] = await Promise.all([
        listAttendance(eventId),
        getAttendanceSummary(eventId)
      ]);
      this.setData({
        selectedEventId: eventId,
        selectedEventTitle: currentEvent ? currentEvent.title : "当前活动",
        attendanceSummary,
        attendance: attendance.map((item) => ({
          ...item,
          statusText: statusText[item.status] || item.status
        }))
      });
    } catch (error) {
      wx.showToast({ title: error.message || "签到加载失败", icon: "none" });
    }
  },

  async changeAttendanceStatus(event) {
    const attendanceId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    try {
      await updateAttendance(attendanceId, { status });
      wx.showToast({ title: "签到已更新", icon: "success" });
      await this.refreshAttendance(this.data.selectedEventId);
    } catch (error) {
      wx.showToast({ title: error.message || "签到更新失败", icon: "none" });
    }
  }
});
