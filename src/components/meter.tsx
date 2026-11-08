import { cn } from "@/lib/utils";

const TICKS = 20;

/** A 0–100 meter in the card's ticks, small enough for a list row. */
export const Meter = ({ score }: { score: number }) => {
  const lit = Math.round((score / 100) * TICKS);
  return (
    <span className="flex h-3 shrink-0 gap-0.5" aria-hidden="true">
      {Array.from({ length: TICKS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "w-0.5 rounded-full",
            index < lit ? "bg-foreground" : "bg-meter-off"
          )}
        />
      ))}
    </span>
  );
};
