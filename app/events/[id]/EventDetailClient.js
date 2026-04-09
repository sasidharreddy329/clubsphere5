"use client";

import Image from "next/image";
import Link from "next/link";
import SectionHeading from "../../../components/SectionHeading";
import { useClubData } from "../../../context/DataContext";

export default function EventDetailClient({ eventId }) {
  const { events, getEventRegistrationsByEvent } = useClubData();
  const event = events.find((item) => item.id === eventId);
  const isPastEvent = event ? new Date(`${event.date}T23:59:59`).getTime() < Date.now() : false;
  const people = event
    ? [
        ...(event.speakers || []).map((speaker) => ({ label: `Speaker: ${speaker}`, value: speaker })),
        ...(event.hosts || []).map((host) => ({ label: `Host: ${host}`, value: host }))
      ]
    : [];

  if (!event) {
    return (
      <div className="main-container">
        <div className="glass-card p-6 text-slate-300">Event not found.</div>
      </div>
    );
  }

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow={event.category || "Event"}
        title={event.title}
        subtitle={`${event.date} • ${event.time || ""} • ${event.venue || event.mode || ""}`}
      />
      {event.banner ? (
        <div className="glass-card overflow-hidden p-0">
          <Image src={event.banner} alt={event.title} width={1400} height={620} className="h-72 w-full object-cover" />
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">Description</h3>
          <div
            className="prose prose-invert mt-3 max-w-none text-slate-300 prose-p:text-slate-300"
            dangerouslySetInnerHTML={{ __html: event.richDescription || `<p>${event.description || ""}</p>` }}
          />
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <p>Mode: {event.mode || "Offline"}</p>
            <p>Venue: {event.venue || "Campus Venue"}</p>
            <p>Registrations: {getEventRegistrationsByEvent(event.id).length}</p>
          </div>
        </section>

        <section className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">Schedule</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {(event.schedule || []).map((slot) => (
              <li key={slot} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                {slot}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">Speakers / Hosts</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {people.map((person, index) => (
              <li key={`${person.value}-${index}`} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                {person.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white">FAQs</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {(event.faqs || []).map((faq) => (
              <li key={faq} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                {faq}
              </li>
            ))}
          </ul>
        </section>

        {isPastEvent ? (
          <>
            <section className="glass-card p-5">
              <h3 className="text-lg font-semibold text-white">Results</h3>
              <p className="mt-2 text-sm text-slate-300">
                {event.results || "Results and recap will be published after internal review."}
              </p>
            </section>

            <section className="glass-card p-5">
              <h3 className="text-lg font-semibold text-white">Winner Highlights</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {(event.winnerHighlights || []).length === 0 ? (
                  <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    Winner highlights will be added soon.
                  </li>
                ) : (
                  (event.winnerHighlights || []).map((winner) => (
                    <li key={winner} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                      {winner}
                    </li>
                  ))
                )}
              </ul>
              {event.galleryLink ? (
                <Link href={event.galleryLink} className="mt-4 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-100">
                  View Gallery
                </Link>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
