import { Link } from "@tanstack/react-router";

import { HALF_AT } from "@/lib/score";

export const HowItWorks = () => (
  <footer
    id="how"
    className="text-faint-foreground flex scroll-mt-8 flex-col gap-2 text-sm"
  >
    <h2 className="text-muted-foreground">How it works</h2>
    <p>
      humantaste looks for the patterns AI generators reach for when nobody
      chose otherwise. A default is not a crime: Inter is a great face and
      shadcn is a great start. The score only says how many choices were left to
      the generator.
    </p>
    <p>
      Code finds the patterns: it reads the HTML and CSS, renders the page in
      headless Chrome at 1440×900 and measures what painted. Each pattern has a
      weight in points and the evidence for it. A typeface of the site’s own and
      Jev’s look at the screenshot can weigh those points down or up, never add
      a pattern. Then score = 100 ÷ (1 + (points ÷ {HALF_AT}
      )²), so one habit costs little and five stacked patterns cost most of the
      score.
    </p>
    <nav aria-label="Site information" className="flex gap-4 pt-2">
      <Link className="text-link" to="/contact">
        Contact
      </Link>
      <Link className="text-link" to="/privacy">
        Privacy
      </Link>
    </nav>
  </footer>
);
