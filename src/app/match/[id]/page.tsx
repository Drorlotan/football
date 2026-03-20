"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ArrowLeft, Star } from "lucide-react";
import Link from "next/link";

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { players, matches, stats, fetchAll } = useAppStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const match = matches.find((m) => m.id === id);
  const matchStats = stats
    .filter((s) => s.match_id === id && (s.goals > 0 || s.assists > 0 || s.is_mvp))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Match Day</h1>
          <p className="text-sm text-muted">
            {new Date(match.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
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
          {matchStats.map((stat) => {
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
          })}
        </div>
      )}
    </div>
  );
}
