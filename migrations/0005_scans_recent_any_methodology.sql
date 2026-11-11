-- Reports from older methodologies are listed too, newest first.
DROP INDEX scans_recent;
CREATE INDEX scans_recent ON scans (analyzed_at DESC);
