"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  Target,
  HandHelping,
  Star,
  Calendar,
  BarChart3,
  Table,
} from "lucide-react";
import Link from "next/link";

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { fetchAll, getPlayerStats, getPlayerMatchHistory, players } =
    useAppStore();
  const entry = getPlayerStats(id);
  const history = getPlayerMatchHistory(id);
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
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
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

          <MatchHistorySection history={history} />
        </>
      ) : (
        <div className="text-center text-muted py-8">
          No match data yet.
        </div>
      )}
    </div>
  );
}

function MatchHistorySection({
  history,
}: {
  history: { date: string; goals: number; assists: number; is_mvp: boolean }[];
}) {
  const [view, setView] = useState<"graph" | "table">("graph");

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-muted uppercase tracking-wider">
          Match History
        </h3>
        <div className="flex bg-background rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setView("graph")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "graph"
                ? "bg-surface text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-md transition-colors ${
              view === "table"
                ? "bg-surface text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Table size={16} />
          </button>
        </div>
      </div>

      {view === "graph" ? (
        history.length > 1 ? (
          <GoalGraph history={history} />
        ) : (
          <p className="text-sm text-muted text-center py-4">
            Play more matches to see the graph.
          </p>
        )
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-[1fr_48px_48px_48px] gap-2 pb-2 border-b border-border text-xs text-muted uppercase">
            <span>Date</span>
            <span className="text-center">G</span>
            <span className="text-center">A</span>
            <span className="text-center">MVP</span>
          </div>
          {[...history].reverse().map((m, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_48px_48px_48px] gap-2 py-2 border-b border-border/50 text-sm"
            >
              <span className="text-muted">
                {new Date(m.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-center font-medium">{m.goals}</span>
              <span className="text-center">{m.assists}</span>
              <span className="text-center">
                {m.is_mvp ? (
                  <Star size={14} className="inline text-gold" />
                ) : (
                  "—"
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalGraph({
  history,
}: {
  history: { date: string; goals: number; assists: number }[];
}) {
  const maxVal = Math.max(...history.map((h) => Math.max(h.goals, h.assists)), 1);
  const h = 120;
  const w = history.length * 40 + 16;
  const paddingLeft = 36;
  const padding = 20;
  const ticks = Array.from({ length: 4 }, (_, i) => Math.round((maxVal * (3 - i)) / 3));

  const goalPoints = history
    .map((d, i) => {
      const x = paddingLeft + i * ((w - paddingLeft - padding) / Math.max(history.length - 1, 1));
      const y = h - padding - (d.goals / maxVal) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const assistPoints = history
    .map((d, i) => {
      const x = paddingLeft + i * ((w - paddingLeft - padding) / Math.max(history.length - 1, 1));
      const y = h - padding - (d.assists / maxVal) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${Math.max(w, 200)} ${h}`}
        className="w-full"
        style={{ minWidth: Math.max(w, 200) }}
      >
        {/* Grid lines + Y-axis labels */}
        {ticks.map((val, i) => {
          const y = padding + (i / 3) * (h - padding * 2);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={Math.max(w, 200) - padding}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth="0.5"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted"
                fontSize="8"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Assists line */}
        {history.length > 1 && (
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            points={assistPoints}
          />
        )}

        {/* Goals line */}
        {history.length > 1 && (
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            points={goalPoints}
          />
        )}

        {/* Goal dots */}
        {history.map((d, i) => {
          const x = paddingLeft + i * ((w - paddingLeft - padding) / Math.max(history.length - 1, 1));
          const y = h - padding - (d.goals / maxVal) * (h - padding * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill="#22c55e" />;
        })}

        {/* Date labels */}
        {history.map((d, i) => {
          const x = paddingLeft + i * ((w - paddingLeft - padding) / Math.max(history.length - 1, 1));
          return (
            <text
              key={i}
              x={x}
              y={h - 2}
              textAnchor="middle"
              className="fill-muted"
              fontSize="8"
            >
              {new Date(d.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-muted justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-primary inline-block" /> Goals
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 inline-block border-dashed" style={{ backgroundColor: '#38bdf8' }} /> Assists
        </span>
      </div>
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
