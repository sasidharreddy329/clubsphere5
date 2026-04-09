"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAsAdmin } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    const result = await loginAsAdmin({ email, password });
    if (!result.success) {
      pushToast(result.message, "error");
      setLoading(false);
      return;
    }

    pushToast(result.message);
    router.push(result.role === "admin" ? "/admin" : "/");
  };

  return (
    <div className="main-container max-w-xl">
      <SectionHeading
        eyebrow="Organizer Access"
        title="Admin Login"
        subtitle="Use predefined organizer credentials. Non-admin accounts continue as members."
      />
      <div className="glass-card p-6">
        <div className="mb-4 flex gap-2">
          <Link href="/login" className="rounded-lg border border-cyan-500/15 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300">
            User Login
          </Link>
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-300">
            Admin Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm text-slate-300">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="brand-input"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="brand-input"
            />
          </label>
          <p className="rounded-lg border border-cyan-500/12 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            Admin credentials: admin@clubsphere.com / admin123
          </p>
          <button
            type="submit"
            disabled={loading}
            className="brand-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
