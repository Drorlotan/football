"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Target,
  HandHelping,
  Star,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { fetchAll, getPlayerStats, players } = useAppStore();
  const entry = getPlayerStats(id);
  const player = players.find((p) => p.id === id);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!player) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/players" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{player.name}</h2>
          <p className="text-sm text-muted">
            {entry?.matches_played ?? 0} matches played
          </p>
        </div>
      </div>

      {entry && entry.matches_played > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Target size={18} className="text-blue-400" />}
            label="Goals"
            value={entry.goals}
          />
          <StatCard
            icon={<HandHelping size={18} className="text-purple-400" />}
            label="Assists"
            value={entry.assists}
          />
          <StatCard
            icon={<Star size={18} className="text-gold" />}
            label="MVPs"
            value={entry.mvp_count}
          />
          <StatCard
            icon={<Calendar size={18} className="text-muted" />}
            label="Matches"
            value={entry.matches_played}
          />
        </div>
      ) : (
        <div className="text-center text-muted py-8">
          No match data yet.
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-surface rounded-xl p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-lg font-bold">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </div>
  );
}
