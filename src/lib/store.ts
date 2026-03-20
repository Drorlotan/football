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
  removePlayer: (playerId: string) => void;
  removeMatch: (matchId: string) => void;
  updateStat: (stat: Stat) => void;

  getLeaderboard: () => LeaderboardEntry[];
  getPlayerStats: (playerId: string) => LeaderboardEntry | null;
  getPlayerMatchHistory: (playerId: string) => { date: string; goals: number; assists: number; is_mvp: boolean }[];
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

  removePlayer: (playerId) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
      stats: state.stats.filter((s) => s.player_id !== playerId),
    }));
  },

  removeMatch: (matchId) => {
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== matchId),
      stats: state.stats.filter((s) => s.match_id !== matchId),
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

  getPlayerMatchHistory: (playerId) => {
    const { matches, stats } = get();
    return stats
      .filter((s) => s.player_id === playerId)
      .map((s) => {
        const match = matches.find((m) => m.id === s.match_id);
        return {
          date: match?.date ?? "",
          goals: s.goals,
          assists: s.assists,
          is_mvp: s.is_mvp,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
}));
