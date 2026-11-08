/** The foil ink of the score card, in the order the card shows it at rest. */
const INK = ["#ffcf77", "#f4a5ec", "#a0baff", "#76e2e7", "#adeb9f"];

/** The card in miniature: dark, an italic h in the score's face, and the meter's foil ticks. */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#191715" />
    <text
      x="7.5"
      y="21"
      fill="#f0eeec"
      fontFamily="Kanit, system-ui"
      fontStyle="italic"
      fontWeight="900"
      fontSize="19"
    >
      h
    </text>
    {INK.map((colour, index) => (
      <rect
        key={colour}
        x={7 + index * 4}
        y="24"
        width="2"
        height="3"
        rx="0.5"
        fill={colour}
      />
    ))}
  </svg>
);

export const Logo = () => (
  <span className="text-foreground inline-flex items-center gap-2">
    <LogoMark className="size-7 shrink-0" />
    <span className="font-display text-xl leading-none font-black tracking-tight italic">
      humantaste
    </span>
  </span>
);
