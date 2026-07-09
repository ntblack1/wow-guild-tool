export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code: string } };

export type GuildEvent = {
  id: string;
  title: string;
  raidName: string;
  status: string;
  startTime: string;
  maxPlayers: number;
  tankNeed: number;
  healerNeed: number;
  meleeNeed: number;
  rangedNeed: number;
  leaderId?: string;
  description?: string;
};
