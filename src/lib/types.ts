export type Player = {
  id: string;
  name: string;
  profile_pic: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  date: string;
  created_at: string;
};

export type Stat = {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  is_mvp: boolean;
  created_at: string;
};

export type LeaderboardEntry = {
  player: Player;
  matches_played: number;
  goals: number;
  assists: number;
  mvp_count: number;
};
