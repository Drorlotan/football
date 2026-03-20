"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Trophy, Target, Star } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const { loading, fetchAll, getLeaderboard } = useAppStore();
  const leaderboard = getLeaderboard();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-gold" size={28} />
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="mb-2">No matches played yet.</p>
          <Link href="/match/new" className="text-primary hover:underline">
            Log your first match →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_repeat(4,_48px)] gap-2 px-3 py-2 text-xs text-muted uppercase tracking-wider">
            <span className="w-6">#</span>
            <span>Player</span>
            <span className="text-center">Pts</span>
            <span className="text-center">
              <Target size={12} className="inline" />
            </span>
            <span className="text-center">W</span>
            <span className="text-center">
              <Star size={12} className="inline" />
            </span>
          </div>

          {leaderboard.map((entry, i) => (
            <Link
              key={entry.player.id}
              href={`/players/${entry.player.id}`}
              className={`grid grid-cols-[auto_1fr_repeat(4,_48px)] gap-2 items-center px-3 py-3 rounded-lg transition-colors ${
                i === 0
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-surface hover:bg-surface-light"
              }`}
            >
              <span
                className={`w-6 text-sm font-bold ${
                  i === 0
                    ? "text-gold"
                    : i === 1
                    ? "text-gray-400"
                    : i === 2
                    ? "text-amber-700"
                    : "text-muted"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="font-medium truncate text-sm">
                  {entry.player.name}
                </div>
                <div className="text-xs text-muted">
                  {entry.matches_played} matches
                </div>
              </div>
              <span className="text-center font-bold text-primary text-sm">
                {entry.points}
              </span>
              <span className="text-center text-sm">{entry.goals}</span>
              <span className="text-center text-sm text-green-400">
                {entry.wins}
              </span>
              <span className="text-center text-sm text-gold">
                {entry.mvp_count}
              </span>
            </Link>
          ))}

          {/* Legend */}
          <div className="flex gap-4 justify-center pt-4 text-xs text-muted">
            <span>Pts = Points</span>
            <span>
              <Target size={10} className="inline" /> = Goals
            </span>
            <span>W = Wins</span>
            <span>
              <Star size={10} className="inline" /> = MVP
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
