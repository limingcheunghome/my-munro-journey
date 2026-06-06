# Prompt: Create/Update README Dashboard

Update `README.md` using `docs/plan.md` as the high-level source of truth.

Do not restate or reinterpret project goals from `docs/plan.md`.
This prompt is only the operational contract for computing the dashboard content.

## Data Sources

- `munros/*.md` for completed entries
- `munro-reference.csv` for ID to `friendly-name` mapping

## Completion Rules

1. A Munro is completed if a file exists at `munros/<munro-id>.md`.
2. Exclude `munros/template.md` from all counts and table rows.
3. For each completed file:
   - derive `<munro-id>` from filename
   - map `<munro-id>` to `friendly-name` in `munro-reference.csv`
   - extract from the Munro file: completion number, date completed, rating, companions

## Companion Ranking Rules

1. Build companion counts from all completed Munro files.
2. Split companions using commas (`,`), trim surrounding whitespace, and treat names case-insensitively for counting.
3. Ignore `solo` in any letter case.
4. Use tie-aware ranking for the top 3 ranks:
   - include all companions tied at rank 3
   - companions with equal counts share the same rank number

## README Output Contract

1. Progress line must be: `Completed: <count> / 282`.
2. Remaining line must be: `282 - <count>`.
3. Completed table must have exactly these columns in order:
   - `#`
   - `Munro`
   - `Date`
   - `Rating`
   - `Companions`
4. In the `Munro` column, render the name as a Markdown link to its file using this format:
   - `[<friendly-name>](munros/<munro-id>.md)`
5. Sort table rows by completion number descending.
6. If there are no completed Munros, keep one placeholder row of dashes.
7. Keep formatting clean and easy to maintain manually.
8. Include a `Top 3 Companion Ranks (Tie-Aware)` section with a Markdown table using columns in this order:
   - `Rank`
   - `Companion`
   - `Appearances`
