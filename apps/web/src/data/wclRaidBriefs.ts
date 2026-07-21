export type WclDeathEntry = {
  name: string;
  deaths: number;
};

export type WclGuildMember = {
  name: string;
  wclName?: string;
  deaths: number;
  matchNote: string;
};

export type WclRaidBrief = {
  id: string;
  title: string;
  date: string;
  sourceLabel: string;
  sourceUrl: string;
  bossKills: number;
  deathEntries: WclDeathEntry[];
  guildMembers: WclGuildMember[];
  punchline: string;
};

export type WclMonthlyReport = {
  id: string;
  date: string;
  sourceUrl: string;
  deathEntries: WclDeathEntry[];
};

export type WclMonthlyDeathBoard = {
  id: string;
  monthLabel: string;
  characterName: string;
  characterUrl: string;
  reports: WclMonthlyReport[];
};

export const july2026WclDeathBoard: WclMonthlyDeathBoard = {
  id: "2026-07-chong-tu-tu",
  monthLabel: "2026 年 7 月",
  characterName: "虫土土",
  characterUrl: "https://titan.warcraftlogs.com/character/cn/%E6%97%B6%E5%85%89iv/%E8%99%AB%E5%9C%9F%E5%9C%9F",
  reports: [
    {
      id: "W2QrdzR649NAv7fF",
      date: "2026-07-05",
      sourceUrl: "https://titan.warcraftlogs.com/reports/W2QrdzR649NAv7fF?type=deaths&boss=-2&difficulty=0&wipes=2",
      deathEntries: [
        { name: "凌乱的发型", deaths: 1 },
        { name: "暴躁小胖", deaths: 1 },
        { name: "梅林技师", deaths: 1 },
      ],
    },
    {
      id: "1hkQn4yrdf8NFba2",
      date: "2026-07-05",
      sourceUrl: "https://titan.warcraftlogs.com/reports/1hkQn4yrdf8NFba2?type=deaths&boss=-2&difficulty=0&wipes=2",
      deathEntries: [
        { name: "梅林技师", deaths: 1 },
        { name: "凌乱的发型", deaths: 1 },
      ],
    },
    {
      id: "NDpY8vmjbarkP91Q",
      date: "2026-07-11",
      sourceUrl: "https://titan.warcraftlogs.com/reports/NDpY8vmjbarkP91Q?type=deaths&boss=-2&difficulty=0&wipes=2",
      deathEntries: [
        { name: "別说话灬吻我", deaths: 1 },
        { name: "孤酌清风", deaths: 1 },
        { name: "麦兜小心", deaths: 1 },
        { name: "安迪小鹜", deaths: 1 },
        { name: "东星小飘", deaths: 1 },
        { name: "堇荼茹苡", deaths: 1 },
      ],
    },
    {
      id: "zqJKxgwhBNa8MTkv",
      date: "2026-07-11",
      sourceUrl: "https://titan.warcraftlogs.com/reports/zqJKxgwhBNa8MTkv?type=deaths&boss=-2&difficulty=0&wipes=2",
      deathEntries: [
        { name: "安迪小鹜", deaths: 1 },
        { name: "麦兜小心", deaths: 1 },
        { name: "孤酌清风", deaths: 1 },
        { name: "堇荼茹苡", deaths: 1 },
        { name: "东星小飘", deaths: 1 },
        { name: "別说话灬吻我", deaths: 1 },
      ],
    },
    {
      id: "w4bYA3rWTht6zf9j",
      date: "2026-07-16",
      sourceUrl: "https://titan.warcraftlogs.com/reports/w4bYA3rWTht6zf9j?type=deaths&boss=-2&difficulty=0&wipes=2",
      deathEntries: [
        { name: "虫土土", deaths: 2 },
        { name: "浮若梦生", deaths: 2 },
        { name: "世事皆好", deaths: 1 },
        { name: "清风流水", deaths: 1 },
        { name: "弦语林间", deaths: 1 },
        { name: "星尘箭痕", deaths: 1 },
        { name: "小区第一帅", deaths: 1 },
        { name: "南酌", deaths: 1 },
        { name: "东星小飘", deaths: 1 },
        { name: "暴躁圆圆", deaths: 1 },
        { name: "圣光波波", deaths: 1 },
      ],
    },
  ],
};

export const wclRaidBriefs: WclRaidBrief[] = [
  {
    id: "2026-07-16-toc-zg",
    title: "八块腹肌最新团本",
    date: "2026-07-16",
    sourceLabel: "同日活动报名匹配",
    sourceUrl: "https://cn.titan.warcraftlogs.com/reports/w4bYA3rWTht6zf9j?type=deaths&boss=-2&difficulty=0&wipes=2",
    bossKills: 15,
    deathEntries: [
      { name: "浮若梦生", deaths: 2 },
      { name: "虫土土", deaths: 2 },
      { name: "暴躁圆圆", deaths: 1 },
      { name: "弦语林间", deaths: 1 },
      { name: "小区第一帅", deaths: 1 },
      { name: "星尘箭痕", deaths: 1 },
      { name: "东星小飘", deaths: 1 },
      { name: "清风流水", deaths: 1 },
      { name: "圣光波波", deaths: 1 },
      { name: "南酌", deaths: 1 },
      { name: "世事皆好", deaths: 1 },
    ],
    guildMembers: [
      { name: "小黑娃", deaths: 0, matchNote: "网站活动报名" },
      { name: "一夜鱼龙焰", deaths: 0, matchNote: "网站活动报名" },
    ],
    punchline: "两个自家人都活着下班，修理费成功甩给了队友。",
  },
  {
    id: "2026-07-10-ntblack",
    title: "Ntblack 本人战报",
    date: "2026-07-10",
    sourceLabel: "Ntblack 角色战报匹配",
    sourceUrl: "https://cn.titan.warcraftlogs.com/reports/NgKwrBZnzXcdDvFA?type=deaths&boss=-2&difficulty=0&wipes=2",
    bossKills: 12,
    deathEntries: [
      { name: "开心小光头", deaths: 2 },
      { name: "夜棘燃星", deaths: 1 },
      { name: "哈瓦亚", deaths: 1 },
      { name: "问题老头", deaths: 1 },
      { name: "爸霸丶", deaths: 1 },
      { name: "黄师傅丶", deaths: 1 },
      { name: "一穷二白的橙", deaths: 1 },
      { name: "小吉姬", deaths: 1 },
      { name: "火得很蒂法", deaths: 1 },
      { name: "青峰明月", deaths: 1 },
    ],
    guildMembers: [
      { name: "Ntblack", deaths: 0, matchNote: "本人角色" },
      { name: "火的很蒂法", wclName: "火得很蒂法", deaths: 1, matchNote: "网站成员名近似匹配" },
    ],
    punchline: "Ntblack 全程拒绝躺平，蒂法用一次倒地证明地板确实擦得很亮。",
  },
];
