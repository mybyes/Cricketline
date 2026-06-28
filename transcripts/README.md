# Raw chat transcripts

Raw machine logs of the AI build sessions for this project (Claude Code `.jsonl`), kept so the
full conversation history is portable across machines / future sessions.

- `2026-06_session-*.jsonl` — the build conversation, in order (split across context compactions).
- Format: one JSON object per line (user/assistant messages + tool calls + results). Large and
  verbose — for the **distilled** version (decisions, rationale, state) read
  [`../PROJECT_LOG.md`](../PROJECT_LOG.md) instead; that's the useful summary.

**Notes**
- Scanned for secrets before committing — no API keys, Redis URLs, or tokens (env values were
  masked as `<set>` in the logs). Contains the owner's email address (own data, private repo).
- To read a session: `cat 2026-06_session-1.jsonl | jq -r 'select(.message) | .message'`
  (rough — the schema varies), or just grep for text.
- Safe to delete if you don't want the raw history; `PROJECT_LOG.md` retains the context.
