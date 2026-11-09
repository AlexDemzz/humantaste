import { createServerFn } from "@tanstack/react-start";

import type { StarCounts } from "./taste-skills";

export const skillStarsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StarCounts> => {
    const { loadSkillStars } = await import("./skill-stars.server");
    return loadSkillStars();
  }
);
