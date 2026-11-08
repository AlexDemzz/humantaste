import type { AnalysisResult, SignalHit, SignalResult } from "./types";

/** A DESIGN.md-style instruction block an agent can follow to remove the defaults this run found. */
export const agentPrompt = (result: AnalysisResult): string => {
  const hits = result.signals.filter(
    (s): s is SignalResult & { hit: SignalHit } => s.hit !== null
  );
  const host = result.slug;
  if (hits.length === 0) {
    return `# Design notes for ${host}\n\nhumantaste found no AI-template tells (score ${result.score}/100, where 100 is every choice made on purpose). Keep the current type, colour and layout decisions; don't introduce stock shadcn tokens, Inter/Geist-only type, indigo-to-pink gradients, or three-card feature grids.\n`;
  }
  const rules = hits
    .map(
      (s, i) =>
        `${i + 1}. **${s.title}**. Found: ${s.hit.evidence}.\n   Do: ${s.fix}`
    )
    .join("\n");
  return `# Design notes for ${host}

humantaste scored this page ${result.score}/100, where 0 is a pure AI template and 100 is every choice made on purpose. Apply these changes. Keep the content and information architecture; change only how it looks and reads.

## Fix

${rules}

## Rules for every change

- Every visual value (font, colour, radius, shadow, spacing) is a choice you can justify for this product, not a library default.
- Prefer one strong idea over many effects: no gradients, glows or blur unless they carry meaning.
- Align content to a start edge; centre only the hero, if at all.
- Copy names what the product does and for whom; no phrase that would fit any other product.
- Keep it accessible: 4.5:1 text contrast, visible focus, reduced-motion respected.
`;
};
