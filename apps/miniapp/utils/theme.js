const RAID_ARTWORK = [
  {
    pattern: /幽暗|深渊|渊喉|暗/i,
    image: "/assets/images/raid-abyss.png"
  },
  {
    pattern: /烈焰|熔炉|火|炎/i,
    image: "/assets/images/raid-forge.png"
  },
  {
    pattern: /风暴|王座|雷|霜/i,
    image: "/assets/images/raid-storm.png"
  }
];

const ROLE_META = {
  tank: { label: "坦克", className: "role-tank", avatar: "/assets/images/chibi-tank.png" },
  healer: { label: "治疗", className: "role-healer", avatar: "/assets/images/chibi-healer.png" },
  melee: { label: "近战", className: "role-melee", avatar: "/assets/images/chibi-dps.png" },
  ranged: { label: "远程", className: "role-ranged", avatar: "/assets/images/chibi-dps.png" }
};

const roleClass = (roleType) => (ROLE_META[roleType] || ROLE_META.ranged).className;

const statusClass = (status) => {
  const classes = {
    signup_open: "status-open",
    signup_locked: "status-locked",
    locked: "status-locked",
    finished: "status-finished"
  };
  return classes[status] || "status-draft";
};

const eventArtwork = (event = {}) => {
  const raidName = event.raidName || "";
  const match = RAID_ARTWORK.find((item) => item.pattern.test(raidName));
  return match ? match.image : RAID_ARTWORK[0].image;
};

const eventProgress = ({ signedCount = 0, maxPlayers = 0 } = {}) => {
  const max = Number(maxPlayers) || 0;
  if (max <= 0) {
    return 0;
  }
  return Math.min(100, Math.round(((Number(signedCount) || 0) / max) * 100));
};

const buildRoleNeeds = (event = {}, summary = {}) =>
  [
    ["tank", "tankNeed", "tankSigned"],
    ["healer", "healerNeed", "healerSigned"],
    ["melee", "meleeNeed", "meleeSigned"],
    ["ranged", "rangedNeed", "rangedSigned"]
  ].map(([key, needKey, signedKey]) => {
    const need = Number(event[needKey]) || 0;
    const current = Number(summary[signedKey]) || 0;
    const meta = ROLE_META[key];
    return {
      key,
      label: meta.label,
      current,
      need,
      gap: Math.max(need - current, 0),
      className: meta.className
    };
  });

const characterAvatar = (character = {}) => {
  const meta = ROLE_META[character.roleType] || ROLE_META.ranged;
  return meta.avatar;
};

module.exports = {
  buildRoleNeeds,
  characterAvatar,
  eventArtwork,
  eventProgress,
  roleClass,
  statusClass
};
