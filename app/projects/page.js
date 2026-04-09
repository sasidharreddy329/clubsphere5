"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { ProjectCard } from "../../components/cards";
import { useClubData } from "../../context/DataContext";

export default function ProjectsPage() {
  const { projects } = useClubData();
  const [techFilter, setTechFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [teamSizeFilter, setTeamSizeFilter] = useState("All");
  const visibleProjects = projects.filter((project) => !project.archived);
  const techOptions = useMemo(
    () => ["All", ...new Set(visibleProjects.flatMap((project) => (project.tech || "").split(",").map((t) => t.trim()).filter(Boolean)))],
    [visibleProjects]
  );
  const yearOptions = useMemo(
    () => ["All", ...new Set(visibleProjects.map((project) => project.year).filter(Boolean))],
    [visibleProjects]
  );
  const domainOptions = useMemo(
    () => ["All", ...new Set(visibleProjects.map((project) => project.domain).filter(Boolean))],
    [visibleProjects]
  );
  const teamSizeOptions = ["All", "1-2", "3-4", "5+"];

  const filtered = visibleProjects.filter((project) => {
    const teamSize = Array.isArray(project.members) ? project.members.length : 0;
    if (techFilter !== "All" && !(project.tech || "").includes(techFilter)) return false;
    if (yearFilter !== "All" && project.year !== yearFilter) return false;
    if (domainFilter !== "All" && project.domain !== domainFilter) return false;
    if (teamSizeFilter === "1-2" && !(teamSize >= 1 && teamSize <= 2)) return false;
    if (teamSizeFilter === "3-4" && !(teamSize >= 3 && teamSize <= 4)) return false;
    if (teamSizeFilter === "5+" && teamSize < 5) return false;
    return true;
  });

  const featured = visibleProjects.filter((project) => project.featured);

  const pinned = [...featured].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 2);

  return (
    <div className="main-container space-y-10">
      <SectionHeading
        eyebrow="Showcase"
        title="Projects"
        subtitle="A curated portfolio of club-built projects, with featured work, filters, and detail-rich case studies."
      />

      <section>
        <h3 className="mb-4 text-lg font-semibold text-cyan-300">Pinned Projects</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {pinned.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="glass-card grid gap-3 p-4 md:grid-cols-4">
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {techOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {yearOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {domainOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            value={teamSizeFilter}
            onChange={(e) => setTeamSizeFilter(e.target.value)}
            className="rounded-lg border border-cyan-500/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {teamSizeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
