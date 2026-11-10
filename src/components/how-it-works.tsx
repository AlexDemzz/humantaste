import { Link } from "@tanstack/react-router";

import { JEV_MAX_POINTS, OWN_FACE_POINTS } from "@/lib/score";

export const HowItWorks = () => (
  <footer id="how" className="flex scroll-mt-8 flex-col gap-4">
    <h2 className="text-foreground font-semibold">How it works</h2>
    <div className="flex flex-col gap-2 text-sm">
      <p>
        humantaste looks for the patterns AI generators reach for when nobody
        chose otherwise. A default is not a crime: Inter is a great face and
        shadcn is a great start. The score only says how many choices were left
        to the generator.
      </p>
      <p>
        Code finds the patterns: it reads the HTML and CSS, renders the page in
        headless Chrome at 1440×900 and measures what painted. Every page starts
        at 100, and each pattern found takes points off, up to its weight, with
        the evidence for it. Signs of a human hand give some back: Jev’s look at
        the screenshot up to {JEV_MAX_POINTS}, a typeface of the site’s own{" "}
        {OWN_FACE_POINTS}. Nothing else moves the score, so you can redo the sum
        from any report.
      </p>
      <nav aria-label="Site information" className="flex gap-4 pt-2">
        <Link className="text-link" to="/contact">
          Contact
        </Link>
        <Link className="text-link" to="/privacy">
          Privacy
        </Link>
      </nav>
    </div>
  </footer>
);
