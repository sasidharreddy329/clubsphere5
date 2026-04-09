"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SectionHeading from "../../../components/SectionHeading";
import { useAuth } from "../../../context/AuthContext";
import { useClubData } from "../../../context/DataContext";
import { useToast } from "../../../context/ToastContext";

export default function ProjectDetailClient({ projectId }) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const { projects, toggleProjectLike } = useClubData();
  const project = projects.find((item) => item.id === projectId);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!project) {
    return (
      <div className="main-container">
        <div className="glass-card p-6 text-slate-300">Project not found.</div>
      </div>
    );
  }

  const screenshots = project.screenshots || [];
  const hasLiked = user?.email ? (project.likedBy || []).includes(user.email.toLowerCase()) : false;

  return (
    <div className="main-container space-y-8">
      <SectionHeading
        eyebrow={project.domain || "Project Detail"}
        title={project.title}
        subtitle={`${project.description} ${project.year ? `• ${project.year}` : ""}`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          {screenshots.length > 0 ? (
            <>
              <Image
                src={screenshots[activeIndex]}
                alt={`${project.title} screenshot`}
                width={1200}
                height={700}
                className="h-72 w-full rounded-xl object-cover"
              />
              <div className="mt-3 flex gap-2">
                {screenshots.map((shot, index) => (
                  <button key={shot} onClick={() => setActiveIndex(index)} className="overflow-hidden rounded-lg border border-slate-700">
                    <Image src={shot} alt="thumb" width={120} height={70} className="h-14 w-24 object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-300">No screenshots available.</p>
          )}
        </div>
        <div className="glass-card space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {project.featured ? (
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                Featured
              </span>
            ) : null}
            {project.archived ? (
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">Archived</span>
            ) : null}
            <span className="text-sm text-slate-400">{project.likes || 0} stars</span>
          </div>
          <p className="text-slate-300">{project.longDescription || project.description}</p>
          <div className="flex flex-wrap gap-2">
            {(project.tech || "")
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
              .map((tag) => (
                <span key={tag} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-violet-200">
                  {tag}
                </span>
              ))}
          </div>
          <p className="text-sm text-slate-300">Team: {(project.members || []).join(", ")}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={project.github || "#"} target="_blank" className="rounded-lg bg-slate-800 px-4 py-2 text-slate-100">
              GitHub
            </Link>
            <Link href={project.demo || "#"} target="_blank" className="rounded-lg bg-cyan-600 px-4 py-2 text-white">
              Live Demo
            </Link>
            {project.documentation ? (
              <Link href={project.documentation} target="_blank" className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100">
                Documentation
              </Link>
            ) : null}
            <button
              type="button"
              onClick={async () => {
                const result = await toggleProjectLike({ projectId: project.id, userEmail: user?.email });
                pushToast(result.message, result.success ? undefined : "error");
              }}
              className="rounded-lg border border-violet-500/40 px-4 py-2 text-slate-100"
            >
              {hasLiked ? "Unstar Project" : "Star Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
