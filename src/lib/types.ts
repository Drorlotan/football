export type Player = {
  id: string;
  name: string;
  profile_pic: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  date: string;
  score_a: number;
  score_b: number;
  created_at: string;
};

export type Stat = {
  id: string;
  match_id: string;
  player_id: string;
  team: "A" | "B";
  goals: number;
  assists: number;
  is_mvp: boolean;
  created_at: string;
};

export type StatWithPlayer = Stat & {
  players: Player;
};

export type MatchWithStats = Match & {
  stats: StatWithPlayer[];
};

export type LeaderboardEntry = {
  player: Player;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goals: number;
  assists: number;
  mvp_count: number;
  win_rate: number;
};
