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

  addMatch: (match: Match, matchStats: Stat[]) => void;
  addPlayer: (player: Player) => void;

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

  // Optimistic: add match + stats to local state immediately
  addMatch: (match, matchStats) => {
    set((state) => ({
      matches: [match, ...state.matches],
      stats: [...state.stats, ...matchStats],
    }));
  },

  addPlayer: (player) => {
    set((state) => ({
      players: [...state.players, player].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  getLeaderboard: () => {
    const { players, matches, stats } = get();
    return players
      .map((player) => {
        const playerStats = stats.filter((s) => s.player_id === player.id);
        let wins = 0,
          draws = 0,
          losses = 0,
          goals = 0,
          assists = 0,
          mvpCount = 0;

        playerStats.forEach((s) => {
          const match = matches.find((m) => m.id === s.match_id);
          if (!match) return;
          goals += s.goals;
          assists += s.assists;
          if (s.is_mvp) mvpCount++;

          const playerScore =
            s.team === "A" ? match.score_a : match.score_b;
          const opponentScore =
            s.team === "A" ? match.score_b : match.score_a;

          if (playerScore > opponentScore) wins++;
          else if (playerScore === opponentScore) draws++;
          else losses++;
        });

        const matchesPlayed = playerStats.length;
        return {
          player,
          matches_played: matchesPlayed,
          wins,
          draws,
          losses,
          points: wins * 3 + draws * 1,
          goals,
          assists,
          mvp_count: mvpCount,
          win_rate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
        };
      })
      .sort((a, b) => b.points - a.points || b.goals - a.goals);
  },

  getPlayerStats: (playerId) => {
    const leaderboard = get().getLeaderboard();
    return leaderboard.find((e) => e.player.id === playerId) ?? null;
  },
}));
