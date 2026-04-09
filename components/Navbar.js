"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/club", label: "Club" },
  { href: "/team", label: "Team" },
  { href: "/events", label: "Events" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" }
];

const memberNavItems = [
  { href: "/", label: "Home" },
  { href: "/club", label: "Club" },
  { href: "/team", label: "Team" },
  { href: "/events", label: "Events" },
  { href: "/challenges", label: "Challenges" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/assistant", label: "AI Assistant" }
];

function NavLink({ href, label, pathname }) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "border border-cyan-500/30 bg-cyan-500/12 text-cyan-300 shadow-[0_12px_28px_rgba(102,252,241,0.1)]"
          : "text-slate-300 hover:bg-slate-900/80 hover:text-cyan-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navItems = user ? memberNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-500/10 bg-slate-950/78 backdrop-blur-xl">
      <div className="main-container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-slate-100 uppercase">
          Club<span className="text-cyan-300">Sphere</span>
        </Link>

        <nav className="flex max-w-[48vw] items-center gap-1 overflow-x-auto md:max-w-none">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80 hover:text-cyan-300">
                User Login
              </Link>
              <Link
                href="/admin-login"
                className="rounded-xl border border-cyan-500/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 hover:border-cyan-500/35 hover:text-cyan-300"
              >
                Admin Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow hover:shadow-[0_16px_40px_rgba(102,252,241,0.22)]"
              >
                Signup
              </Link>
            </>
          )}

          {user?.role === "member" && (
            <>
              <Link href="/profile" className="rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-slate-900/80 hover:text-cyan-300">
                Profile
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-cyan-500/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 hover:border-cyan-500/35 hover:text-cyan-300"
              >
                Logout
              </button>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link
                href="/admin"
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/12 px-3 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-cyan-500/15 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 hover:border-cyan-500/35 hover:text-cyan-300"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
