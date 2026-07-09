const { request } = require("../utils/request");

const listAttendance = (eventId) =>
  request({
    path: `/events/${eventId}/attendance`
  });

const generateAttendanceFromSignups = (eventId) =>
  request({
    path: `/events/${eventId}/attendance/from-signups`,
    method: "POST"
  });

const getAttendanceSummary = (eventId) =>
  request({
    path: `/events/${eventId}/attendance-summary`
  });

const updateAttendance = (attendanceId, data) =>
  request({
    path: `/attendance/${attendanceId}`,
    method: "PATCH",
    data
  });

module.exports = {
  listAttendance,
  generateAttendanceFromSignups,
  getAttendanceSummary,
  updateAttendance
};
