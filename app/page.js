"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import { EventCard, ProjectCard } from "../components/cards";
import { useAuth } from "../context/AuthContext";
import { useClubData } from "../context/DataContext";

function CarouselSection({ title, items, renderItem }) {
  const [index, setIndex] = useState(0);
  const visibleItems = items.slice(index, index + 2);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-cyan-300">{title}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
            className="brand-button-secondary px-3 py-2 text-sm"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.min(Math.max(0, items.length - 2), prev + 1))}
            className="brand-button-secondary px-3 py-2 text-sm"
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visibleItems.map(renderItem)}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { events, projects, leaderboard, challenges, announcements, stats } = useClubData();
  const [quickView, setQuickView] = useState(null);

  const topFive = leaderboard.slice(0, 5);
  const featuredProjects = useMemo(
    () =>
      projects
        .filter((project) => project.featured && !project.archived)
        .sort((a, b) => (b.likes || 0) - (a.likes || 0)),
    [projects]
  );
  const featuredChallenges = useMemo(
    () =>
      [...challenges]
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5),
    [challenges]
  );
  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.published !== false && new Date(`${event.date}T23:59:59`).getTime() >= Date.now())
        .slice(0, 4),
    [events]
  );

  return (
    <div className="main-container space-y-14">
      <section className="glass-card glass-panel hero-shell animated-fade-up overflow-hidden p-8 sm:p-12">
        <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-cyan-300">ClubSphere Tech Community</p>
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-6xl">
              Turning curious builders into <span className="text-cyan-300">shipped creators</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
              ClubSphere is where students build products, host ambitious events, launch challenges, and grow public proof of work together.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={user ? "/club" : "/signup"}
                className="brand-button"
              >
                Join
              </Link>
              <Link
                href="/club"
                className="brand-button-secondary"
              >
                Explore
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card glass-panel p-5 text-center">
              <p className="text-3xl font-semibold text-slate-100">{stats.totalUsers}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300">Members</p>
            </div>
            <div className="glass-card glass-panel p-5 text-center">
              <p className="text-3xl font-semibold text-slate-100">{stats.totalEvents}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300">Events Hosted</p>
            </div>
            <div className="glass-card glass-panel p-5 text-center">
              <p className="text-3xl font-semibold text-slate-100">{challenges.length}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300">Challenges Launched</p>
            </div>
            <div className="glass-card glass-panel p-5 text-center">
              <p className="text-3xl font-semibold text-slate-100">{stats.totalProjects}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-cyan-300">Projects Built</p>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card glass-panel animated-fade-up-delay overflow-hidden p-4">
        <div className="whitespace-nowrap text-sm text-slate-300">
          <div className="animate-[ticker_28s_linear_infinite]">
            {(announcements.length ? announcements : [{ id: "a", text: "Welcome to ClubSphere!" }])
              .map((item) => `• ${item.text} `)
              .join("      ")}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Upcoming" title="Events Preview Strip" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {upcoming.map((event) => (
            <div key={event.id} className="min-w-[300px] flex-1">
              <EventCard
                event={event}
                action={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuickView({ type: "event", item: event })}
                      className="text-sm text-cyan-300 hover:text-cyan-200"
                    >
                      Quick view
                    </button>
                    <Link href={`/events/${event.id}`} className="text-sm text-slate-300 hover:text-cyan-300">
                      Full details
                    </Link>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </section>

      <CarouselSection
        title="Featured Challenges"
        items={featuredChallenges}
        renderItem={(challenge) => (
          <div key={challenge.id} className="glass-card glass-panel hover-lift animated-glow p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">
              {challenge.difficulty} • {challenge.category}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-cyan-300">{challenge.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{challenge.description}</p>
            <p className="mt-2 text-xs text-slate-400">Deadline: {challenge.deadline}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuickView({ type: "challenge", item: challenge })}
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                Quick view
              </button>
              <Link href="/challenges" className="text-sm text-slate-300 hover:text-cyan-300">
                Explore challenge
              </Link>
            </div>
          </div>
        )}
      />

      <CarouselSection
        title="Featured Projects"
        items={featuredProjects}
        renderItem={(project) => (
          <div key={project.id} className="space-y-3">
            <Link href={`/projects/${project.id}`}>
              <ProjectCard project={project} />
            </Link>
            <button
              type="button"
              onClick={() => setQuickView({ type: "project", item: project })}
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              Quick view
            </button>
          </div>
        )}
      />

      <section>
        <SectionHeading eyebrow="Top Clubs" title="Leaderboard Preview" />
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {topFive.map((entry, index) => (
                <tr key={entry.id} className="border-b border-slate-900/80 text-slate-200">
                  <td className="px-4 py-3">#{index + 1}</td>
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3">{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card glass-panel overflow-hidden bg-gradient-to-r from-cyan-700/16 via-slate-900 to-cyan-500/10 p-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h3 className="text-3xl font-semibold tracking-tight text-cyan-300">Join the next wave of builders.</h3>
            <p className="mt-3 text-base leading-7 text-slate-400">
              We’re actively recruiting designers, developers, storytellers, and community leads for the next semester.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {!user ? (
                <Link
                  href="/signup"
                  className="brand-button px-6"
                >
                  Join ClubSphere
                </Link>
              ) : (
                <Link
                  href="/club"
                  className="brand-button px-6"
                >
                  Explore Club
                </Link>
              )}
              <Link href="/team" className="brand-button-secondary px-6">
                Meet the Team
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Socials</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="brand-button-secondary px-4 py-2 text-sm">
                GitHub
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="brand-button-secondary px-4 py-2 text-sm">
                LinkedIn
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="brand-button-secondary px-4 py-2 text-sm">
                Instagram
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" className="brand-button-secondary px-4 py-2 text-sm">
                X / Twitter
              </a>
            </div>
          </div>
        </div>
      </section>

      {quickView ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/86 p-4">
          <div className="glass-card animated-fade-up w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">{quickView.type}</p>
                <h3 className="mt-2 text-2xl font-semibold text-cyan-300">{quickView.item.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickView(null)}
                className="brand-button-secondary px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>{quickView.item.description}</p>
              {quickView.type === "project" ? (
                <>
                  <p>Tech: {quickView.item.tech}</p>
                  <p>Team: {(quickView.item.members || []).join(", ")}</p>
                  <Link href={`/projects/${quickView.item.id}`} className="inline-block text-cyan-300 hover:text-cyan-200">
                    Open project page
                  </Link>
                </>
              ) : null}
              {quickView.type === "challenge" ? (
                <>
                  <p>Deadline: {quickView.item.deadline}</p>
                  <p>Category: {quickView.item.category}</p>
                  <Link href="/challenges" className="inline-block text-cyan-300 hover:text-cyan-200">
                    Open challenges
                  </Link>
                </>
              ) : null}
              {quickView.type === "event" ? (
                <>
                  <p>
                    {quickView.item.date} • {quickView.item.time}
                  </p>
                  <p>
                    {quickView.item.venue} • {quickView.item.mode}
                  </p>
                  <Link href={`/events/${quickView.item.id}`} className="inline-block text-cyan-300 hover:text-cyan-200">
                    Open event page
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
