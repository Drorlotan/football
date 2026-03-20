"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Star, Plus, Minus, Shield } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { players, matches, stats, fetchAll, updateStat } = useAppStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchAll();
    if (ADMIN_EMAIL) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setIsAdmin(
          data.user?.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase()
        );
      });
    }
  }, [fetchAll]);

  const match = matches.find((m) => m.id === id);
  const matchStats = editMode
    ? stats
        .filter((s) => s.match_id === id)
        .sort((a, b) => {
          const pa = players.find((p) => p.id === a.player_id);
          const pb = players.find((p) => p.id === b.player_id);
          return (pa?.name ?? "").localeCompare(pb?.name ?? "");
        })
    : stats
        .filter((s) => s.match_id === id && (s.goals > 0 || s.assists > 0 || s.is_mvp))
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  const handleUpdateStat = useCallback(
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

  if (!match) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  const totalGoals = matchStats.reduce((sum, s) => sum + s.goals, 0);
  const totalAssists = matchStats.reduce((sum, s) => sum + s.assists, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/matches" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Match Day</h1>
          <p className="text-sm text-muted">
            {new Date(match.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditMode(!editMode)}
            className={`p-2 rounded-lg transition-colors ${editMode ? 'text-gold bg-gold/10' : 'text-muted hover:text-foreground'}`}
            title={editMode ? 'Exit edit mode' : 'Edit stats'}
          >
            <Shield size={18} />
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-3 mb-6">
        <div className="bg-surface rounded-xl p-4 flex-1 text-center">
          <div className="text-2xl font-bold">{totalGoals}</div>
          <div className="text-xs text-muted">Goals</div>
        </div>
        <div className="bg-surface rounded-xl p-4 flex-1 text-center">
          <div className="text-2xl font-bold">{totalAssists}</div>
          <div className="text-xs text-muted">Assists</div>
        </div>
        <div className="bg-surface rounded-xl p-4 flex-1 text-center">
          <div className="text-2xl font-bold">{matchStats.length}</div>
          <div className="text-xs text-muted">Players</div>
        </div>
      </div>

      {matchStats.length === 0 ? (
        <div className="text-center text-muted py-8">
          No stats recorded for this match.
        </div>
      ) : (
        <div className="bg-surface rounded-xl p-4">
          <div className="grid grid-cols-[1fr_48px_48px_48px] gap-2 pb-2 border-b border-border text-xs text-muted uppercase tracking-wider">
            <span>Player</span>
            <span className="text-center">G</span>
            <span className="text-center">A</span>
            <span className="text-center">MVP</span>
          </div>
          {editMode ? (
            players.map((player) => {
              const stat = stats.find(
                (s) => s.match_id === id && s.player_id === player.id
              );
              const goals = stat?.goals ?? 0;
              const assists = stat?.assists ?? 0;
              const isMvp = stat?.is_mvp ?? false;
              if (!editMode && goals === 0 && assists === 0 && !isMvp) return null;
              return (
                <div
                  key={player.id}
                  className="py-3 border-b border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{player.name}</span>
                    <button
                      onClick={() => handleUpdateStat(player.id, "is_mvp", !isMvp)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        isMvp ? "bg-gold/20 text-gold" : "text-muted hover:text-gold"
                      }`}
                    >
                      <Star size={12} />
                      MVP
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-12">Goals</span>
                      <button
                        onClick={() => handleUpdateStat(player.id, "goals", Math.max(0, goals - 1))}
                        className="w-7 h-7 rounded-lg bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center font-bold text-sm">{goals}</span>
                      <button
                        onClick={() => handleUpdateStat(player.id, "goals", goals + 1)}
                        className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-12">Assists</span>
                      <button
                        onClick={() => handleUpdateStat(player.id, "assists", Math.max(0, assists - 1))}
                        className="w-7 h-7 rounded-lg bg-surface-light flex items-center justify-center text-muted hover:text-foreground"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center font-bold text-sm">{assists}</span>
                      <button
                        onClick={() => handleUpdateStat(player.id, "assists", assists + 1)}
                        className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            matchStats.map((stat) => {
              const player = players.find((p) => p.id === stat.player_id);
              return (
                <Link
                  key={stat.id}
                  href={`/players/${stat.player_id}`}
                  className="grid grid-cols-[1fr_48px_48px_48px] gap-2 py-3 border-b border-border/50 text-sm items-center hover:bg-surface-light transition-colors -mx-4 px-4"
                >
                  <span className="font-medium truncate">
                    {player?.name ?? "Unknown"}
                  </span>
                  <span className="text-center font-bold">{stat.goals}</span>
                  <span className="text-center">{stat.assists}</span>
                  <span className="text-center">
                    {stat.is_mvp ? (
                      <Star size={14} className="inline text-gold" />
                    ) : (
                      "—"
                    )}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
