import Reveal from "./Reveal";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
  dark?: boolean;
  align?: "center" | "start";
}

export default function SectionHeader({
  eyebrow,
  title,
  highlight,
  description,
  dark = false,
  align = "center",
}: SectionHeaderProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-start";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      <Reveal>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide ${
            dark
              ? "border-gold-400/30 bg-gold-400/10 text-gold-300"
              : "border-brand-200 bg-brand-50 text-brand-700"
          }`}
        >
          <span className={`size-1.5 rounded-full ${dark ? "bg-gold-400" : "bg-brand-500"}`} aria-hidden="true" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={90}>
        <h2
          className={`max-w-3xl font-display text-3xl font-extrabold leading-[1.3] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.25] ${
            dark ? "text-white" : "text-ink-900"
          }`}
        >
          {title}{" "}
          {highlight && (
            <span className="bg-gradient-to-l from-gold-400 via-gold-500 to-brand-500 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={180}>
          <p className={`max-w-2xl text-base leading-relaxed sm:text-lg ${dark ? "text-white/65" : "text-ink-500"}`}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
