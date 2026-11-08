-- One row per site: its latest scan, kept until "Score again" replaces it.
CREATE TABLE scans (
  slug TEXT PRIMARY KEY,
  methodology TEXT NOT NULL,
  score INTEGER NOT NULL,
  analyzed_at TEXT NOT NULL,
  result TEXT NOT NULL
);

CREATE INDEX scans_recent ON scans (methodology, analyzed_at DESC);
