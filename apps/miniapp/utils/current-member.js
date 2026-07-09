const { CURRENT_MEMBER_ID } = require("../config/index");

const CURRENT_MEMBER_STORAGE_KEY = "wow_guild_tool_current_member_id";

const getSelectedMemberId = () => {
  try {
    return wx.getStorageSync(CURRENT_MEMBER_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
};

const getCurrentMemberId = () => getSelectedMemberId() || CURRENT_MEMBER_ID;

const setCurrentMemberId = (memberId) => {
  if (!memberId) {
    return;
  }
  wx.setStorageSync(CURRENT_MEMBER_STORAGE_KEY, memberId);
};

const clearCurrentMemberId = () => {
  wx.removeStorageSync(CURRENT_MEMBER_STORAGE_KEY);
};

module.exports = {
  CURRENT_MEMBER_STORAGE_KEY,
  clearCurrentMemberId,
  getCurrentMemberId,
  getSelectedMemberId,
  setCurrentMemberId
};
