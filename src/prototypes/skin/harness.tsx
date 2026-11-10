// PROTOTYPE, throw away once a variant wins.
// Where the rounds have landed: the footer is "Modern line", the card effect Gloss, its top level "Prism", its
// peel-off cover "Plate". One variant is left in the picker; the levels pill still shows every level.
// Keys: R puts the cover back, L steps through the card's levels (the last stop shows all four at once), H flips
// between the report and the home page. ?score=<0-100> prints any score.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { tierFor } from "@/lib/score";
import type { CardTier } from "@/lib/score";

import type { PageKey, Print, Skin } from "./shell";
import { Shell } from "./shell";
import { GLOSS } from "./variants/fx";

const SKINS: Skin[] = [GLOSS];

/** The card's four levels, each with a score that lands in it. */
const LEVELS: { key: CardTier; name: string; score: number; range: string }[] =
  [
    { key: "matte", name: "Matte", score: 30, range: "0 to 44" },
    { key: "chrome", name: "Chrome", score: 62, range: "45 to 74" },
    { key: "holo", name: "Holo", score: 82, range: "75 to 89" },
    { key: "prismatic", name: "Prismatic", score: 100, range: "90 to 100" },
  ];

export type LevelKey = CardTier | "all";

export const LEVEL_KEYS: LevelKey[] = [
  ...LEVELS.map((level) => level.key),
  "all",
];

const LEVEL_NAMES = [...LEVELS.map((level) => level.name), "All"];

export interface HarnessSearch {
  v?: number;
  page?: PageKey;
  score?: number;
  level?: LevelKey;
}

/** A prismatic score: the level this round is about. */
const DEFAULT_SCORE = 100;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (/^(INPUT|TEXTAREA|SELECT)$/u.test(target.tagName) ||
    target.isContentEditable);

/** The picker's pill: the sliding highlight, one button per name, then whatever follows the divider. */
const Pill = ({
  label,
  className,
  names,
  current,
  onPick,
  children,
}: {
  label: string;
  className?: string;
  names: string[];
  current: number;
  onPick: (index: number) => void;
  children?: ReactNode;
}) => {
  const [ready, setReady] = useState(false);
  const [highlight, setHighlight] = useState({ left: 0, width: 0 });
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = items.current[current];
      if (el) {
        setHighlight({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true))
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav
      className={className ? `proto-picker ${className}` : "proto-picker"}
      aria-label={label}
      data-ready={ready ? "" : undefined}
    >
      <span
        className="proto-picker-highlight"
        aria-hidden="true"
        style={{
          width: highlight.width,
          transform: `translateX(${highlight.left}px)`,
        }}
      />
      {names.map((name, index) => (
        <button
          key={name}
          ref={(el) => {
            items.current[index] = el;
          }}
          type="button"
          className="proto-picker-item"
          data-active={index === current ? "" : undefined}
          aria-current={index === current ? "true" : undefined}
          onClick={() => onPick(index)}
        >
          {name}
        </button>
      ))}
      {children}
    </nav>
  );
};

const printsFor = (search: HarnessSearch, levelKey: LevelKey): Print[] => {
  if (levelKey === "all") {
    return LEVELS.map(({ name, score, range }) => ({
      score,
      caption: `${name}, scores ${range}`,
    }));
  }
  const picked = LEVELS.find(({ key }) => key === search.level);
  return [{ score: picked?.score ?? search.score ?? DEFAULT_SCORE }];
};

export const Harness = ({
  search,
  onSearch,
}: {
  search: HarnessSearch;
  onSearch: (patch: HarnessSearch) => void;
}) => {
  const current = Math.min(SKINS.length, Math.max(1, search.v ?? 1)) - 1;
  const page: PageKey = search.page ?? "report";
  // A level picked in the pill wins; otherwise the level is whatever the score in the URL lands in.
  const levelKey: LevelKey =
    search.level ?? tierFor(search.score ?? DEFAULT_SCORE);
  const level = LEVEL_KEYS.indexOf(levelKey);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        isTyping(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }
      const digit = Number.parseInt(event.key, 10);
      if (digit >= 1 && digit <= SKINS.length) {
        onSearch({ v: digit });
      } else if (event.key === "ArrowRight") {
        onSearch({ v: ((current + 1) % SKINS.length) + 1 });
      } else if (event.key === "ArrowLeft") {
        onSearch({ v: ((current - 1 + SKINS.length) % SKINS.length) + 1 });
      } else if (event.key === "r" || event.key === "R") {
        setReplay((count) => count + 1);
      } else if (event.key === "h" || event.key === "H") {
        onSearch({ page: page === "home" ? "report" : "home" });
      } else if (event.key === "l" || event.key === "L") {
        onSearch({
          level: LEVEL_KEYS[(level + 1) % LEVEL_KEYS.length],
          score: undefined,
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, level, onSearch, page]);

  const skin = SKINS[current] ?? GLOSS;

  return (
    <>
      <Shell
        key={`${skin.key}-${replay}`}
        skin={skin}
        page={page}
        prints={printsFor(search, levelKey)}
      />
      {page === "report" && (
        <Pill
          label="Card levels"
          className="proto-levels"
          names={LEVEL_NAMES}
          current={level}
          onPick={(index) =>
            onSearch({ level: LEVEL_KEYS[index], score: undefined })
          }
        />
      )}
      <Pill
        label="Prototype variants"
        names={SKINS.map((entry) => entry.name)}
        current={current}
        onPick={(index) => onSearch({ v: index + 1 })}
      >
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          type="button"
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => setReplay((count) => count + 1)}
        >
          ↻
        </button>
      </Pill>
    </>
  );
};
