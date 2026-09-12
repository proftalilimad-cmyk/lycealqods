import { useEffect, useId, useRef, useState } from "react";

interface RingProps {
  percent: number; // 0 - 100
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  trackClassName?: string;
  delay?: number;
}

export default function Ring({
  percent,
  size = 96,
  stroke = 9,
  from = "#e6b457",
  to = "#d99e37",
  trackClassName = "text-white/10",
  delay = 250,
}: RingProps) {
  const id = useId().replace(/:/g, "");
  const [progress, setProgress] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mounted = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !mounted.current) {
          mounted.current = true;
          const t = window.setTimeout(() => setProgress(percent), delay);
          return () => window.clearTimeout(t);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [percent, delay]);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }} role="img" aria-label={`نسبة ${percent} في المئة`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`rg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClassName} stroke="currentColor" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#rg-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress / 100)}
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-lg font-extrabold leading-none text-inherit">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
