# Munro Journey Tracker

## Purpose
Create a simple, personal GitHub repository to track progress toward completing all 282 Scottish Munros.

The focus is on:
- Recording each completion
- Capturing both big moments (summits) and small moments (reflections)
- Keeping the system lightweight and easy to maintain
- it should be easy to edit which is why markdown is chosen

---

## Core Requirements

### 1. Munro List
- Maintain a complete list of all 282 Munros
- The list of Munros with ID and friendly name is in `munro-reference.csv`
- Track completion status (completed / not completed)
- A Munro is completed if a file exists in `munros/` using the Munro ID from `munro-reference.csv`

---

### 2. Per-Munro Record (Completed Munros)

For each Munro, record:

- Name
- Completion status
- Date completed
- Completion number (chronological order, e.g. 1 for first completed)
- Weather conditions
- Personal notes / reflections
- Rating (simple scale, e.g. 1–10)
- People I went with (companions)

Photos:
- Summit photo
- Route photo
- Other photos

Optional reflective field:
- A small “moment” (e.g. something noticed or appreciated — weather, silence, wildlife)
- This can be a short paragraph

---

## Constraints

- Updates are manual (roughly every 3–4 weeks)
- Must be quick and simple to update
- Prefer Markdown over complex tooling
- Repo is mainly for personal use and sharing with friends

---

## Proposed Structure

```text
munro-journey/
├── README.md            # Summary/dashboard
├── munro-reference.csv  # Canonical Munro ID/name list
├── munros/              # One file per completed Munro
├── images/              # Photos organised per Munro
└── docs/
    └── plan.md          # This file
```

---

## Data Design

### Munro Files

- One Markdown file per Munro
- Consistent template across all files
- Files may initially be incomplete until the Munro is completed

Filename convention:

- `munros/<munro-id>.md` where `<munro-id>` matches `munro-reference.csv`

---

### Images

Organised by Munro:

```text
images/
  ben-nevis/
    summit.jpg
    route.jpg
```

---

## README Dashboard

`README.md` should include:

- Project description
- Total Munros completed (e.g. 12 / 282)
- Table of completed Munros with completion number (use `#` for brevity), name, date completed, and rating.
- In the completed Munros table, the Munro name should link to its detail file at `munros/<munro-id>.md`.
- List out the top 3 companion ranks based on who has appeared the most in all `munros/<munro-id>.md` files under companions.
- Use tie-aware ranking: if multiple companions share the same count at rank 3, include all of them with rank 3.
- Rules to identify a unique companion: individuals are in the comma-separated list, names are case-insensitive, ignore `solo` (any case).

Completion in the table is based on whether a file exists under `munros/`.

This can initially be manual and improved later. Eventually, it can be driven by a GitHub Action that updates the summary page based on repo contents on commit.

---

## Future Enhancements (Optional)

- Generate README summary automatically
- Maintain a JSON index of Munros - is this easier to work with than .md files
- If a JSON export exists, keep it clearly derived from `munros/*.md` rather than treating it as a source of truth
- Add health stats per munro - Garmin Fitt files
- Add map or location data from Garmin e.g. .gpx
- Add other derived information like number completed each year, add time completed
- consider how this information can be made private and password protected
- create list of Munros i will definitely not do like an-stuc
- consider GitHub actions to update readme summary

---

## Principles

- Keep it simple over clever
- Prioritise consistency over perfection
- Let the structure evolve naturally over time
- Use Copilot to assist, not to over-engineer

---
