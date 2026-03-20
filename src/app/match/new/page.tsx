"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Minus,
  Save,
  Check,
  Star,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Stat } from "@/lib/types";

type PlayerMatchState = {
  selected: boolean;
  team: "A" | "B";
  goals: number;
  assists: number;
  is_mvp: boolean;
};

export default function NewMatchPage() {
  const router = useRouter();
  const { players, fetchPlayers, addMatch } = useAppStore();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [playerStates, setPlayerStates] = useState<
    Record<string, PlayerMatchState>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const updatePlayer = useCallback(
    (playerId: string, update: Partial<PlayerMatchState>) => {
      setPlayerStates((prev) => ({
        ...prev,
        [playerId]: { ...prev[playerId], ...update },
      }));
    },
    []
  );

  const togglePlayer = useCallback(
    (playerId: string) => {
      setPlayerStates((prev) => {
        const current = prev[playerId];
        if (current?.selected) {
          const { [playerId]: _, ...rest } = prev;
          void _;
          return rest;
        }
        return {
          ...prev,
          [playerId]: {
            selected: true,
            team: "A",
            goals: 0,
            assists: 0,
            is_mvp: false,
          },
        };
      });
    },
    []
  );

  const selectedPlayers = Object.entries(playerStates).filter(
    ([, s]) => s.selected
  );
  const teamA = selectedPlayers.filter(([, s]) => s.team === "A");
  const teamB = selectedPlayers.filter(([, s]) => s.team === "B");
  const scoreA = teamA.reduce(
    (sum, [, s]) => sum + s.goals,
    0
  );
  const scoreB = teamB.reduce(
    (sum, [, s]) => sum + s.goals,
    0
  );

  const handleSave = async () => {
    if (selectedPlayers.length < 2) {
      setError("Select at least 2 players");
      return;
    }
    if (teamA.length === 0 || teamB.length === 0) {
      setError("Both teams need at least 1 player");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();

    // Insert match
    const { data: matchData, error: matchErr } = await supabase
      .from("matches")
      .insert({ date, score_a: scoreA, score_b: scoreB })
      .select()
      .single();

    if (matchErr || !matchData) {
      setError(matchErr?.message ?? "Failed to create match");
      setSaving(false);
      return;
    }

    // Insert stats
    const statsToInsert = selectedPlayers.map(([playerId, s]) => ({
      match_id: matchData.id,
      player_id: playerId,
      team: s.team,
      goals: s.goals,
      assists: s.assists,
      is_mvp: s.is_mvp,
    }));

    const { data: statsData, error: statsErr } = await supabase
      .from("stats")
      .insert(statsToInsert)
      .select();

    if (statsErr) {
      setError(statsErr.message);
      setSaving(false);
      return;
    }

    // Optimistic update
    addMatch(matchData, statsData as Stat[]);
    router.push("/");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Log Match</h1>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        <label className="block text-xs text-muted uppercase tracking-wider mb-2">
          Match Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Score display */}
      <div className="flex items-center justify-center gap-4 mb-6 py-4 bg-surface rounded-xl">
        <div className="text-center">
          <div className="text-xs text-team-a font-bold uppercase mb-1">
            Team A
          </div>
          <div className="text-4xl font-bold text-team-a">{scoreA}</div>
        </div>
        <div className="text-2xl text-muted font-bold">vs</div>
        <div className="text-center">
          <div className="text-xs text-team-b font-bold uppercase mb-1">
            Team B
          </div>
          <div className="text-4xl font-bold text-team-b">{scoreB}</div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="mb-4">
        <h2 className="text-sm text-muted uppercase tracking-wider mb-3">
          Select Players ({selectedPlayers.length} selected)
        </h2>
        <div className="space-y-2">
          {players.map((player) => {
            const state = playerStates[player.id];
            const isSelected = state?.selected;

            return (
              <div key={player.id} className="space-y-0">
                {/* Player row: selection + team toggle */}
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? state.team === "A"
                        ? "bg-team-a/10 border border-team-a/30"
                        : "bg-team-b/10 border border-team-b/30"
                      : "bg-surface hover:bg-surface-light"
                  }`}
                >
                  {/* Select checkbox */}
                  <button
                    onClick={() => togglePlayer(player.id)}
                    className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </button>

                  <span className="flex-1 font-medium text-sm truncate">
                    {player.name}
                  </span>

                  {isSelected && (
                    <>
                      {/* Team toggle */}
                      <div className="flex rounded-md overflow-hidden border border-border">
                        <button
                          onClick={() =>
                            updatePlayer(player.id, { team: "A" })
                          }
                          className={`px-2 py-1 text-xs font-bold ${
                            state.team === "A"
                              ? "bg-team-a text-white"
                              : "text-muted"
                          }`}
                        >
                          A
                        </button>
                        <button
                          onClick={() =>
                            updatePlayer(player.id, { team: "B" })
                          }
                          className={`px-2 py-1 text-xs font-bold ${
                            state.team === "B"
                              ? "bg-team-b text-white"
                              : "text-muted"
                          }`}
                        >
                          B
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Stats row (goals, assists, MVP) */}
                {isSelected && (
                  <div className="flex items-center gap-4 px-3 py-2 ml-9">
                    {/* Goals */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted w-10">Goals</span>
                      <button
                        onClick={() =>
                          updatePlayer(player.id, {
                            goals: Math.max(0, state.goals - 1),
                          })
                        }
                        className="w-7 h-7 rounded bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {state.goals}
                      </span>
                      <button
                        onClick={() =>
                          updatePlayer(player.id, {
                            goals: state.goals + 1,
                          })
                        }
                        className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Assists */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted w-10">Ast</span>
                      <button
                        onClick={() =>
                          updatePlayer(player.id, {
                            assists: Math.max(0, state.assists - 1),
                          })
                        }
                        className="w-7 h-7 rounded bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {state.assists}
                      </span>
                      <button
                        onClick={() =>
                          updatePlayer(player.id, {
                            assists: state.assists + 1,
                          })
                        }
                        className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* MVP */}
                    <button
                      onClick={() =>
                        updatePlayer(player.id, { is_mvp: !state.is_mvp })
                      }
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        state.is_mvp
                          ? "bg-gold/20 text-gold"
                          : "text-muted hover:text-gold"
                      }`}
                    >
                      <Star size={14} />
                      MVP
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedPlayers.length < 2}
        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Save size={18} />
        {saving ? "Saving..." : "Save Match"}
      </button>
    </div>
  );
}
