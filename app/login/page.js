"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsUser, loginWithProvider } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));

    const result = await loginAsUser({ email, password });
    if (!result.success) {
      pushToast(result.message, "error");
      setLoading(false);
      return;
    }

    pushToast(result.message);
    router.push("/");
  };

  const handleProviderLogin = async (provider) => {
    setProviderLoading(provider);
    await new Promise((r) => setTimeout(r, 300));
    const result = await loginWithProvider(provider);
    if (!result.success) {
      pushToast(result.message, "error");
      setProviderLoading("");
      return;
    }
    pushToast(result.message);
  };

  return (
    <div className="main-container max-w-xl">
      <SectionHeading
        eyebrow="Welcome Back"
        title="User Login"
        subtitle="Sign in with your student account. Admins can use a separate login."
      />
      <div className="glass-card p-6">
        <div className="mb-4 flex gap-2">
          <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/12 px-4 py-2 text-sm font-medium text-cyan-300">
            User Login
          </button>
          <Link href="/admin-login" className="rounded-lg border border-cyan-500/15 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300">
            Admin Login
          </Link>
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
          <button
            type="submit"
            disabled={loading}
            className="brand-button w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login as User"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">or continue with</p>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleProviderLogin("google")}
            disabled={providerLoading !== ""}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-cyan-500/45 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === "google" ? "Connecting..." : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => handleProviderLogin("github")}
            disabled={providerLoading !== ""}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:border-cyan-500/45 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {providerLoading === "github" ? "Connecting..." : "Continue with GitHub"}
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Google and GitHub sign-in use Firebase Authentication. If your browser blocks the popup, the flow will
          continue with a secure redirect instead.
        </p>
      </div>
    </div>
  );
}
