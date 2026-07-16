export const combatRoles = ["T", "N", "DPS"] as const;
export type CombatRole = (typeof combatRoles)[number];

export const userRoles = ["member", "leader", "admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const eventStatuses = ["draft", "open", "closed", "finished"] as const;
export type EventStatus = (typeof eventStatuses)[number];

export const eventFilters = ["全部", "我的报名", "报名中", "即将开始"] as const;
export type EventFilter = (typeof eventFilters)[number];

export const signupStatuses = ["已报名", "已确认", "替补", "请假"] as const;
export type SignupStatus = (typeof signupStatuses)[number];

export const forumCategories = [
  "开团通知",
  "副本攻略",
  "插件宏区",
  "装备交易",
  "吐槽大会",
  "战报区",
] as const;
export type ForumCategory = (typeof forumCategories)[number];

export type ForumSortMode = "最新" | "热门";

export type Profile = {
  id: string;
  display_name: string;
  role: UserRole;
  showcase_image_url: string | null;
  showcase_position_x: number;
  showcase_position_y: number;
  showcase_caption: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicAuthor = Pick<Profile, "id" | "display_name" | "role">;
export type ShowcaseProfile = Pick<
  Profile,
  "id" | "display_name" | "showcase_image_url" | "showcase_position_x" | "showcase_position_y" | "showcase_caption"
>;

export type GuildCharacter = {
  id: string;
  user_id: string;
  name: string;
  class_name: string;
  spec: string;
  combat_role: CombatRole;
  item_level: number | null;
  note: string | null;
  avatar_url: string | null;
  avatar_position_x: number;
  avatar_position_y: number;
  created_at: string;
  updated_at: string;
};

export type GuildEvent = {
  id: string;
  title: string;
  raid_name: string;
  starts_at: string;
  capacity: number;
  description: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Pick<Profile, "id" | "display_name">;
};

export type Signup = {
  id: string;
  event_id: string;
  character_id: string;
  user_id: string;
  combat_role: CombatRole;
  note: string | null;
  status: SignupStatus;
  created_at: string;
  updated_at: string;
  character?: GuildCharacter;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  category: ForumCategory;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: PublicAuthor;
  comment_count?: number;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  quoted_text: string | null;
  created_at: string;
  author?: PublicAuthor;
  parent?: Comment;
};

export type Report = {
  id: string;
  title: string;
  content: string;
  event_id: string | null;
  red_star: string | null;
  black_star: string | null;
  quote: string | null;
  created_by: string;
  created_at: string;
};

export type CharacterInput = Pick<
  GuildCharacter,
  "name" | "class_name" | "spec" | "combat_role" | "item_level" | "note" | "avatar_url" | "avatar_position_x" | "avatar_position_y"
>;

export type EventInput = Pick<
  GuildEvent,
  "title" | "raid_name" | "starts_at" | "capacity" | "description" | "status"
>;

export type PostInput = Pick<Post, "title" | "body" | "category">;

export type ReportInput = Pick<Report, "title" | "content" | "event_id" | "red_star" | "black_star" | "quote">;
