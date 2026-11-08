-- Lets a rescan reuse the Jev read when the page rendered byte for byte the same.
ALTER TABLE scans ADD COLUMN shot_hash TEXT;

-- Scans started per UTC day, for the whole site and for each hashed client.
CREATE TABLE scan_quota (
  day TEXT NOT NULL,
  scope TEXT NOT NULL,
  used INTEGER NOT NULL,
  PRIMARY KEY (day, scope)
);
