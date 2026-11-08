import { Link } from "@tanstack/react-router";

import { Meter } from "@/components/meter";
import type { RecentScan } from "@/lib/scan.functions";

export const RecentScans = ({ scans }: { scans: RecentScan[] }) => {
  if (scans.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-4" aria-labelledby="recent">
      <h2 id="recent" className="text-foreground font-medium">
        Recently scored
      </h2>
      <ul>
        {scans.map((scan) => (
          <li key={scan.slug} className="border-b last:border-b-0">
            <Link
              to="/scan/$"
              params={{ _splat: scan.slug }}
              className="group text-foreground flex items-center gap-4 py-2.5"
            >
              <span className="font-book can-hover:group-hover:decoration-border min-w-0 flex-1 truncate underline decoration-transparent underline-offset-3 transition-colors duration-200 ease-out">
                {scan.slug}
              </span>
              <Meter score={scan.score} />
              <span className="w-8 text-right tabular-nums">{scan.score}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
