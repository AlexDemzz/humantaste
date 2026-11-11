-- Reports from every methodology are listed now, newest first.
DROP INDEX scans_recent;
CREATE INDEX scans_recent ON scans (analyzed_at DESC);
