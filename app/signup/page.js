"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 450));
    const result = await signup(form);
    if (!result.success) {
      pushToast(result.message, "error");
      setLoading(false);
      return;
    }
    pushToast(result.message);
    router.push("/login");
  };

  return (
    <div className="main-container max-w-xl">
      <SectionHeading
        eyebrow="Join ClubSphere"
        title="Create Member Account"
        subtitle='Every signup is assigned role "member" by default.'
      />
      <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
        <label className="block text-sm text-slate-300">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="brand-input"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="brand-input"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Password
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="brand-input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="brand-button w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>
      </form>
    </div>
  );
}
