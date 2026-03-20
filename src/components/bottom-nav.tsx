"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, PlusCircle, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "Leaderboard", icon: Trophy },
  { href: "/match/new", label: "New Match", icon: PlusCircle },
  { href: "/players", label: "Players", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
