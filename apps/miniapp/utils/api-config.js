const { API_BASE_URL, MINIAPP_API_BASE_URLS } = require("../config/index");

const API_BASE_URL_STORAGE_KEY = "wow_guild_tool_api_base_url";
const LEGACY_LOCALHOST_API_BASE_URLS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000"
]);

const normalizeApiBaseUrl = (value) => {
  const input = String(value || "").trim();
  return input.replace(/\/+$/, "");
};

const getMiniappEnvVersion = () => {
  try {
    const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    return accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion
      ? accountInfo.miniProgram.envVersion
      : "develop";
  } catch (error) {
    return "develop";
  }
};

const getApiBaseUrlForEnv = (envVersion = getMiniappEnvVersion(), config = MINIAPP_API_BASE_URLS) => {
  const apiBaseUrls = config || {};
  if (envVersion && envVersion !== "develop") {
    return normalizeApiBaseUrl(apiBaseUrls[envVersion]);
  }
  return normalizeApiBaseUrl(apiBaseUrls[envVersion] || apiBaseUrls.develop || API_BASE_URL);
};

const getStoredApiBaseUrl = () => {
  try {
    if (getMiniappEnvVersion() !== "develop") {
      return "";
    }
    const storedValue = normalizeApiBaseUrl(wx.getStorageSync(API_BASE_URL_STORAGE_KEY));
    if (LEGACY_LOCALHOST_API_BASE_URLS.has(storedValue)) {
      return "";
    }
    return storedValue;
  } catch (error) {
    return "";
  }
};

const getApiBaseUrl = () => getStoredApiBaseUrl() || getApiBaseUrlForEnv();

const setApiBaseUrl = (value) => {
  const next = normalizeApiBaseUrl(value);
  if (!next) {
    return;
  }
  wx.setStorageSync(API_BASE_URL_STORAGE_KEY, next);
};

const clearApiBaseUrl = () => {
  wx.removeStorageSync(API_BASE_URL_STORAGE_KEY);
};

module.exports = {
  API_BASE_URL_STORAGE_KEY,
  clearApiBaseUrl,
  getApiBaseUrlForEnv,
  getApiBaseUrl,
  getMiniappEnvVersion,
  getStoredApiBaseUrl,
  normalizeApiBaseUrl,
  setApiBaseUrl
};
