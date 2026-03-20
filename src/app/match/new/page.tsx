"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus, Star, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Match } from "@/lib/types";

export default function MatchPage() {
  const { players, stats, fetchAll, updateStat } = useAppStore();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAll().then(() => loadTodayMatch());
  }, [fetchAll]);

  const loadTodayMatch = async () => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) setMatch(data);
    setLoading(false);
  };

  const createMatch = async () => {
    setCreating(true);
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("matches")
      .insert({ date: today })
      .select()
      .single();
    if (data) setMatch(data);
    setCreating(false);
  };

  const updatePlayerStat = useCallback(
    async (
      playerId: string,
      field: "goals" | "assists" | "is_mvp",
      value: number | boolean
    ) => {
      if (!match) return;
      const supabase = createClient();

      const existing = stats.find(
        (s) => s.match_id === match.id && s.player_id === playerId
      );

      if (existing) {
        const updated = { ...existing, [field]: value };
        updateStat(updated);
        await supabase.from("stats").update({ [field]: value }).eq("id", existing.id);
      } else {
        const newStat = {
          match_id: match.id,
          player_id: playerId,
          goals: field === "goals" ? (value as number) : 0,
          assists: field === "assists" ? (value as number) : 0,
          is_mvp: field === "is_mvp" ? (value as boolean) : false,
        };
        const { data } = await supabase
          .from("stats")
          .insert(newStat)
          .select()
          .single();
        if (data) updateStat(data);
      }
    },
    [match, stats, updateStat]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Today&apos;s Match</h1>
      </div>

      {!match ? (
        <div className="text-center py-12">
          <p className="text-muted mb-4">No match started for today.</p>
          <button
            onClick={createMatch}
            disabled={creating}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            {creating ? "Starting..." : "Start Today's Match"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted mb-4">
            {new Date(match.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>

          {players.map((player) => {
            const stat = stats.find(
              (s) => s.match_id === match.id && s.player_id === player.id
            );
            const goals = stat?.goals ?? 0;
            const assists = stat?.assists ?? 0;
            const isMvp = stat?.is_mvp ?? false;

            return (
              <div
                key={player.id}
                className="bg-surface rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{player.name}</span>
                  <button
                    onClick={() =>
                      updatePlayerStat(player.id, "is_mvp", !isMvp)
                    }
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      isMvp
                        ? "bg-gold/20 text-gold"
                        : "text-muted hover:text-gold"
                    }`}
                  >
                    <Star size={14} />
                    MVP
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-12">Goals</span>
                    <button
                      onClick={() =>
                        updatePlayerStat(player.id, "goals", Math.max(0, goals - 1))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold">{goals}</span>
                    <button
                      onClick={() =>
                        updatePlayerStat(player.id, "goals", goals + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted w-12">Assists</span>
                    <button
                      onClick={() =>
                        updatePlayerStat(player.id, "assists", Math.max(0, assists - 1))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold">{assists}</span>
                    <button
                      onClick={() =>
                        updatePlayerStat(player.id, "assists", assists + 1)
                      }
                      className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className="text-center text-muted py-8">
              <p>No players yet.</p>
              <Link href="/players" className="text-primary hover:underline">
                Add players first →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
