# Prompt: Update Existing Munro Entry Only

Update an existing Munro file at `munros/<munro-id>.md`.

Use `docs/plan.md` for high-level project intent and consistency.
Do not use this prompt to create new files.

## Input

- Munro ID (required)
- Fields to update (one or more), for example:
  - Date completed
  - Weather
  - Rating
  - Companions
  - Notes
  - The Moment
  - Summit photo path
  - Route photo path

## Rules

1. Target file must already exist at `munros/<munro-id>.md`.
2. If the file does not exist, stop and report: `Munro file not found: munros/<munro-id>.md`.
3. Update only fields explicitly provided.
4. Preserve all other content exactly as-is.
5. Never overwrite the full file when a partial edit is enough.
6. Do not change `Completion number` unless explicitly requested.
7. Keep existing heading and section structure aligned with `munros/template.md`.
8. Use `YYYY-MM-DD` for date values when a new date is provided.
9. If a provided value is intentionally blank, set it to `—`.
10. Keep tone concise and natural in Notes and The Moment.

## Output

- Return the full updated Markdown for `munros/<munro-id>.md` only.
