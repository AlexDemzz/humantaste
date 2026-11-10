// PROTOTYPE fixture: a real report's checks with three patterns marked as found, so the page has something to show.
import type { RecentScan } from "@/lib/scan.functions";
import type { AnalysisResult } from "@/lib/types";

import report from "./fixture.json" with { type: "json" };

export const RESULT = report as AnalysisResult;

export const RECENT: RecentScan[] = [
  { slug: "yoursite.com", score: 82 },
  { slug: "linear.app", score: 96 },
  { slug: "raycast.com", score: 91 },
  { slug: "shadcn-landing-page.vercel.app", score: 12 },
];
