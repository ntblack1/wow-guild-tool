const { getApiBaseUrl, request } = require("../utils/request");

const health = () => request({ path: "/health" });

module.exports = {
  getApiBaseUrl,
  health
};
