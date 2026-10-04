# Saved availability fix

The production `hdwpaxgbdrmezwkwumwk` REST endpoint for `saved_items` returned
404/PGRST205: the table is not exposed in the schema cache. The check requested
zero rows with the public key and did not read private bookmarks.

Saved now retains local bookmarks and pending account edits when cloud sync is
unavailable. It avoids repeating requests to a known missing table on every
bookmark tap; explicit retry and reconnect recheck availability. When sync
recovers, queued edits merge with the current cloud list. Local removals take
precedence during guest/account merging, including after a refresh.

Failed or thrown guest session checks do not turn working local bookmarks into
cloud errors. Account failures retain local edits. Browser storage failures
remain visible because persistence cannot be guaranteed in that case.

Discover no longer shows an account-sync error banner. Saved shows a quiet
"Saved on this device" status when needed. Detail uses the same accurate status;
the SVG presenter falls back to native content so the status remains visible.
Retry has a busy state, and notices support English and Telugu.

Validation: TypeScript and production build passed. Actual Saved-store tests
cover missing tables, offline edits, guest Auth failures, account changes,
storage errors, durable removals, and retry recovery. Chrome tests with mocked
transport cover missing-table Saved add/remove/retry and expired guest sessions.
Production cloud sync still requires the backend Saved table and ownership RLS;
the local fallback does not claim cross-device synchronization.
