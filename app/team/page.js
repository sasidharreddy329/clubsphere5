"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import SectionHeading from "../../components/SectionHeading";
import { useClubData } from "../../context/DataContext";

const isRenderableImageSrc = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:image/"));

const roleOptions = ["All", "Club Lead", "Core Team", "Member"];
const domainOptions = ["All", "Web", "AI", "Design", "Product"];
const roleSections = ["Club Lead", "Core Team", "Member"];

export default function TeamPage() {
  const { team } = useClubData();
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [showAlumni, setShowAlumni] = useState(true);
  const [activeMember, setActiveMember] = useState(null);

  const batchOptions = useMemo(
    () => ["All", ...new Set(team.map((member) => member.batch).filter(Boolean))],
    [team]
  );

  const filteredTeam = useMemo(
    () =>
      team.filter((member) => {
        if (selectedRole !== "All" && member.role !== selectedRole) return false;
        if (selectedDomain !== "All" && member.domain !== selectedDomain) return false;
        if (selectedBatch !== "All" && member.batch !== selectedBatch) return false;
        if (!showAlumni && member.alumni) return false;
        return true;
      }),
    [team, selectedRole, selectedDomain, selectedBatch, showAlumni]
  );

  const groupedMembers = useMemo(
    () =>
      roleSections.map((role) => ({
        role,
        members: filteredTeam
          .filter((member) => member.role === role)
          .sort((a, b) => (a.batch || "").localeCompare(b.batch || "") || a.name.localeCompare(b.name))
      })),
    [filteredTeam]
  );

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow="People"
        title="Club Team"
        subtitle="Explore club leads, core team members, contributors, alumni, and the skills that keep ClubSphere running."
      />

      <div className="glass-card flex flex-wrap items-center gap-3 p-4">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {roleOptions.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {domainOptions.map((domain) => (
            <option key={domain}>{domain}</option>
          ))}
        </select>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        >
          {batchOptions.map((batch) => (
            <option key={batch}>{batch}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={showAlumni} onChange={(e) => setShowAlumni(e.target.checked)} />
          Show Alumni
        </label>
      </div>

      {groupedMembers.map((section) =>
        section.members.length > 0 ? (
          <section key={section.role} className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{section.role}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setActiveMember(member)}
                  className="glass-card group translate-y-0 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/35"
                >
                  <div className="flex items-start gap-3">
                    {isRenderableImageSrc(member.photo) ? (
                      <Image src={member.photo} alt={member.name} width={72} height={72} className="h-16 w-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-700/45 to-cyan-500/35 text-lg font-semibold text-slate-950">
                        {member.name?.slice(0, 1) || "M"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-cyan-300">{member.name}</p>
                      <p className="text-sm text-cyan-200">{member.role}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Batch {member.batch || "-"} • {member.domain || "General"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{member.expertise}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(member.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full border border-cyan-500/12 bg-slate-900 px-2.5 py-1 text-xs text-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                    {member.socials?.github ? <span>GitHub</span> : null}
                    {member.socials?.linkedin ? <span>LinkedIn</span> : null}
                    {member.alumni ? <span>Alumni</span> : null}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ) : null
      )}

      {filteredTeam.length === 0 ? (
        <div className="glass-card p-6 text-sm text-slate-400">
          No team members match the selected role, batch, domain, and alumni filters yet.
        </div>
      ) : null}

      {activeMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-cyan-500/15 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-300">{activeMember.name}</h3>
              <button onClick={() => setActiveMember(null)} className="text-sm text-slate-400 hover:text-cyan-300">
                Close
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              {isRenderableImageSrc(activeMember.photo) ? (
                <Image
                  src={activeMember.photo}
                  alt={activeMember.name}
                  width={96}
                  height={96}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-700/45 to-cyan-500/35 text-xl font-semibold text-slate-950">
                  {activeMember.name?.slice(0, 1) || "M"}
                </div>
              )}
              <div>
                <p className="text-cyan-200">{activeMember.role}</p>
                <p className="text-sm text-slate-300">
                  {activeMember.domain} • Batch {activeMember.batch}
                </p>
                {activeMember.alumni ? <p className="text-xs text-slate-400">Alumni Member</p> : null}
              </div>
            </div>
            <p className="mt-4 text-slate-300">{activeMember.expertise}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(activeMember.tags || []).map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-500/12 bg-slate-950 px-2.5 py-1 text-xs text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              {activeMember.socials?.github ? (
                <a href={activeMember.socials.github} target="_blank" className="text-cyan-300 hover:underline" rel="noreferrer">
                  GitHub
                </a>
              ) : null}
              {activeMember.socials?.linkedin ? (
                <a
                  href={activeMember.socials.linkedin}
                  target="_blank"
                  className="text-cyan-300 hover:underline"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
