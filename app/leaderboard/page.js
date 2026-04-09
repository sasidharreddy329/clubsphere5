"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";

const heatClass = (level) => {
  if (level === 0) return "bg-slate-800";
  if (level === 1) return "bg-cyan-950";
  if (level === 2) return "bg-cyan-700";
  if (level === 3) return "bg-violet-700";
  return "bg-violet-500";
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    leaderboard,
    challenges,
    getGlobalChallengeLeaderboard,
    getChallengeLeaderboard,
    getUserAnalytics,
    stats
  } = useClubData();
  const [selectedChallengeId, setSelectedChallengeId] = useState("");

  useEffect(() => {
    if (!user) router.replace("/");
  }, [router, user]);

  const globalLeaderboard = useMemo(() => getGlobalChallengeLeaderboard(), [getGlobalChallengeLeaderboard]);
  const activeChallengeId = selectedChallengeId || challenges[0]?.id || "";
  const challengeLeaderboard = getChallengeLeaderboard(activeChallengeId);
  const myAnalytics = getUserAnalytics(user?.email);

  if (!user) return null;

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow="Analytics"
        title="Leaderboard & Activity"
        subtitle="Global challenge rankings, scoped leaderboards, and personal performance signals."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">Registrations</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalRegistrations}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">Submissions</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.totalSubmissions}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">Active Users</p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.activeUsers}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400">Your Badge</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200">{myAnalytics.rankBadge}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
            Global Challenge Leaderboard
          </div>
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Badge</th>
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {globalLeaderboard.slice(0, 10).map((entry) => (
                <tr key={entry.email} className="border-b border-slate-900/70 text-slate-200">
                  <td className="px-4 py-3">#{entry.rank}</td>
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3">{entry.badge}</td>
                  <td className="px-4 py-3">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-semibold text-white">Challenge / Hackathon Leaderboard</p>
            <select
              value={activeChallengeId}
              onChange={(e) => setSelectedChallengeId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 p-4">
            {challengeLeaderboard.length === 0 ? (
              <p className="text-sm text-slate-400">No submissions for this challenge yet.</p>
            ) : (
              challengeLeaderboard.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                  <div>
                    <p>
                      #{entry.rank} {entry.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Score {entry.reviewScore} + bonus {entry.timeBonus}
                    </p>
                  </div>
                  <p>{entry.totalScore}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white">Personal Analytics</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Total Score</p>
              <p className="mt-2 text-xl font-semibold text-white">{myAnalytics.totalScore}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Participation Rate</p>
              <p className="mt-2 text-xl font-semibold text-white">{myAnalytics.participationRate}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Win Rate</p>
              <p className="mt-2 text-xl font-semibold text-white">{myAnalytics.winRate}%</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-white">Score Over Time</p>
            <div className="mt-3 space-y-3">
              {myAnalytics.scoreTimeline.length === 0 ? (
                <p className="text-sm text-slate-400">No scoring activity yet.</p>
              ) : (
                myAnalytics.scoreTimeline.map((point) => (
                  <div key={point.date}>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>{new Date(point.date).toLocaleDateString()}</span>
                      <span>{point.score}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        style={{ width: `${Math.min(100, point.score / 6)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white">Activity Heatmap</h3>
          <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-14">
            {myAnalytics.heatmap.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} submissions`}
                className={`h-5 rounded ${heatClass(cell.level)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
          Club Leaderboard
        </div>
        <table className="w-full text-left">
          <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.id} className="border-b border-slate-900/70 text-slate-200">
                <td className="px-4 py-3">#{index + 1}</td>
                <td className="px-4 py-3">{entry.name}</td>
                <td className="px-4 py-3">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
