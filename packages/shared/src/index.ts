export enum GuildEventType {
  Raid = "RAID",
  Dungeon = "DUNGEON",
  WorldBoss = "WORLD_BOSS",
  GuildMeeting = "GUILD_MEETING",
  Other = "OTHER"
}

export enum GuildEventStatus {
  Draft = "draft",
  SignupOpen = "signup_open",
  Locked = "locked",
  InProgress = "in_progress",
  Finished = "finished",
  Cancelled = "cancelled"
}

export enum SignupRole {
  Tank = "tank",
  Healer = "healer",
  Melee = "melee",
  Ranged = "ranged"
}

export enum SignupStatus {
  Signed = "signed",
  Standby = "standby",
  Leave = "leave",
  Cancelled = "cancelled"
}

export enum AttendanceStatus {
  Present = "present",
  Late = "late",
  Absent = "absent",
  Standby = "standby"
}

export enum CharacterClass {
  Warrior = "WARRIOR",
  Paladin = "PALADIN",
  Hunter = "HUNTER",
  Rogue = "ROGUE",
  Priest = "PRIEST",
  Shaman = "SHAMAN",
  Mage = "MAGE",
  Warlock = "WARLOCK",
  Druid = "DRUID",
  DeathKnight = "DEATH_KNIGHT",
  Monk = "MONK",
  DemonHunter = "DEMON_HUNTER",
  Evoker = "EVOKER"
}

export enum LootQuality {
  Rare = "RARE",
  Epic = "EPIC",
  Legendary = "LEGENDARY"
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    code: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const createSuccess = <T>(data: T): ApiSuccess<T> => ({
  success: true,
  data
});
