"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">⚽ Football</h1>
          <p className="text-muted text-sm">Track your squad&apos;s stats</p>
        </div>

        {user ? (
          <div className="bg-surface rounded-xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl mx-auto">
              {(user.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-xs text-muted mt-1">Logged in</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 mx-auto text-sm text-muted hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : sent ? (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
            <Mail className="mx-auto mb-3 text-primary" size={32} />
            <p className="font-medium">Check your email!</p>
            <p className="text-sm text-muted mt-1">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="your@email.com"
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleLogin}
                disabled={loading || !email.trim()}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Mail size={18} />
                )}
                Send Magic Link
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-surface hover:bg-surface-light border border-border text-foreground font-medium py-3 rounded-lg transition-colors cursor-pointer"
            >
              Continue with Google
            </button>
          </>
        )}

        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
