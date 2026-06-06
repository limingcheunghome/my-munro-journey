# Prompt: Create Munro Entry Scaffold

Create a starter file for a completed Munro using only a Munro ID.

## Input

- Munro ID (required), for example: `ben-nevis`

## Data Sources

- `munro-reference.csv` for ID to `friendly-name` lookup
- `munros/template.md` for the base structure

## Rules

1. Look up the provided Munro ID in `munro-reference.csv`.
2. If the ID is not found, stop and report: `Unknown Munro ID: <munro-id>`.
3. Target file is `munros/<munro-id>.md`.
4. If the target file already exists, do not overwrite it. Return the existing file content unchanged.
5. If the target file does not exist, create it from `munros/template.md` and apply these replacements:
   - `# <Munro Name>` -> `# <friendly-name>`
   - Replace `<munro-id>` tokens in image paths with the provided Munro ID
6. Set `Completion number` for new files to:
   - number of files matching `munros/*.md`
   - minus 1 to exclude `munros/template.md`
   - then plus 1 for this new file
7. Leave all other fields as template placeholders so they can be filled manually later.
8. After finishing this prompt, run `docs/prompts/update-readme.md` to refresh `README.md`.

## Output

- Return the full Markdown content for `munros/<munro-id>.md`.
- Then return a short confirmation that `docs/prompts/update-readme.md` was run.
