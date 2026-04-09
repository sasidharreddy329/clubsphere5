export default function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="section-frame mb-10 animated-fade-up pt-3">
      {eyebrow ? <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-cyan-300">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-cyan-300 sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">{subtitle}</p> : null}
    </div>
  );
}
