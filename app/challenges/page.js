"use client";

import { useMemo, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

const getChallengeStatus = (deadline) => {
  const diff = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  if (diff < 0) return "Closed";
  if (diff <= 1000 * 60 * 60 * 24 * 2) return "Closing Soon";
  return "Open";
};

export default function ChallengesPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { challenges, submitChallenge, getUserSubmissions, getChallengeLeaderboard } = useClubData();
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [leaderboardChallengeId, setLeaderboardChallengeId] = useState("");
  const [form, setForm] = useState({ githubLink: "", demoLink: "" });

  const difficulties = ["All", ...new Set(challenges.map((item) => item.difficulty))];
  const categories = ["All", ...new Set(challenges.map((item) => item.category))];
  const statuses = ["All", "Open", "Closing Soon", "Closed"];

  const filteredChallenges = useMemo(
    () =>
      challenges.filter((challenge) => {
        if (difficulty !== "All" && challenge.difficulty !== difficulty) return false;
        if (category !== "All" && challenge.category !== category) return false;
        if (status !== "All" && getChallengeStatus(challenge.deadline) !== status) return false;
        return true;
      }),
    [challenges, difficulty, category, status]
  );

  const userSubmissions = getUserSubmissions(user?.email);
  const activeLeaderboardChallengeId = leaderboardChallengeId || challenges[0]?.id || "";
  const activeLeaderboard = getChallengeLeaderboard(activeLeaderboardChallengeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return pushToast("Please login to submit challenges.", "error");
    const result = await submitChallenge({
      userEmail: user.email.toLowerCase(),
      challengeId: selectedChallenge.id,
      githubLink: form.githubLink,
      demoLink: form.demoLink
    });
    if (!result.success) return pushToast(result.message, "error");
    pushToast("Challenge submission successful.");
    setSelectedChallenge(null);
    setForm({ githubLink: "", demoLink: "" });
  };

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow="Build Arena"
        title="Challenges"
        subtitle="Browse open prompts, submit solution links, track review status, and watch the leaderboard shift in real time."
      />

      <div className="glass-card flex flex-wrap items-center gap-3 p-4">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {difficulties.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {categories.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100">
          {statuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredChallenges.map((challenge) => (
          <article key={challenge.id} className="glass-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-cyan-200">
                {challenge.difficulty} • {challenge.category}
              </span>
              <span className="rounded-full border border-cyan-500/15 px-2.5 py-1 text-[11px] text-slate-300">
                {getChallengeStatus(challenge.deadline)}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-cyan-300">{challenge.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{challenge.description}</p>
            <p className="mt-2 text-xs text-slate-400">Deadline: {challenge.deadline}</p>
            <div
              className="prose prose-invert mt-3 max-w-none text-sm prose-p:text-slate-300"
              dangerouslySetInnerHTML={{ __html: challenge.problemStatement || `<p>${challenge.description}</p>` }}
            />
            <p className="mt-3 text-xs text-slate-500">
              Scoring: {challenge.scoringRules?.maxScore || 100} pts + {challenge.scoringRules?.maxTimeBonus || 0} time bonus
            </p>
            <button
              onClick={() => setSelectedChallenge(challenge)}
              disabled={getChallengeStatus(challenge.deadline) === "Closed"}
              className="mt-4 rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow"
            >
              {getChallengeStatus(challenge.deadline) === "Closed" ? "Closed" : "Submit Solution"}
            </button>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="text-lg font-semibold text-cyan-300">Submission History</h3>
          <div className="mt-3 space-y-2">
            {userSubmissions.length === 0 ? <p className="text-sm text-slate-400">No submissions yet.</p> : null}
            {userSubmissions.map((submission) => {
              const challenge = challenges.find((item) => item.id === submission.challengeId);
              return (
                <div key={submission.id} className="rounded-lg border border-cyan-500/12 bg-slate-900 px-3 py-2">
                  <p className="text-sm text-slate-100">{challenge?.title || submission.challengeId}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Status: {submission.status} • Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    Review Score: {submission.reviewScore || 0} • Time Bonus: {submission.timeBonus || 0} • Total: {submission.totalScore || 0}
                  </p>
                  {submission.feedback ? <p className="mt-1 text-xs text-slate-500">Feedback: {submission.feedback}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
        <section className="glass-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-cyan-300">Challenge Leaderboard</h3>
            <select
              value={activeLeaderboardChallengeId}
              onChange={(e) => setLeaderboardChallengeId(e.target.value)}
              className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 space-y-2">
            {activeLeaderboard.length === 0 ? <p className="text-sm text-slate-400">No submissions for this challenge yet.</p> : null}
            {activeLeaderboard.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-cyan-500/12 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <div>
                  <p>
                    #{entry.rank} {entry.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Score {entry.reviewScore} + bonus {entry.timeBonus} • {entry.status}
                  </p>
                </div>
                <p>{entry.totalScore}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedChallenge ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/15 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-cyan-300">Submit: {selectedChallenge.title}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">
                GitHub Repo Link
                <input
                  required
                  type="url"
                  value={form.githubLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, githubLink: e.target.value }))}
                  className="brand-input"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Live Demo Link
                <input
                  required
                  type="url"
                  value={form.demoLink}
                  onChange={(e) => setForm((prev) => ({ ...prev, demoLink: e.target.value }))}
                  className="brand-input"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedChallenge(null)} className="brand-button-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
