"use client";

import Image from "next/image";
import { useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { GalleryCard, ProjectCard, TeamCard } from "../../components/cards";
import { useAuth } from "../../context/AuthContext";
import { useClubData } from "../../context/DataContext";
import { useToast } from "../../context/ToastContext";

const isRenderableImageSrc = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"));

function MemberCard({ member }) {
  const initials = member.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-3">
        {isRenderableImageSrc(member.photo) ? (
          <Image
            src={member.photo}
            alt={member.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 text-lg font-semibold text-white">
            {initials || "MB"}
          </div>
        )}
        <div>
          <p className="font-semibold text-white">{member.name}</p>
          <p className="text-sm text-cyan-200">{member.designation}</p>
          <p className="text-xs text-slate-400">Year: {member.year || "-"}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {member.socials?.github ? (
          <a
            href={member.socials.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
          >
            GitHub
          </a>
        ) : null}
        {member.socials?.linkedin ? (
          <a
            href={member.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
          >
            LinkedIn
          </a>
        ) : null}
        {!member.socials?.github && !member.socials?.linkedin ? (
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-500">No social links</span>
        ) : null}
      </div>
    </article>
  );
}

export default function ClubPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { clubs, team, projects, gallery, joinClub, isClubRegistered, getClubRegistrationsByClub, getUserProfile } =
    useClubData();

  const [selectedClub, setSelectedClub] = useState(null);
  const [exploringClub, setExploringClub] = useState(null);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    department: "",
    year: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const openRegistration = (club) => {
    if (!user) {
      pushToast("Please login as a member to join clubs.", "error");
      return;
    }
    if (user.role !== "member") {
      pushToast("Only members can join clubs from this page.", "error");
      return;
    }
    setForm({
      fullName: user.name || "",
      email: user.email || "",
      phone: "",
      department: "",
      year: ""
    });
    setSelectedClub(club);
  };

  const closeRegistration = () => {
    if (submitting) return;
    setSelectedClub(null);
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    if (!selectedClub) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));

    const joined = await joinClub({
      userEmail: user.email,
      clubId: selectedClub.id,
      details: form
    });
    if (!joined) {
      pushToast("You already joined this club.", "error");
      setSubmitting(false);
      return;
    }
    pushToast("Club registration successful.");
    setSubmitting(false);
    setSelectedClub(null);
  };

  const getClubVisibleMembers = (clubId) => {
    if (!user?.email) return [];
    if (!isClubRegistered({ userEmail: user.email, clubId })) return [];
    return getClubRegistrationsByClub(clubId)
      .filter((entry) => entry.email !== user.email)
      .map((entry) => ({
        fullName: entry.fullName || "Member",
        department: entry.department || "-",
        year: entry.year || "-"
      }));
  };

  const getClubMemberCards = (club) => {
    const registrations = getClubRegistrationsByClub(club.id);
    const cards = registrations.map((entry) => {
      const profile = getUserProfile(entry.email);
      return {
        id: `${club.id}-${entry.email}`,
        name: entry.fullName || entry.email || "Member",
        photo: profile.avatar || "",
        designation: entry.email === club.leaderEmail ? "Leader" : "Member",
        year: entry.year || "-",
        socials: {
          github: profile.github || "",
          linkedin: profile.linkedin || ""
        }
      };
    });

    if (
      club.leaderEmail &&
      !cards.some((entry) => entry.id === `${club.id}-${club.leaderEmail}`)
    ) {
      const profile = getUserProfile(club.leaderEmail);
      cards.unshift({
        id: `${club.id}-${club.leaderEmail}`,
        name: club.leaderName || club.leaderEmail,
        photo: profile.avatar || "",
        designation: "Leader",
        year: "-",
        socials: {
          github: profile.github || "",
          linkedin: profile.linkedin || ""
        }
      });
    }

    return cards.sort((a, b) => {
      if (a.designation === b.designation) return a.name.localeCompare(b.name);
      return a.designation === "Leader" ? -1 : 1;
    });
  };

  return (
    <div className="main-container space-y-14">
      <section className="glass-card p-8">
        <SectionHeading
          eyebrow="About ClubSphere"
          title="A Community of Builders and Problem Solvers"
          subtitle="ClubSphere drives hands-on learning through projects, workshops, and high-impact collaboration."
        />
        <p className="max-w-4xl text-slate-300">
          We are a student-led tech club focused on applied innovation. Members explore modern technologies, mentor
          peers, and ship real products. From AI experiments to full-stack platforms, ClubSphere helps students turn
          ideas into meaningful outcomes.
        </p>
      </section>

      <section>
        <SectionHeading eyebrow="Community" title="Active Clubs" />
        <div className="grid gap-4 md:grid-cols-3">
          {clubs.map((club) => (
            <article key={club.id} className="glass-card p-5 hover:border-cyan-500/30">
              <h3 className="text-lg font-semibold text-white">{club.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{club.description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-cyan-200">{club.points} points</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openRegistration(club)}
                  disabled={isClubRegistered({ userEmail: user?.email, clubId: club.id })}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isClubRegistered({ userEmail: user?.email, clubId: club.id }) ? "Joined" : "Join Club"}
                </button>
                {user ? (
                  <button
                    type="button"
                    onClick={() => setExploringClub(club)}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
                  >
                    Explore
                  </button>
                ) : null}
              </div>

              {isClubRegistered({ userEmail: user?.email, clubId: club.id }) ? (
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Club Members</p>
                  <div className="mt-2 space-y-2">
                    {getClubVisibleMembers(club.id).length === 0 ? (
                      <p className="text-xs text-slate-400">No other members joined yet.</p>
                    ) : (
                      getClubVisibleMembers(club.id).map((member, index) => (
                        <div
                          key={`${club.id}-${member.fullName}-${index}`}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
                        >
                          <p className="text-xs text-slate-200">{member.fullName}</p>
                          <p className="text-xs text-slate-400">
                            Dept: {member.department} | Year: {member.year}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Leadership" title="Team Members" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Portfolio" title="Projects Showcase" />
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Moments" title="Gallery" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((image, index) => (
            <GalleryCard key={image.id || `${image.src}-${index}`} src={image.src} alt={`Club activity ${index + 1}`} />
          ))}
        </div>
      </section>

      {selectedClub ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">Club Join Registration</h3>
            <p className="mt-1 text-sm text-slate-300">Fill your details to join {selectedClub.name}.</p>

            <form onSubmit={submitRegistration} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">
                Full Name
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Phone
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Department
                  <input
                    required
                    value={form.department}
                    onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Year
                  <input
                    required
                    value={form.year}
                    onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRegistration}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Joining..." : "Confirm Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {exploringClub ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 px-4 py-10">
          <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">Explore Club</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{exploringClub.name}</h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">{exploringClub.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setExploringClub(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getClubMemberCards(exploringClub).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                  No members are visible for this club yet. Once members join and save their profile details, they will
                  appear here.
                </div>
              ) : (
                getClubMemberCards(exploringClub).map((member) => <MemberCard key={member.id} member={member} />)
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
