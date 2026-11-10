// PROTOTYPE route, delete with src/prototypes/skin once a skin wins.
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { Harness, LEVEL_KEYS } from "@/prototypes/skin/harness";
import type { HarnessSearch } from "@/prototypes/skin/harness";

import holoCardCss from "@/components/holo-card/holo-card.css?url";
import cardCss from "@/prototypes/skin/card.css?url";
import pickerCss from "@/prototypes/skin/picker.css?url";
import fxCss from "@/prototypes/skin/variants/fx.css?url";
import modernCss from "@/prototypes/skin/variants/modern.css?url";
import todayCss from "@/prototypes/skin/variants/today.css?url";

const wholeNumber = (value: unknown, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : undefined;
};

const SkinPrototype = () => {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const onSearch = useCallback(
    (patch: HarnessSearch) => {
      void navigate({
        search: (previous) => ({ ...previous, ...patch }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate]
  );
  return <Harness search={search} onSearch={onSearch} />;
};

export const Route = createFileRoute("/prototypes/skin")({
  validateSearch: (search: Record<string, unknown>): HarnessSearch => ({
    v: wholeNumber(search.v, 1, 9),
    page: search.page === "home" ? "home" : undefined,
    score: wholeNumber(search.score, 0, 100),
    level: LEVEL_KEYS.find((key) => key === search.level),
  }),
  head: () => ({
    meta: [
      { title: "Skin prototype | humantaste" },
      { name: "robots", content: "noindex" },
    ],
    links: [holoCardCss, cardCss, pickerCss, todayCss, modernCss, fxCss].map(
      (href) => ({ rel: "stylesheet", href })
    ),
  }),
  component: SkinPrototype,
});
