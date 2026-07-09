const { request } = require("../utils/request");

const listMembers = () => request({ path: "/members" });
const getMember = (memberId) => request({ path: `/members/${memberId}` });
const getCharacters = (memberId) => request({ path: `/members/${memberId}/characters` });
const createCharacter = (memberId, data) =>
  request({ path: `/members/${memberId}/characters`, method: "POST", data });
const updateCharacter = (memberId, characterId, data) =>
  request({ path: `/members/${memberId}/characters/${characterId}`, method: "PATCH", data });
const setMainCharacter = (memberId, characterId) =>
  request({ path: `/members/${memberId}/characters/${characterId}/set-main`, method: "POST" });
const deleteCharacter = (memberId, characterId) =>
  request({ path: `/members/${memberId}/characters/${characterId}`, method: "DELETE" });
const getMemberSignups = (memberId) => request({ path: `/members/${memberId}/signups` });

module.exports = {
  listMembers,
  getMember,
  getCharacters,
  createCharacter,
  updateCharacter,
  setMainCharacter,
  deleteCharacter,
  getMemberSignups
};
