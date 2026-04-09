"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "../../components/cards";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

const getEventTimestamp = (event) => new Date(`${event.date}T23:59:59`).getTime();

const getCountdownText = (event, now) => {
  const diff = getEventTimestamp(event) - now;
  if (diff <= 0) return "Event closed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${minutes}m left`;
};

const categoryOptions = ["Workshop", "Hackathon", "Talk", "Competition", "Social"];

export default function EventsPage() {
  const { user } = useAuth();
  const { events, joinEvent, isRegistered, getEventRegistrationsByEvent } = useClubData();
  const { pushToast } = useToast();
  const [tab, setTab] = useState("upcoming");
  const [activeCategory, setActiveCategory] = useState("All");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const segmented = useMemo(() => {
    const publishedEvents = events.filter((event) => event.published !== false);
    const upcoming = publishedEvents.filter((event) => getEventTimestamp(event) >= now);
    const past = publishedEvents.filter((event) => getEventTimestamp(event) < now);
    return { upcoming, past };
  }, [events, now]);

  const registerForEvent = async (event) => {
    if (!user) return pushToast("Please login as a member to register for events.", "error");
    if (user.role !== "member") return pushToast("Only members can register.", "error");
    if (!window.confirm(`Confirm your registration for ${event.title}?`)) return;
    const joined = await joinEvent({
      userEmail: user.email,
      eventId: event.id,
      details: {
        fullName: user.name || "",
        email: user.email || "",
        phone: "",
        department: "",
        year: ""
      }
    });
    if (!joined) return pushToast("You already registered for this event.", "error");
    pushToast("Registration confirmed.");
  };

  const activeEvents = (tab === "upcoming" ? segmented.upcoming : segmented.past).filter((event) =>
    activeCategory === "All" ? true : event.category === activeCategory
  );

  return (
    <div className="main-container space-y-6">
      <SectionHeading
        eyebrow="Club Calendar"
        title="Events"
        subtitle="Discover upcoming events and revisit past sessions."
      />

      <div className="glass-card space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("upcoming")}
            className={`rounded-lg border px-4 py-2 text-sm transition ${tab === "upcoming" ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-300" : "border-cyan-500/12 bg-slate-900 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300"}`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setTab("past")}
            className={`rounded-lg border px-4 py-2 text-sm transition ${tab === "past" ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-300" : "border-cyan-500/12 bg-slate-900 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300"}`}
          >
            Finished Events
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("All")}
            className={`rounded-full border px-3 py-1 text-xs transition ${activeCategory === "All" ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-300" : "border-cyan-500/12 bg-slate-900 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300"}`}
          >
            All
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs transition ${activeCategory === category ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-300" : "border-cyan-500/12 bg-slate-900 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-300"}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeEvents.length === 0 ? (
          <div className="glass-card p-6 text-sm text-slate-400">
            No {tab === "upcoming" ? "upcoming" : "finished"} events in this category yet.
          </div>
        ) : null}
        {activeEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            action={
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{event.mode}</span>
                  <span>•</span>
                  <span>{event.venue || "Campus Venue"}</span>
                  <span>•</span>
                  <span>{getEventRegistrationsByEvent(event.id).length} registrations</span>
                </div>
                {tab === "upcoming" ? (
                  <p className="text-xs font-medium text-cyan-200">{getCountdownText(event, now)}</p>
                ) : null}
                <div className="flex gap-2">
                  {tab === "upcoming" ? (
                    <button
                      onClick={() => registerForEvent(event)}
                      disabled={isRegistered({ userEmail: user?.email, eventId: event.id })}
                      className="rounded-lg bg-gradient-to-r from-cyan-700 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow disabled:opacity-50"
                    >
                      {isRegistered({ userEmail: user?.email, eventId: event.id }) ? "Registered" : "Register"}
                    </button>
                  ) : null}
                  <Link href={`/events/${event.id}`} className="rounded-lg border border-cyan-500/15 px-4 py-2 text-sm text-slate-200 hover:border-cyan-500/35 hover:text-cyan-300">
                    Details
                  </Link>
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
