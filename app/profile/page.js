"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Image from "next/image";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

const isRenderableImageSrc = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/"));

const heatClass = (level) => {
  if (level === 0) return "bg-slate-800";
  if (level === 1) return "bg-cyan-950";
  if (level === 2) return "bg-cyan-700";
  if (level === 3) return "bg-cyan-500/70";
  return "bg-cyan-500";
};

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { pushToast } = useToast();
  const {
    events,
    isRegistered,
    getUserEmailNotifications,
    getUserProfile,
    updateUserProfile,
    scoreLeaderboard,
    getUserChallengeRank,
    getUserAnalytics
  } = useClubData();

  const joined = events.filter((event) => isRegistered({ userEmail: user?.email, eventId: event.id }));
  const emails = getUserEmailNotifications(user?.email);
  const savedProfile = getUserProfile(user?.email);
  const me = scoreLeaderboard.find((entry) => entry.email === user?.email?.toLowerCase());
  const score = me?.score || 0;
  const rank = getUserChallengeRank(user?.email);
  const analytics = getUserAnalytics(user?.email);

  const [form, setForm] = useState({
    photo: savedProfile.avatar || user?.photo || "",
    bio: savedProfile.bio || "",
    github: savedProfile.github || "",
    linkedin: savedProfile.linkedin || "",
    techTags: (savedProfile.techTags || []).join(", "),
    notifyEmail: savedProfile.notifyEmail ?? true,
    notifyPush: savedProfile.notifyPush ?? true
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });

  const tags = useMemo(() => form.techTags.split(",").map((tag) => tag.trim()).filter(Boolean), [form.techTags]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      pushToast("Please login to edit your profile.", "error");
      return;
    }
    const result = await updateUserProfile(user.email, {
      avatar: form.photo,
      bio: form.bio,
      github: form.github,
      linkedin: form.linkedin,
      techTags: tags,
      notifyEmail: form.notifyEmail,
      notifyPush: form.notifyPush
    });
    pushToast(result.message, result.success ? undefined : "error");
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const result = await changePassword(passwordForm);
    pushToast(result.message, result.success ? undefined : "error");
    if (result.success) {
      setPasswordForm({ currentPassword: "", nextPassword: "" });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      pushToast("Please choose a valid image file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        pushToast("Could not read the selected image.", "error");
        return;
      }
      setForm((prev) => ({ ...prev, photo: result }));
      pushToast("Photo selected. Save profile to apply it.");
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="main-container max-w-3xl space-y-6">
        <SectionHeading
          eyebrow="Authentication"
          title="Personal Dashboard"
          subtitle="Login as a member or admin to access your profile, joined events, challenge scores, rank, and account settings."
        />
        <div className="glass-card space-y-4 p-6">
          <p className="text-sm text-slate-300">
            You are currently browsing as a <span className="font-semibold text-cyan-300">visitor</span>.
          </p>
          <p className="text-sm text-slate-400">
            Visitors can explore the public pages, while members and admins get role-based access to profiles, dashboards, and platform tools.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="brand-button">
              Login
            </Link>
            <Link href="/signup" className="brand-button-secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container space-y-6">
      <SectionHeading eyebrow="Member Dashboard" title="Profile" subtitle="Manage your profile, joined events, challenge scores, rank, and account settings." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card p-6">
          <p className="text-sm text-slate-400">Name</p>
          <p className="text-lg text-cyan-300">{user?.name || "Guest"}</p>
          <p className="mt-3 text-sm text-slate-400">Email</p>
          <p className="text-lg text-slate-100">{user?.email || "-"}</p>
          <p className="mt-3 text-sm text-slate-400">Role</p>
          <p className="text-lg capitalize text-cyan-200">{user?.role || "-"}</p>
          <p className="mt-3 text-sm text-slate-400">Challenge Score</p>
          <p className="text-lg text-slate-100">{score}</p>
          <p className="mt-3 text-sm text-slate-400">Rank</p>
          <p className="text-lg text-cyan-300">
            #{rank || "-"} • {analytics.rankBadge}
          </p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-cyan-300">Joined Events</h3>
          <div className="mt-3 space-y-2">
            {joined.length === 0 ? <p className="text-sm text-slate-400">No event registrations yet.</p> : null}
            {joined.map((event) => (
              <div key={event.id} className="rounded-lg border border-cyan-500/12 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                {event.title}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-cyan-300">Email Notifications</h3>
          <div className="mt-3 max-h-60 space-y-2 overflow-auto">
            {emails.length === 0 ? <p className="text-sm text-slate-400">No email updates yet.</p> : null}
            {emails.map((mail) => (
              <div key={mail.id} className="rounded-lg border border-cyan-500/12 bg-slate-900 px-3 py-3">
                <p className="text-sm font-medium text-slate-100">{mail.subject}</p>
                <p className="mt-1 text-sm text-slate-300">{mail.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-cyan-300">Personal Analytics</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Total Score</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{analytics.totalScore}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Participation Rate</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{analytics.participationRate}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Win Rate</p>
              <p className="mt-2 text-xl font-semibold text-slate-100">{analytics.winRate}%</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {analytics.scoreTimeline.length === 0 ? (
              <p className="text-sm text-slate-400">No score activity yet.</p>
            ) : (
              analytics.scoreTimeline.map((point) => (
                <div key={point.date}>
                  <div className="mb-1 flex justify-between text-xs text-slate-300">
                    <span>{new Date(point.date).toLocaleDateString()}</span>
                    <span>{point.score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-700 to-cyan-500"
                      style={{ width: `${Math.min(100, point.score / 6)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-cyan-300">Activity Heatmap</h3>
          <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-14">
            {analytics.heatmap.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} submissions`}
                className={`h-5 rounded ${heatClass(cell.level)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="glass-card space-y-4 p-6">
        <h3 className="text-lg font-semibold text-cyan-300">Account Settings</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Profile Photo
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mt-1 w-full rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950"
            />
          </label>
          <div className="rounded-lg border border-cyan-500/12 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-300">Photo Preview</p>
            {isRenderableImageSrc(form.photo) ? (
              <Image
                src={form.photo}
                alt={user?.name || "Profile photo"}
                width={96}
                height={96}
                className="mt-3 h-24 w-24 rounded-2xl object-cover"
              />
            ) : (
              <div className="mt-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-sm text-slate-400">
                No photo
              </div>
            )}
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, photo: "" }))}
              className="mt-3 text-xs text-slate-400 hover:text-cyan-300"
            >
              Remove Photo
            </button>
          </div>
          <label className="block text-sm text-slate-300 md:col-span-2">
            Bio
            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="brand-input h-24" />
          </label>
          <label className="block text-sm text-slate-300">
            GitHub
            <input value={form.github} onChange={(e) => setForm((p) => ({ ...p, github: e.target.value }))} className="brand-input" />
          </label>
          <label className="block text-sm text-slate-300">
            LinkedIn
            <input value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} className="brand-input" />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            Tech Stack Tags (comma separated)
            <input value={form.techTags} onChange={(e) => setForm((p) => ({ ...p, techTags: e.target.value }))} className="brand-input" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.notifyEmail} onChange={(e) => setForm((p) => ({ ...p, notifyEmail: e.target.checked }))} />
            Email notifications
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.notifyPush} onChange={(e) => setForm((p) => ({ ...p, notifyPush: e.target.checked }))} />
            Push notifications
          </label>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-glow">Save Profile</button>
      </form>

      <form onSubmit={savePassword} className="glass-card space-y-4 p-6">
        <h3 className="text-lg font-semibold text-cyan-300">Password Settings</h3>
        <p className="text-sm text-slate-400">
          Email/password accounts can update their password here. Google and GitHub accounts continue through their provider.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Current Password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              className="brand-input"
            />
          </label>
          <label className="block text-sm text-slate-300">
            New Password
            <input
              type="password"
              value={passwordForm.nextPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, nextPassword: e.target.value }))}
              className="brand-input"
            />
          </label>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-glow">
          Update Password
        </button>
      </form>
    </div>
  );
}
