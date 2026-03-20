import { create } from "zustand";
import type { Player, Match, Stat, LeaderboardEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type AppState = {
  players: Player[];
  matches: Match[];
  stats: Stat[];
  loading: boolean;

  fetchPlayers: () => Promise<void>;
  fetchMatches: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchAll: () => Promise<void>;

  addPlayer: (player: Player) => void;
  updateStat: (stat: Stat) => void;

  getLeaderboard: () => LeaderboardEntry[];
  getPlayerStats: (playerId: string) => LeaderboardEntry | null;
};

export const useAppStore = create<AppState>((set, get) => ({
  players: [],
  matches: [],
  stats: [],
  loading: false,

  fetchPlayers: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("name");
    if (data) set({ players: data });
  },

  fetchMatches: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("date", { ascending: false });
    if (data) set({ matches: data });
  },

  fetchStats: async () => {
    const supabase = createClient();
    const { data } = await supabase.from("stats").select("*");
    if (data) set({ stats: data });
  },

  fetchAll: async () => {
    set({ loading: true });
    await Promise.all([
      get().fetchPlayers(),
      get().fetchMatches(),
      get().fetchStats(),
    ]);
    set({ loading: false });
  },

  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players, player].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  updateStat: (stat) => {
    set((state) => ({
      stats: state.stats.some((s) => s.id === stat.id)
        ? state.stats.map((s) => (s.id === stat.id ? stat : s))
        : [...state.stats, stat],
    }));
  },

  getLeaderboard: () => {
    const { players, stats } = get();
    return players
      .map((player) => {
        const playerStats = stats.filter((s) => s.player_id === player.id);
        let goals = 0,
          assists = 0,
          mvpCount = 0;

        playerStats.forEach((s) => {
          goals += s.goals;
          assists += s.assists;
          if (s.is_mvp) mvpCount++;
        });

        return {
          player,
          matches_played: playerStats.length,
          goals,
          assists,
          mvp_count: mvpCount,
        };
      })
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  },

  getPlayerStats: (playerId) => {
    const leaderboard = get().getLeaderboard();
    return leaderboard.find((e) => e.player.id === playerId) ?? null;
  },
}));
