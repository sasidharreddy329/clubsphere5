"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
    </label>
  );
}

const isRenderableImageSrc = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/"));

function FileUploadField({ label, accept = "image/*", onFileSelected, helperText }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onFileSelected?.(file);
    event.target.value = "";
  };

  return (
    <label className="block text-sm text-slate-300">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
      />
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="block text-sm text-slate-300">
      {label}
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
      />
    </label>
  );
}

function RichTextEditor({ label, value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const runCommand = (command) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <label className="block text-sm text-slate-300">
      {label}
      <div className="mt-1 rounded-lg border border-slate-700 bg-slate-900">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 p-2">
          <button type="button" onClick={() => runCommand("bold")} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
            Bold
          </button>
          <button type="button" onClick={() => runCommand("italic")} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
            Italic
          </button>
          <button type="button" onClick={() => runCommand("insertUnorderedList")} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
            Bullet List
          </button>
          <button type="button" onClick={() => runCommand("insertParagraph")} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-200">
            Paragraph
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="min-h-32 p-3 text-sm text-slate-100 outline-none"
        />
      </div>
    </label>
  );
}

function MiniBarChart({ title, items, colorClass = "bg-cyan-500" }) {
  const max = Math.max(1, ...items.map((item) => item.value || 0));

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-slate-400">No data yet.</p> : null}
        {items.slice(-8).map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const EVENT_CATEGORIES = ["Workshop", "Hackathon", "Talk", "Competition", "Social"];
const EVENT_MODES = ["Offline", "Online", "Hybrid"];
const CHALLENGE_CATEGORIES = ["UI/UX", "Full-Stack", "API Design", "Open Innovation"];
const CHALLENGE_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TEAM_ROLES = ["Club Lead", "Core Team", "Member"];
const TEAM_DOMAINS = ["Web", "AI", "Design", "Product", "Backend", "Mobile", "Community"];
const emptyEventForm = {
  title: "",
  date: "",
  time: "",
  venue: "",
  mode: "Offline",
  category: "Workshop",
  banner: "",
  description: "",
  richDescription: "<p></p>",
  scheduleText: "",
  speakersText: "",
  hostsText: "",
  faqsText: "",
  results: "",
  winnerHighlightsText: "",
  galleryLink: "",
  published: true
};
const emptyChallengeForm = {
  title: "",
  category: "UI/UX",
  difficulty: "Easy",
  deadline: "",
  description: "",
  problemStatement: "<p></p>",
  maxScore: "100",
  maxTimeBonus: "10"
};
const emptyProjectForm = {
  title: "",
  tech: "",
  thumbnail: "",
  description: "",
  longDescription: "",
  github: "",
  demo: "",
  documentation: "",
  year: "",
  domain: "",
  membersText: "",
  screenshotsText: "",
  featured: false,
  archived: false
};

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const {
    clubs,
    events,
    challenges,
    projects,
    team,
    gallery,
    stats,
    adminAnalytics,
    adminAuditLog,
    bannedUsers,
    addClub,
    editClub,
    setClubLeader,
    deleteClub,
    addEvent,
    editEvent,
    deleteEvent,
    addChallenge,
    editChallenge,
    deleteChallenge,
    addProject,
    editProject,
    deleteProject,
    addTeamMember,
    editTeamMember,
    deleteTeamMember,
    addGalleryImage,
    addGalleryItems,
    deleteGalleryImage,
    addAnnouncement,
    getAllSubmissions,
    reviewChallengeSubmission,
    getClubRegistrationsByClub,
    addAdminAuditLog,
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    promoteUser,
    banUser,
    unbanUser
  } = useClubData();

  const [announcement, setAnnouncement] = useState("");
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [editingUserEmail, setEditingUserEmail] = useState("");
  const [userRefreshKey, setUserRefreshKey] = useState(0);
  const [clubForm, setClubForm] = useState({ name: "", description: "", points: "0" });
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState("");
  const [challengeForm, setChallengeForm] = useState(emptyChallengeForm);
  const [editingChallengeId, setEditingChallengeId] = useState("");
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [teamForm, setTeamForm] = useState({
    name: "",
    role: "Member",
    batch: "",
    domain: "Web",
    expertise: "",
    photo: "",
    github: "",
    linkedin: "",
    tagsText: "",
    alumni: false
  });
  const [editingTeamId, setEditingTeamId] = useState("");
  const [galleryForm, setGalleryForm] = useState({ album: "", eventDate: "", type: "image", src: "", bulkText: "" });

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const handleImageFile = async (file, applyValue, label) => {
    if (!file.type.startsWith("image/")) {
      pushToast(`Please select a valid image file for ${label}.`, "error");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      if (!dataUrl) {
        pushToast(`Could not read the selected ${label}.`, "error");
        return;
      }
      applyValue(dataUrl);
      pushToast(`${label} uploaded.`);
    } catch {
      pushToast(`Could not process the selected ${label}.`, "error");
    }
  };

  const handleGalleryFile = async (file) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      pushToast("Please upload an image or video file for the gallery.", "error");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      if (!dataUrl) {
        pushToast("Could not read the selected gallery media.", "error");
        return;
      }
      setGalleryForm((prev) => ({
        ...prev,
        src: dataUrl,
        type: isVideo ? "video" : "image"
      }));
      pushToast("Gallery media uploaded.");
    } catch {
      pushToast("Could not process the selected gallery media.", "error");
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") router.replace("/");
  }, [router, user]);

  const submissions = getAllSubmissions();
  const users = useMemo(() => listUsers(), [listUsers, userRefreshKey, clubs, events, challenges, projects, team, gallery]);

  const resetUserForm = () => {
    setUserForm({ name: "", email: "", password: "", role: "member" });
    setEditingUserEmail("");
  };

  const refreshUsers = () => setUserRefreshKey((value) => value + 1);

  const resetEventForm = () => {
    setEventForm(emptyEventForm);
    setEditingEventId("");
  };

  const resetChallengeForm = () => {
    setChallengeForm(emptyChallengeForm);
    setEditingChallengeId("");
  };

  const resetProjectForm = () => {
    setProjectForm(emptyProjectForm);
    setEditingProjectId("");
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: "",
      role: "Member",
      batch: "",
      domain: "Web",
      expertise: "",
      photo: "",
      github: "",
      linkedin: "",
      tagsText: "",
      alumni: false
    });
    setEditingTeamId("");
  };

  const buildEventPayload = () => ({
    title: eventForm.title,
    date: eventForm.date,
    time: eventForm.time,
    venue: eventForm.venue,
    mode: eventForm.mode,
    category: eventForm.category,
    banner: eventForm.banner,
    description: eventForm.description,
    richDescription: eventForm.richDescription,
    schedule: eventForm.scheduleText.split("\n").map((item) => item.trim()).filter(Boolean),
    speakers: eventForm.speakersText.split("\n").map((item) => item.trim()).filter(Boolean),
    hosts: eventForm.hostsText.split("\n").map((item) => item.trim()).filter(Boolean),
    faqs: eventForm.faqsText.split("\n").map((item) => item.trim()).filter(Boolean),
    results: eventForm.results,
    winnerHighlights: eventForm.winnerHighlightsText.split("\n").map((item) => item.trim()).filter(Boolean),
    galleryLink: eventForm.galleryLink,
    published: eventForm.published
  });

  const buildChallengePayload = () => ({
    title: challengeForm.title,
    category: challengeForm.category,
    difficulty: challengeForm.difficulty,
    deadline: challengeForm.deadline,
    description: challengeForm.description,
    problemStatement: challengeForm.problemStatement,
    scoringRules: {
      maxScore: Number(challengeForm.maxScore) || 100,
      maxTimeBonus: Number(challengeForm.maxTimeBonus) || 0
    }
  });

  const buildProjectPayload = () => ({
    title: projectForm.title,
    tech: projectForm.tech,
    thumbnail: projectForm.thumbnail,
    description: projectForm.description,
    longDescription: projectForm.longDescription,
    github: projectForm.github,
    demo: projectForm.demo,
    documentation: projectForm.documentation,
    year: projectForm.year,
    domain: projectForm.domain,
    members: projectForm.membersText.split("\n").map((item) => item.trim()).filter(Boolean),
    screenshots: projectForm.screenshotsText.split("\n").map((item) => item.trim()).filter(Boolean),
    featured: projectForm.featured,
    archived: projectForm.archived,
    likes: 0,
    likedBy: []
  });

  const notifyReport = (report, successLabel) => {
    if (!report?.configured) {
      pushToast(`${successLabel}. In-app notifications sent to ${report?.recipients || 0}. Configure EmailJS for real emails.`, "error");
      return;
    }
    pushToast(`${successLabel}. Email sent: ${report.sent}, failed: ${report.failed}.`);
  };

  const logAction = (action, target, details = "") => {
    addAdminAuditLog({
      actorEmail: user?.email || "admin",
      action,
      target,
      details
    });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="main-container space-y-8">
      <SectionHeading eyebrow="Admin Panel" title="ClubSphere Operations" subtitle="Manage platform modules, users, submissions, and announcements." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Total Users</p><p className="text-2xl font-bold text-white">{stats.totalUsers}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Events</p><p className="text-2xl font-bold text-white">{stats.totalEvents}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Submissions</p><p className="text-2xl font-bold text-white">{stats.totalSubmissions}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Projects</p><p className="text-2xl font-bold text-white">{stats.totalProjects}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Registrations</p><p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p></div>
        <div className="glass-card p-4"><p className="text-xs text-slate-400">Active Users</p><p className="text-2xl font-bold text-white">{stats.activeUsers}</p></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <MiniBarChart
          title="Signups"
          items={adminAnalytics.signupsByDay}
          colorClass="bg-cyan-500"
        />
        <MiniBarChart
          title="Registrations by Event"
          items={adminAnalytics.registrationsByEvent}
          colorClass="bg-violet-500"
        />
        <MiniBarChart
          title="Submissions by Challenge"
          items={adminAnalytics.submissionsByChallenge}
          colorClass="bg-emerald-500"
        />
      </section>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white">Announcement Publisher</h3>
        <div className="mt-3 flex gap-2">
          <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Type announcement..." className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
          <button
            onClick={async () => {
              if (!announcement.trim()) return;
              const result = await addAnnouncement(announcement.trim());
              if (!result.success) {
                pushToast(result.message, "error");
                return;
              }
              await logAction("Announcement Published", "Platform", announcement.trim());
              setAnnouncement("");
              pushToast(result.message || "Announcement published.");
            }}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Publish
          </button>
        </div>
      </section>

      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">User Management</h3>
            <p className="mt-1 text-sm text-slate-400">Add, update, remove, promote, or ban accounts.</p>
          </div>
          {editingUserEmail ? (
            <button
              type="button"
              onClick={resetUserForm}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const result = editingUserEmail ? await updateUser(editingUserEmail, userForm) : await createUser(userForm);
            if (!result.success) {
              pushToast(result.message, "error");
              return;
            }
            pushToast(result.message);
            await logAction(editingUserEmail ? "User Updated" : "User Created", userForm.email, userForm.role);
            resetUserForm();
            refreshUsers();
          }}
          className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2"
        >
          <Input label="Name" value={userForm.name} onChange={(v) => setUserForm((p) => ({ ...p, name: v }))} />
          <Input label="Email" type="email" value={userForm.email} onChange={(v) => setUserForm((p) => ({ ...p, email: v }))} />
          <Input
            label={editingUserEmail ? "New Password (optional)" : "Password"}
            type="password"
            value={userForm.password}
            onChange={(v) => setUserForm((p) => ({ ...p, password: v }))}
          />
          <label className="block text-sm text-slate-300">
            Role
            <select
              value={userForm.role}
              onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">
              {editingUserEmail ? "Update User" : "Add User"}
            </button>
            <button
              type="button"
              onClick={resetUserForm}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          {users.map((account) => (
            <div key={account.email} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-sm text-slate-200">
                  {account.name} ({account.email}) <span className="text-cyan-200">[{account.role}]</span>
                </p>
                <p className="text-xs text-slate-500">
                  Auth: {account.authType || "credentials"}
                  {bannedUsers.includes(account.email.toLowerCase()) ? " • Banned" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUserEmail(account.email);
                    setUserForm({
                      name: account.name || "",
                      email: account.email || "",
                      password: "",
                      role: account.role || "member"
                    });
                  }}
                  className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const nextPassword = window.prompt("Enter a new password for this user");
                    if (!nextPassword) return;
                    const result = await resetUserPassword(account.email, nextPassword);
                    pushToast(result.message, result.success ? undefined : "error");
                    if (result.success) await logAction("Password Reset", account.email, "Admin reset password");
                  }}
                  className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-100"
                >
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await deleteUser(account.email);
                    if (!result.success) {
                      pushToast(result.message, "error");
                      return;
                    }
                    if (editingUserEmail === account.email) resetUserForm();
                    refreshUsers();
                    await logAction("User Removed", account.email);
                    pushToast(result.message);
                  }}
                  className="rounded bg-rose-500/20 px-3 py-1 text-xs text-rose-100"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await promoteUser(account.email);
                    if (!result.success) {
                      pushToast(result.message, "error");
                      return;
                    }
                    refreshUsers();
                    await logAction("User Promoted", account.email, "Promoted to admin");
                    pushToast(result.message || "User promoted.");
                  }}
                  className="rounded bg-cyan-500/20 px-3 py-1 text-xs text-cyan-100"
                >
                  Promote
                </button>
                {bannedUsers.includes(account.email.toLowerCase()) ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await unbanUser(account.email);
                      if (!result.success) {
                        pushToast(result.message, "error");
                        return;
                      }
                      await logAction("User Unbanned", account.email);
                      pushToast(result.message || "User unbanned.");
                    }}
                    className="rounded bg-amber-500/20 px-3 py-1 text-xs text-amber-100"
                  >
                    Unban
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await banUser(account.email);
                      if (!result.success) {
                        pushToast(result.message, "error");
                        return;
                      }
                      await logAction("User Banned", account.email);
                      pushToast(result.message || "User banned.");
                    }}
                    className="rounded bg-rose-500/20 px-3 py-1 text-xs text-rose-100"
                  >
                    Ban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white">Submission Review (UI)</h3>
        <div className="mt-3 space-y-2">
          {submissions.length === 0 ? <p className="text-sm text-slate-400">No submissions yet.</p> : null}
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <p>Challenge: {submission.challengeId}</p>
              <p>GitHub: {submission.githubLink}</p>
              <p>Demo: {submission.demoLink}</p>
              <p>Status: {submission.status || "Submitted"}</p>
              <p>
                Review Score: {submission.reviewScore || 0} • Time Bonus: {submission.timeBonus || 0} • Total:{" "}
                {submission.totalScore || 0}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const nextScore = window.prompt("Review score", String(submission.reviewScore || 0));
                    if (nextScore === null) return;
                    const feedback = window.prompt("Feedback", submission.feedback || "");
                    const result = await reviewChallengeSubmission({
                      submissionId: submission.id,
                      reviewerEmail: user?.email || "",
                      reviewScore: Number(nextScore),
                      status: "Graded",
                      feedback: feedback || ""
                    });
                    pushToast(result.message, result.success ? undefined : "error");
                  }}
                  className="rounded bg-cyan-500/20 px-3 py-1 text-xs text-cyan-100"
                >
                  Grade
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await reviewChallengeSubmission({
                      submissionId: submission.id,
                      reviewerEmail: user?.email || "",
                      reviewScore: submission.reviewScore || 0,
                      status: "Under Review",
                      feedback: submission.feedback || ""
                    });
                    pushToast(result.success ? "Submission marked under review." : result.message, result.success ? undefined : "error");
                  }}
                  className="rounded bg-amber-500/20 px-3 py-1 text-xs text-amber-100"
                >
                  Mark Review
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const report = await addClub(clubForm);
            setClubForm({ name: "", description: "", points: "0" });
            notifyReport(report, "Club created");
          }}
          className="glass-card space-y-3 p-5"
        >
          <h3 className="text-lg font-semibold text-white">Clubs (Create / Edit / Delete)</h3>
          <Input label="Name" value={clubForm.name} onChange={(v) => setClubForm((p) => ({ ...p, name: v }))} />
          <Input label="Description" value={clubForm.description} onChange={(v) => setClubForm((p) => ({ ...p, description: v }))} />
          <Input label="Points" type="number" value={clubForm.points} onChange={(v) => setClubForm((p) => ({ ...p, points: v }))} />
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">Create Club</button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {clubs.map((club) => (
              <div key={club.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div className="space-y-1">
                  <p>{club.name}</p>
                  <p className="text-xs text-slate-400">Leader: {club.leaderName || "Not assigned"}</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400">Select Leader</label>
                    <select
                      value={club.leaderEmail || ""}
                      onChange={async (e) => {
                        const selected = getClubRegistrationsByClub(club.id).find((member) => member.email === e.target.value);
                        const result = await setClubLeader(club.id, selected?.email || "", selected?.fullName || "");
                        pushToast(result.message || "Club leader updated.", result.success ? undefined : "error");
                      }}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="">-- None --</option>
                      {getClubRegistrationsByClub(club.id).map((member) => (
                        <option key={`${club.id}-${member.email}`} value={member.email}>
                          {member.fullName || member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <button type="button" onClick={async () => { const name = window.prompt("New club name", club.name); if (name) { const result = await editClub(club.id, { name }); pushToast(result.message || "Club updated.", result.success ? undefined : "error"); } }} className="text-cyan-300">Edit</button>
                  <button type="button" onClick={async () => { const result = await deleteClub(club.id); pushToast(result.message || "Club deleted.", result.success ? undefined : "error"); }} className="text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = buildEventPayload();
            if (editingEventId) {
              editEvent(editingEventId, payload);
              pushToast("Event updated.");
              resetEventForm();
              return;
            }
            const report = await addEvent(payload);
            resetEventForm();
            notifyReport(report, "Event created");
          }}
          className="glass-card space-y-3 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Events</h3>
            {editingEventId ? (
              <button type="button" onClick={resetEventForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
                Cancel Edit
              </button>
            ) : null}
          </div>
          <Input label="Title" value={eventForm.title} onChange={(v) => setEventForm((p) => ({ ...p, title: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Date" type="date" value={eventForm.date} onChange={(v) => setEventForm((p) => ({ ...p, date: v }))} />
            <Input label="Time" value={eventForm.time} onChange={(v) => setEventForm((p) => ({ ...p, time: v }))} />
            <Input label="Venue" value={eventForm.venue} onChange={(v) => setEventForm((p) => ({ ...p, venue: v }))} />
            <label className="block text-sm text-slate-300">
              Mode
              <select value={eventForm.mode} onChange={(e) => setEventForm((p) => ({ ...p, mode: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {EVENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Category
              <select value={eventForm.category} onChange={(e) => setEventForm((p) => ({ ...p, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Banner URL" value={eventForm.banner} onChange={(v) => setEventForm((p) => ({ ...p, banner: v }))} />
            <FileUploadField
              label="Upload Event Banner"
              helperText="Choose an image file to use as the event banner."
              onFileSelected={(file) => handleImageFile(file, (value) => setEventForm((p) => ({ ...p, banner: value })), "event banner")}
            />
          </div>
          {isRenderableImageSrc(eventForm.banner) ? (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              <Image src={eventForm.banner} alt="Event banner preview" width={1200} height={500} className="h-40 w-full object-cover" />
            </div>
          ) : null}
          <TextArea label="Summary" value={eventForm.description} onChange={(v) => setEventForm((p) => ({ ...p, description: v }))} rows={3} />
          <RichTextEditor label="Rich Description" value={eventForm.richDescription} onChange={(v) => setEventForm((p) => ({ ...p, richDescription: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextArea label="Schedule (one item per line)" value={eventForm.scheduleText} onChange={(v) => setEventForm((p) => ({ ...p, scheduleText: v }))} rows={4} />
            <TextArea label="Speakers (one per line)" value={eventForm.speakersText} onChange={(v) => setEventForm((p) => ({ ...p, speakersText: v }))} rows={4} />
            <TextArea label="Hosts (one per line)" value={eventForm.hostsText} onChange={(v) => setEventForm((p) => ({ ...p, hostsText: v }))} rows={4} />
            <TextArea label="FAQs (one per line)" value={eventForm.faqsText} onChange={(v) => setEventForm((p) => ({ ...p, faqsText: v }))} rows={4} />
            <TextArea label="Past Event Results" value={eventForm.results} onChange={(v) => setEventForm((p) => ({ ...p, results: v }))} rows={4} />
            <TextArea label="Winner Highlights (one per line)" value={eventForm.winnerHighlightsText} onChange={(v) => setEventForm((p) => ({ ...p, winnerHighlightsText: v }))} rows={4} />
            <Input label="Gallery Link" value={eventForm.galleryLink} onChange={(v) => setEventForm((p) => ({ ...p, galleryLink: v }))} />
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={eventForm.published}
                onChange={(e) => setEventForm((p) => ({ ...p, published: e.target.checked }))}
              />
              Publish this event
            </label>
          </div>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">
            {editingEventId ? "Update Event" : "Create Event"}
          </button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {events.slice(0, 8).map((event) => (
              <div key={event.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>{event.title}</p>
                  <p className="text-xs text-slate-400">
                    {event.date} • {event.category} • {event.published ? "Published" : "Unpublished"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEventId(event.id);
                      setEventForm({
                        title: event.title || "",
                        date: event.date || "",
                        time: event.time || "",
                        venue: event.venue || "",
                        mode: event.mode || "Offline",
                        category: event.category || "Workshop",
                        banner: event.banner || "",
                        description: event.description || "",
                        richDescription: event.richDescription || "<p></p>",
                        scheduleText: (event.schedule || []).join("\n"),
                        speakersText: (event.speakers || []).join("\n"),
                        hostsText: (event.hosts || []).join("\n"),
                        faqsText: (event.faqs || []).join("\n"),
                        results: event.results || "",
                        winnerHighlightsText: (event.winnerHighlights || []).join("\n"),
                        galleryLink: event.galleryLink || "",
                        published: event.published ?? true
                      });
                    }}
                    className="text-cyan-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editEvent(event.id, { published: !(event.published ?? true) });
                      pushToast(event.published ? "Event unpublished." : "Event published.");
                    }}
                    className="text-amber-300"
                  >
                    {event.published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" onClick={() => deleteEvent(event.id)} className="text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = buildChallengePayload();
            if (editingChallengeId) {
              const result = await editChallenge(editingChallengeId, payload);
              pushToast(result.message || "Challenge updated.", result.success ? undefined : "error");
              resetChallengeForm();
              return;
            }
            const report = await addChallenge(payload);
            resetChallengeForm();
            notifyReport(report, "Challenge created");
          }}
          className="glass-card space-y-3 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Challenges</h3>
            {editingChallengeId ? (
              <button type="button" onClick={resetChallengeForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
                Cancel Edit
              </button>
            ) : null}
          </div>
          <Input label="Title" value={challengeForm.title} onChange={(v) => setChallengeForm((p) => ({ ...p, title: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Category
              <select value={challengeForm.category} onChange={(e) => setChallengeForm((p) => ({ ...p, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {CHALLENGE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Difficulty
              <select value={challengeForm.difficulty} onChange={(e) => setChallengeForm((p) => ({ ...p, difficulty: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {CHALLENGE_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Input label="Deadline" type="date" value={challengeForm.deadline} onChange={(v) => setChallengeForm((p) => ({ ...p, deadline: v }))} />
          <TextArea label="Description" value={challengeForm.description} onChange={(v) => setChallengeForm((p) => ({ ...p, description: v }))} rows={3} />
          <RichTextEditor label="Problem Statement" value={challengeForm.problemStatement} onChange={(v) => setChallengeForm((p) => ({ ...p, problemStatement: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Max Score" type="number" value={challengeForm.maxScore} onChange={(v) => setChallengeForm((p) => ({ ...p, maxScore: v }))} />
            <Input label="Max Time Bonus" type="number" value={challengeForm.maxTimeBonus} onChange={(v) => setChallengeForm((p) => ({ ...p, maxTimeBonus: v }))} />
          </div>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">
            {editingChallengeId ? "Update Challenge" : "Create Challenge"}
          </button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>{challenge.title}</p>
                  <p className="text-xs text-slate-400">
                    {challenge.category} • {challenge.difficulty} • {challenge.scoringRules?.maxScore || 100} pts + {challenge.scoringRules?.maxTimeBonus || 0} bonus
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChallengeId(challenge.id);
                      setChallengeForm({
                        title: challenge.title || "",
                        category: challenge.category || "UI/UX",
                        difficulty: challenge.difficulty || "Easy",
                        deadline: challenge.deadline || "",
                        description: challenge.description || "",
                        problemStatement: challenge.problemStatement || "<p></p>",
                        maxScore: String(challenge.scoringRules?.maxScore || 100),
                        maxTimeBonus: String(challenge.scoringRules?.maxTimeBonus || 0)
                      });
                    }}
                    className="text-cyan-300"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={async () => { const result = await deleteChallenge(challenge.id); pushToast(result.message || "Challenge deleted.", result.success ? undefined : "error"); }} className="text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = buildProjectPayload();
            if (editingProjectId) {
              const current = projects.find((project) => project.id === editingProjectId);
              const result = await editProject(editingProjectId, {
                ...payload,
                likes: current?.likes || 0,
                likedBy: current?.likedBy || []
              });
              pushToast(result.message || "Project updated.", result.success ? undefined : "error");
              resetProjectForm();
              return;
            }
            const report = await addProject(payload);
            resetProjectForm();
            notifyReport(report, "Project created");
          }}
          className="glass-card space-y-3 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Projects</h3>
            {editingProjectId ? (
              <button type="button" onClick={resetProjectForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
                Cancel Edit
              </button>
            ) : null}
          </div>
          <Input label="Title" value={projectForm.title} onChange={(v) => setProjectForm((p) => ({ ...p, title: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Year" value={projectForm.year} onChange={(v) => setProjectForm((p) => ({ ...p, year: v }))} />
            <Input label="Domain" value={projectForm.domain} onChange={(v) => setProjectForm((p) => ({ ...p, domain: v }))} />
          </div>
          <Input label="Tech Stack" value={projectForm.tech} onChange={(v) => setProjectForm((p) => ({ ...p, tech: v }))} />
          <Input label="Thumbnail URL" value={projectForm.thumbnail} onChange={(v) => setProjectForm((p) => ({ ...p, thumbnail: v }))} />
          <FileUploadField
            label="Upload Project Banner / Thumbnail"
            helperText="Choose an image file for the project card and detail page banner."
            onFileSelected={(file) => handleImageFile(file, (value) => setProjectForm((p) => ({ ...p, thumbnail: value })), "project banner")}
          />
          {isRenderableImageSrc(projectForm.thumbnail) ? (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              <Image src={projectForm.thumbnail} alt="Project banner preview" width={1200} height={500} className="h-40 w-full object-cover" />
            </div>
          ) : null}
          <TextArea label="Description" value={projectForm.description} onChange={(v) => setProjectForm((p) => ({ ...p, description: v }))} rows={3} />
          <TextArea label="Extended Description" value={projectForm.longDescription} onChange={(v) => setProjectForm((p) => ({ ...p, longDescription: v }))} rows={5} />
          <Input label="GitHub URL" value={projectForm.github} onChange={(v) => setProjectForm((p) => ({ ...p, github: v }))} />
          <Input label="Demo URL" value={projectForm.demo} onChange={(v) => setProjectForm((p) => ({ ...p, demo: v }))} />
          <Input label="Documentation URL" value={projectForm.documentation} onChange={(v) => setProjectForm((p) => ({ ...p, documentation: v }))} />
          <TextArea label="Team Members (one per line)" value={projectForm.membersText} onChange={(v) => setProjectForm((p) => ({ ...p, membersText: v }))} rows={4} />
          <TextArea label="Screenshots (one URL per line)" value={projectForm.screenshotsText} onChange={(v) => setProjectForm((p) => ({ ...p, screenshotsText: v }))} rows={4} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={projectForm.featured}
                onChange={(e) => setProjectForm((p) => ({ ...p, featured: e.target.checked }))}
              />
              Feature on homepage
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={projectForm.archived}
                onChange={(e) => setProjectForm((p) => ({ ...p, archived: e.target.checked }))}
              />
              Archive project
            </label>
          </div>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">
            {editingProjectId ? "Update Project" : "Create Project"}
          </button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {projects.map((project) => (
              <div key={project.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>{project.title}</p>
                  <p className="text-xs text-slate-400">
                    {project.domain || "General"} • {project.year || "-"} • {project.featured ? "Featured" : "Standard"} • {project.archived ? "Archived" : "Active"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProjectId(project.id);
                      setProjectForm({
                        title: project.title || "",
                        tech: project.tech || "",
                        thumbnail: project.thumbnail || "",
                        description: project.description || "",
                        longDescription: project.longDescription || "",
                        github: project.github || "",
                        demo: project.demo || "",
                        documentation: project.documentation || "",
                        year: project.year || "",
                        domain: project.domain || "",
                        membersText: (project.members || []).join("\n"),
                        screenshotsText: (project.screenshots || []).join("\n"),
                        featured: project.featured ?? false,
                        archived: project.archived ?? false
                      });
                    }}
                    className="text-cyan-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await editProject(project.id, { featured: !project.featured });
                      pushToast(result.message || (project.featured ? "Project unfeatured." : "Project featured."), result.success ? undefined : "error");
                    }}
                    className="text-amber-300"
                  >
                    {project.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await editProject(project.id, { archived: !project.archived });
                      pushToast(result.message || (project.archived ? "Project restored." : "Project archived."), result.success ? undefined : "error");
                    }}
                    className="text-slate-300"
                  >
                    {project.archived ? "Restore" : "Archive"}
                  </button>
                  <button type="button" onClick={async () => { const result = await deleteProject(project.id); pushToast(result.message || "Project deleted.", result.success ? undefined : "error"); }} className="text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = {
              name: teamForm.name,
              role: teamForm.role,
              batch: teamForm.batch,
              domain: teamForm.domain,
              expertise: teamForm.expertise,
              photo: teamForm.photo,
              socials: {
                github: teamForm.github,
                linkedin: teamForm.linkedin
              },
              tags: teamForm.tagsText.split(",").map((item) => item.trim()).filter(Boolean),
              alumni: teamForm.alumni
            };

            if (editingTeamId) {
              editTeamMember(editingTeamId, payload);
              pushToast("Team member updated.");
              resetTeamForm();
              return;
            }

            const report = await addTeamMember(payload);
            resetTeamForm();
            notifyReport(report, "Team member created");
          }}
          className="glass-card space-y-3 p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Team (CRUD)</h3>
            {editingTeamId ? (
              <button type="button" onClick={resetTeamForm} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
                Cancel Edit
              </button>
            ) : null}
          </div>
          <Input label="Name" value={teamForm.name} onChange={(v) => setTeamForm((p) => ({ ...p, name: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Role
              <select value={teamForm.role} onChange={(e) => setTeamForm((p) => ({ ...p, role: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {TEAM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Batch / Year" value={teamForm.batch} onChange={(v) => setTeamForm((p) => ({ ...p, batch: v }))} />
            <label className="block text-sm text-slate-300">
              Domain
              <select value={teamForm.domain} onChange={(e) => setTeamForm((p) => ({ ...p, domain: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100">
                {TEAM_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Photo URL" value={teamForm.photo} onChange={(v) => setTeamForm((p) => ({ ...p, photo: v }))} />
          </div>
          <Input label="Expertise" value={teamForm.expertise} onChange={(v) => setTeamForm((p) => ({ ...p, expertise: v }))} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="GitHub Link" value={teamForm.github} onChange={(v) => setTeamForm((p) => ({ ...p, github: v }))} />
            <Input label="LinkedIn Link" value={teamForm.linkedin} onChange={(v) => setTeamForm((p) => ({ ...p, linkedin: v }))} />
          </div>
          <TextArea label="Skills / Tech Tags (comma separated)" value={teamForm.tagsText} onChange={(v) => setTeamForm((p) => ({ ...p, tagsText: v }))} rows={3} />
          <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={teamForm.alumni}
              onChange={(e) => setTeamForm((p) => ({ ...p, alumni: e.target.checked }))}
            />
            Mark as alumni
          </label>
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">
            {editingTeamId ? "Update Team Member" : "Create Team Member"}
          </button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {team.map((member) => (
              <div key={member.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>{member.name}</p>
                  <p className="text-xs text-slate-400">
                    {member.role} • {member.domain} • Batch {member.batch || "-"} {member.alumni ? "• Alumni" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamId(member.id);
                      setTeamForm({
                        name: member.name || "",
                        role: member.role || "Member",
                        batch: member.batch || "",
                        domain: member.domain || "Web",
                        expertise: member.expertise || "",
                        photo: member.photo || "",
                        github: member.socials?.github || "",
                        linkedin: member.socials?.linkedin || "",
                        tagsText: (member.tags || []).join(", "),
                        alumni: member.alumni ?? false
                      });
                    }}
                    className="text-cyan-300"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteTeamMember(member.id)} className="text-rose-300">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const bulkItems = galleryForm.bulkText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((src) => ({
                src,
                album: galleryForm.album,
                eventDate: galleryForm.eventDate,
                type: galleryForm.type
              }));

            if (bulkItems.length === 0 && !galleryForm.src.trim()) {
              pushToast("Add a media URL or upload a file before submitting.", "error");
              return;
            }

            const report = bulkItems.length > 0
              ? await addGalleryItems(bulkItems)
              : await addGalleryImage(galleryForm);

            setGalleryForm({ album: "", eventDate: "", type: "image", src: "", bulkText: "" });
            notifyReport(report, bulkItems.length > 0 ? "Gallery media uploaded" : "Gallery media uploaded");
          }}
          className="glass-card space-y-3 p-5"
        >
          <h3 className="text-lg font-semibold text-white">Gallery</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Album / Event Name" value={galleryForm.album} onChange={(v) => setGalleryForm((p) => ({ ...p, album: v }))} />
            <Input label="Event Date" type="date" value={galleryForm.eventDate} onChange={(v) => setGalleryForm((p) => ({ ...p, eventDate: v }))} />
            <label className="block text-sm text-slate-300">
              Media Type
              <select
                value={galleryForm.type}
                onChange={(e) => setGalleryForm((p) => ({ ...p, type: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                <option value="image">Image</option>
                <option value="video">Video Reel</option>
              </select>
            </label>
            <Input label="Single Media URL" value={galleryForm.src} onChange={(v) => setGalleryForm((p) => ({ ...p, src: v }))} />
            <FileUploadField
              label="Upload Media File"
              accept="image/*,video/*"
              helperText="Upload a single image or short video reel for this album."
              onFileSelected={handleGalleryFile}
            />
          </div>
          {galleryForm.type === "image" && isRenderableImageSrc(galleryForm.src) ? (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              <Image src={galleryForm.src} alt="Gallery preview" width={1200} height={500} className="h-40 w-full object-cover" />
            </div>
          ) : null}
          {galleryForm.type === "video" && typeof galleryForm.src === "string" && galleryForm.src.trim() ? (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              <video src={galleryForm.src} controls className="h-40 w-full object-cover" />
            </div>
          ) : null}
          <TextArea
            label="Bulk Upload URLs (one per line)"
            value={galleryForm.bulkText}
            onChange={(v) => setGalleryForm((p) => ({ ...p, bulkText: v }))}
            rows={5}
          />
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm text-white">Upload Media</button>
          <div className="space-y-2 border-t border-slate-800 pt-3">
            {gallery.map((image) => (
              <div key={image.id} className="flex justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>{image.album}</p>
                  <p className="text-xs text-slate-400">
                    {image.eventDate || "Undated"} • {image.type === "video" ? "Video Reel" : "Image"}
                  </p>
                </div>
                <button type="button" onClick={() => deleteGalleryImage(image.id)} className="text-rose-300">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </form>
      </div>

      <section className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white">Admin Audit Log</h3>
        <div className="mt-4 space-y-2">
          {adminAuditLog.length === 0 ? <p className="text-sm text-slate-400">No admin actions logged yet.</p> : null}
          {adminAuditLog.slice(0, 20).map((entry) => (
            <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <p className="font-medium text-slate-100">{entry.action}</p>
              <p className="mt-1 text-xs text-slate-400">
                {entry.actorEmail} • {new Date(entry.createdAt).toLocaleString()}
              </p>
              {entry.target ? <p className="mt-1 text-xs text-slate-300">Target: {entry.target}</p> : null}
              {entry.details ? <p className="mt-1 text-xs text-slate-500">{entry.details}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
