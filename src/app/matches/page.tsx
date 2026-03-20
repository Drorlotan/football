"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MatchesPage() {
  const { matches, stats, players, fetchAll, loading } = useAppStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading && matches.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="text-primary" size={28} />
        <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="mb-2">No matches played yet.</p>
          <Link href="/match/new" className="text-primary hover:underline">
            Start a match →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const matchStats = stats.filter(
              (s) => s.match_id === match.id && (s.goals > 0 || s.assists > 0 || s.is_mvp)
            );
            const totalGoals = matchStats.reduce((sum, s) => sum + s.goals, 0);
            const totalAssists = matchStats.reduce((sum, s) => sum + s.assists, 0);
            const mvp = matchStats.find((s) => s.is_mvp);
            const mvpPlayer = mvp
              ? players.find((p) => p.id === mvp.player_id)
              : null;

            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="bg-surface rounded-xl p-4 flex items-center gap-4 hover:bg-surface-light transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {new Date(match.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {matchStats.length} players · {totalGoals}G · {totalAssists}A
                    {mvpPlayer && (
                      <span className="text-gold"> · MVP: {mvpPlayer.name}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
