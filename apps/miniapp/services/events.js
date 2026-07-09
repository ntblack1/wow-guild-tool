const { request } = require("../utils/request");

const listEvents = () => request({ path: "/events" });
const getEvent = (eventId) => request({ path: `/events/${eventId}` });
const createEvent = (data) => request({ path: "/events", method: "POST", data });
const openSignup = (eventId) => request({ path: `/events/${eventId}/open-signup`, method: "POST" });
const lockEvent = (eventId) => request({ path: `/events/${eventId}/lock`, method: "POST" });
const listSignups = (eventId) => request({ path: `/events/${eventId}/signups` });
const getSignupSummary = (eventId) => request({ path: `/events/${eventId}/signup-summary` });

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  openSignup,
  lockEvent,
  listSignups,
  getSignupSummary
};
