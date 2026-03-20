-- =============================================
-- Football App - Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  profile_pic TEXT, -- URL to profile picture
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score_a INT NOT NULL DEFAULT 0,
  score_b INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats table (links players to matches)
CREATE TABLE stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  goals INT NOT NULL DEFAULT 0,
  assists INT NOT NULL DEFAULT 0,
  is_mvp BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Indexes for performance
CREATE INDEX idx_stats_player ON stats(player_id);
CREATE INDEX idx_stats_match ON stats(match_id);
CREATE INDEX idx_matches_date ON matches(date DESC);

-- Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Anyone can read players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read stats" ON stats FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update (you can tighten this later)
CREATE POLICY "Auth users can insert players" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update players" ON players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can insert matches" ON matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update matches" ON matches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can insert stats" ON stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update stats" ON stats FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete stats" ON stats FOR DELETE TO authenticated USING (true);

-- Also allow anon access for development (remove in production)
CREATE POLICY "Anon can read players" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read matches" ON matches FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read stats" ON stats FOR SELECT TO anon USING (true);
