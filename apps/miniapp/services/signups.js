const { request } = require("../utils/request");

const createSignup = (eventId, data) =>
  request({
    path: `/events/${eventId}/signups`,
    method: "POST",
    data
  });

module.exports = {
  createSignup
};
