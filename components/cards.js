import Image from "next/image";

export function EventCard({ event, action }) {
  return (
    <div className="glass-card glass-panel hover-lift animated-glow overflow-hidden p-0 hover:border-cyan-500/30">
      {event.banner ? (
        <Image src={event.banner} alt={event.title} width={900} height={450} className="h-36 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
            {event.category || "General"}
          </span>
          <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
            {event.date} {event.time ? `• ${event.time}` : ""}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-cyan-300">{event.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{event.description}</p>
        <p className="mt-3 text-xs text-slate-400">
          {event.venue || event.mode || "Campus Venue"} • {event.mode || "Offline"}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}

export function ProjectCard({ project }) {
  return (
    <div className="glass-card glass-panel hover-lift animated-glow overflow-hidden p-0 hover:border-cyan-500/30">
      {project.thumbnail ? (
        <Image src={project.thumbnail} alt={project.title} width={900} height={450} className="h-36 w-full object-cover" />
      ) : null}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {project.featured ? (
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
              Featured
            </span>
          ) : null}
          {project.archived ? (
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-slate-200">
              Archived
            </span>
          ) : null}
          {project.year ? <span className="text-xs text-slate-400">{project.year}</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-cyan-300">{project.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(project.tech || "")
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((tag) => (
              <span key={tag} className="rounded-full border border-cyan-500/15 px-2.5 py-1 text-[11px] text-cyan-200">
                {tag}
              </span>
            ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {project.domain || "General"} • Team {Array.isArray(project.members) ? project.members.length : 0} • {project.likes || 0} stars
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {(project.members || []).join(", ")}
        </p>
      </div>
    </div>
  );
}

export function TeamCard({ member }) {
  return (
    <div className="glass-card glass-panel hover-lift animated-glow p-5 hover:border-cyan-500/30">
      {member.photo ? (
        <Image src={member.photo} alt={member.name} width={96} height={96} className="mb-3 h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-700/45 to-cyan-500/30 text-base font-bold text-cyan-100">
          {member.name.slice(0, 1)}
        </div>
      )}
      <h3 className="text-lg font-semibold text-cyan-300">{member.name}</h3>
      <p className="text-sm text-cyan-200">{member.role}</p>
      {member.batch ? <p className="text-xs text-slate-400">Batch {member.batch}</p> : null}
      <p className="mt-2 text-sm leading-6 text-slate-400">{member.expertise}</p>
    </div>
  );
}

export function GalleryCard({ src, alt }) {
  return (
    <div className="glass-card hover-lift animated-glow overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={700}
        height={400}
        className="h-48 w-full object-cover transition duration-300 hover:scale-105"
      />
    </div>
  );
}
