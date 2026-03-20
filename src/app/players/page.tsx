"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { Users, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlayersPage() {
  const { players, fetchPlayers, addPlayer } = useAppStore();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("players")
      .insert({ name: trimmed })
      .select()
      .single();

    if (data && !error) {
      addPlayer(data);
      setName("");
    }
    setAdding(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <Users className="text-primary" size={24} />
        <h1 className="text-2xl font-bold tracking-tight">Players</h1>
      </div>

      {/* Add player form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Player name..."
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !name.trim()}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
        </button>
      </div>

      {/* Players list */}
      <div className="space-y-2">
        {players.map((player) => (
          <Link
            key={player.id}
            href={`/players/${player.id}`}
            className="flex items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-light rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{player.name}</span>
          </Link>
        ))}
        {players.length === 0 && (
          <p className="text-center text-muted py-8">
            No players yet. Add your first player above!
          </p>
        )}
      </div>
    </div>
  );
}
