"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function MatchesPage() {
  const { matches, stats, players, fetchAll, loading, removeMatch } = useAppStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (matchId: string, matchDate: string) => {
    const label = new Date(matchDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!confirm(`Delete match ${label}? All stats for this match will be removed.`)) return;
    setDeleting(matchId);
    const supabase = createClient();
    await supabase.from("stats").delete().eq("match_id", matchId);
    await supabase.from("matches").delete().eq("id", matchId);
    removeMatch(matchId);
    setDeleting(null);
  };

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
              <div key={match.id} className="flex items-center gap-0">
                <Link
                  href={`/match/${match.id}`}
                  className="flex-1 bg-surface rounded-xl p-4 flex items-center gap-4 hover:bg-surface-light transition-colors"
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
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(match.id, match.date)}
                    disabled={deleting === match.id}
                    className="ml-2 p-2 text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
