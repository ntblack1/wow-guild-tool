const {
  clearCurrentMemberId,
  getCurrentMemberId,
  getSelectedMemberId,
  setCurrentMemberId
} = require("../../utils/current-member");
const {
  createCharacter,
  deleteCharacter,
  getMember,
  getMemberSignups,
  listMembers,
  setMainCharacter,
  updateCharacter
} = require("../../services/members");
const { formatDateTime, roleText, statusText } = require("../../utils/format");
const { characterAvatar, roleClass } = require("../../utils/theme");

const roleOptions = [
  { label: roleText.tank, value: "tank" },
  { label: roleText.healer, value: "healer" },
  { label: roleText.melee, value: "melee" },
  { label: roleText.ranged, value: "ranged" }
];

const defaultCharacterForm = () => ({
  id: "",
  name: "",
  className: "",
  spec: "",
  roleType: "ranged",
  itemLevel: "",
  isMain: false
});

Page({
  data: {
    currentMemberId: getCurrentMemberId(),
    selectedMemberId: getSelectedMemberId(),
    loading: false,
    savingCharacter: false,
    members: [],
    memberOptions: [],
    memberIndex: 0,
    member: null,
    characters: [],
    signups: [],
    showCharacterForm: false,
    editingCharacterId: "",
    characterForm: defaultCharacterForm(),
    roleOptions,
    roleIndex: 3
  },

  onShow() {
    this.loadMine();
  },

  async loadMine() {
    this.setData({ loading: true });
    try {
      const selectedMemberId = getSelectedMemberId();
      const currentMemberId = getCurrentMemberId();
      this.setData({
        selectedMemberId,
        currentMemberId
      });

      const members = await listMembers();
      const memberIndex = Math.max(
        members.findIndex((item) => item.id === currentMemberId),
        0
      );

      this.setData({
        members,
        memberOptions: members.map((member) => `${member.displayName}（${member.guildName || member.id}）`),
        memberIndex,
        selectedMemberId,
        currentMemberId
      });

      if (selectedMemberId) {
        await this.loadMemberDetail(selectedMemberId);
      } else {
        this.setData({
          member: null,
          characters: [],
          signups: [],
          showCharacterForm: false
        });
      }
    } catch (error) {
      wx.showToast({ title: error.message || "我的信息加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadMemberDetail(memberId) {
    const [member, signups] = await Promise.all([
      getMember(memberId),
      getMemberSignups(memberId)
    ]);
    this.setData({
      member,
      characters: (member.characters || []).map((character) => ({
        ...character,
        className: character.className || character.class,
        roleText: roleText[character.roleType] || character.roleType || "-",
        roleClassName: roleClass(character.roleType),
        avatar: characterAvatar(character)
      })),
      signups: signups.map((signup) => ({
        ...signup,
        startTimeText: formatDateTime(signup.event.startTime),
        statusText: statusText[signup.status] || signup.status,
        roleText: roleText[signup.roleType] || signup.roleType
      }))
    });
  },

  async refreshCurrentMemberDetail() {
    const memberId = getSelectedMemberId();
    if (!memberId) {
      return;
    }
    await this.loadMemberDetail(memberId);
  },

  async changeMember(event) {
    const memberIndex = Number(event.detail.value);
    const member = this.data.members[memberIndex];
    if (!member) {
      return;
    }

    setCurrentMemberId(member.id);
    this.setData({
      memberIndex,
      selectedMemberId: member.id,
      currentMemberId: member.id,
      showCharacterForm: false
    });
    wx.showToast({ title: "当前成员已切换", icon: "success" });
    await this.loadMemberDetail(member.id);
  },

  clearMember() {
    clearCurrentMemberId();
    this.setData({
      selectedMemberId: "",
      currentMemberId: getCurrentMemberId(),
      member: null,
      characters: [],
      signups: [],
      showCharacterForm: false
    });
    wx.showToast({ title: "已清除当前成员", icon: "none" });
  },

  async startCreateCharacter() {
    let memberId = this.data.selectedMemberId;
    if (!memberId) {
      memberId = this.data.currentMemberId;
      if (!memberId) {
        wx.showToast({ title: "请先选择当前成员", icon: "none" });
        return;
      }
      setCurrentMemberId(memberId);
      this.setData({
        selectedMemberId: memberId,
        currentMemberId: memberId
      });
      wx.showToast({ title: "已使用默认成员", icon: "none" });
    }

    this.setData({
      showCharacterForm: true,
      editingCharacterId: "",
      characterForm: defaultCharacterForm(),
      roleIndex: 3
    });

    if (!this.data.member) {
      try {
        await this.loadMemberDetail(memberId);
      } catch (error) {
        wx.showToast({ title: "已打开角色表单，成员详情稍后刷新", icon: "none" });
      }
    }
  },

  startEditCharacter(event) {
    const character = this.data.characters.find((item) => item.id === event.currentTarget.dataset.id);
    if (!character) {
      return;
    }
    const roleIndex = Math.max(
      this.data.roleOptions.findIndex((item) => item.value === character.roleType),
      0
    );

    this.setData({
      showCharacterForm: true,
      editingCharacterId: character.id,
      roleIndex,
      characterForm: {
        id: character.id,
        name: character.name || "",
        className: character.className || character.class || "",
        spec: character.spec || "",
        roleType: character.roleType || this.data.roleOptions[roleIndex].value,
        itemLevel: character.itemLevel ? String(character.itemLevel) : "",
        isMain: Boolean(character.isMain)
      }
    });
  },

  cancelCharacterForm() {
    this.setData({
      showCharacterForm: false,
      editingCharacterId: "",
      characterForm: defaultCharacterForm(),
      roleIndex: 3
    });
  },

  changeCharacterField(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`characterForm.${field}`]: event.detail.value });
  },

  changeCharacterRole(event) {
    const roleIndex = Number(event.detail.value);
    const role = this.data.roleOptions[roleIndex];
    this.setData({
      roleIndex,
      "characterForm.roleType": role.value
    });
  },

  changeCharacterMain(event) {
    this.setData({ "characterForm.isMain": event.detail.value });
  },

  buildCharacterPayload() {
    const form = this.data.characterForm;
    const name = form.name.trim();
    const className = form.className.trim();
    const itemLevelText = String(form.itemLevel || "").trim();
    const itemLevel = itemLevelText ? Number(itemLevelText) : null;

    if (!name) {
      wx.showToast({ title: "请填写角色名", icon: "none" });
      return null;
    }

    if (!className) {
      wx.showToast({ title: "请填写职业", icon: "none" });
      return null;
    }

    if (itemLevelText && (!/^\d+$/.test(itemLevelText) || itemLevel < 0)) {
      wx.showToast({ title: "装等必须是正整数", icon: "none" });
      return null;
    }

    return {
      name,
      className,
      spec: form.spec.trim(),
      roleType: form.roleType,
      itemLevel: itemLevel && itemLevel > 0 ? itemLevel : null,
      isMain: Boolean(form.isMain)
    };
  },

  async saveCharacter() {
    const memberId = this.data.selectedMemberId;
    if (!memberId) {
      wx.showToast({ title: "请先选择当前成员", icon: "none" });
      return;
    }

    const payload = this.buildCharacterPayload();
    if (!payload) {
      return;
    }

    this.setData({ savingCharacter: true });
    try {
      if (this.data.editingCharacterId) {
        await updateCharacter(memberId, this.data.editingCharacterId, payload);
      } else {
        await createCharacter(memberId, payload);
      }
      wx.showToast({ title: "角色已保存", icon: "success" });
      this.cancelCharacterForm();
      await this.refreshCurrentMemberDetail();
    } catch (error) {
      const message =
        error.code === "MEMBER_NOT_FOUND"
          ? "当前成员不存在，请先运行测试数据"
          : error.message || "角色保存失败";
      wx.showToast({ title: message, icon: "none" });
    } finally {
      this.setData({ savingCharacter: false });
    }
  },

  async setMain(event) {
    const memberId = this.data.selectedMemberId;
    const characterId = event.currentTarget.dataset.id;
    if (!memberId || !characterId) {
      wx.showToast({ title: "请先选择当前成员", icon: "none" });
      return;
    }

    try {
      await setMainCharacter(memberId, characterId);
      wx.showToast({ title: "已设为主号", icon: "success" });
      await this.refreshCurrentMemberDetail();
    } catch (error) {
      wx.showToast({ title: error.message || "设置主号失败", icon: "none" });
    }
  },

  deleteCharacter(event) {
    const memberId = this.data.selectedMemberId;
    const characterId = event.currentTarget.dataset.id;
    if (!memberId || !characterId) {
      wx.showToast({ title: "请先选择当前成员", icon: "none" });
      return;
    }

    wx.showModal({
      title: "删除角色",
      content: "确认删除这个角色吗？已报名记录不会被删除，但后续报名将不能再选择该角色。",
      success: async (result) => {
        if (!result.confirm) {
          return;
        }
        try {
          await deleteCharacter(memberId, characterId);
          wx.showToast({ title: "角色已删除", icon: "success" });
          await this.refreshCurrentMemberDetail();
        } catch (error) {
          wx.showToast({ title: error.message || "删除角色失败", icon: "none" });
        }
      }
    });
  }
});
