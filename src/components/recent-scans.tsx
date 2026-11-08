import { Link } from "@tanstack/react-router";

import { Meter } from "@/components/meter";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import type { RecentScan } from "@/lib/scan.functions";

export const RecentScans = ({ scans }: { scans: RecentScan[] }) => {
  if (scans.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-4" aria-labelledby="recent">
      <h2 id="recent" className="text-foreground font-semibold">
        Recently scored
      </h2>
      <ul className="flex flex-col gap-2">
        {scans.map((scan) => (
          <li key={scan.slug}>
            <Item
              variant="outline"
              render={<Link to="/scan/$" params={{ _splat: scan.slug }} />}
            >
              <ItemContent>
                <ItemTitle>{scan.slug}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <Meter score={scan.score} />
                <span className="text-foreground w-8 text-right tabular-nums">
                  {scan.score}
                </span>
              </ItemActions>
            </Item>
          </li>
        ))}
      </ul>
    </section>
  );
};
