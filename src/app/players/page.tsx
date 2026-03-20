"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus, ArrowLeft, Search, X, Trash2 } from "lucide-react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function PlayersPage() {
  const { players, fetchPlayers, addPlayer, removePlayer } = useAppStore();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
    if (ADMIN_EMAIL) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setIsAdmin(data.user?.email === ADMIN_EMAIL);
      });
    }
  }, [fetchPlayers]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setAdding(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("players")
      .insert({ name: trimmed })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      addPlayer(data);
      setName("");
      setShowAdd(false);
    }
    setAdding(false);
  };

  const handleDelete = async (playerId: string, playerName: string) => {
    if (!confirm(`Delete ${playerName}? This will remove all their stats.`)) return;
    setDeleting(playerId);
    const supabase = createClient();
    await supabase.from("stats").delete().eq("player_id", playerId);
    const { error: delError } = await supabase.from("players").delete().eq("id", playerId);
    if (delError) {
      setError(delError.message);
    } else {
      removePlayer(playerId);
    }
    setDeleting(null);
  };

  const filtered = search.trim()
    ? players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <Users className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
        <button
          onClick={() => { setShowAdd(!showAdd); setError(null); }}
          className="ml-auto bg-primary hover:bg-primary-dark text-white p-2 rounded-lg transition-colors"
        >
          {showAdd ? <X size={18} /> : <UserPlus size={18} />}
        </button>
      </div>

      {/* Add player form */}
      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="New player name..."
            autoFocus
            className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            {adding ? "..." : "Add"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted focus:outline-none focus:border-primary text-sm"
        />
      </div>

      {/* Players list */}
      <div className="space-y-2">
        {filtered.map((player) => (
          <div key={player.id} className="flex items-center gap-0">
            <Link
              href={`/players/${player.id}`}
              className="flex-1 flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-light rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{player.name}</span>
            </Link>
            {isAdmin && (
              <button
                onClick={() => handleDelete(player.id, player.name)}
                disabled={deleting === player.id}
                className="ml-2 p-2 text-muted hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted py-8">
            {search.trim() ? "No players found." : "No players yet. Tap + to add your first player!"}
          </p>
        )}
      </div>
    </div>
  );
}
