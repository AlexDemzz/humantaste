-- One scan per site at a time, across requests. expires_at is in epoch milliseconds.
CREATE TABLE scan_leases (
  slug TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
