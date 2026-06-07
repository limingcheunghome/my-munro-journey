#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const README_PATH = path.join(ROOT_DIR, 'README.md');
const DERIVED_COMPLETED_EXPORT_PATH = path.join(ROOT_DIR, 'completed-munros.derived.json');
const MUNRO_REFERENCE_PATH = path.join(ROOT_DIR, 'munro-reference.csv');
const MUNROS_DIR = path.join(ROOT_DIR, 'munros');
const TEMPLATE_PATH = path.join(MUNROS_DIR, 'template.md');
const TOTAL_MUNROS = 282;
const TEMPLATE_FILE_NAME = 'template.md';

function main() {
  const [, , command = 'rebuild', ...rest] = process.argv;
  const args = parseArgs(rest);

  if (command === 'add') {
    addMunro(args);
    return;
  }

  if (command === 'rebuild') {
    rebuildOutputs();
    return;
  }

  throw new Error(`Unsupported command: ${command}`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const trimmed = token.slice(2);
    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex >= 0) {
      const key = trimmed.slice(0, separatorIndex);
      const value = trimmed.slice(separatorIndex + 1);
      args[key] = value;
      continue;
    }

    const key = trimmed;
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function addMunro(args) {
  const munroId = requiredArg(args, 'munro-id');
  const dateCompleted = requiredArg(args, 'date-completed');
  const companions = requiredArg(args, 'companions');
  const ratingInput = requiredArg(args, 'rating');

  validateDate(dateCompleted);
  const rating = validateRating(ratingInput);
  const referenceMap = readReferenceMap();
  const friendlyName = referenceMap.get(munroId);

  if (!friendlyName) {
    throw new Error(`Unknown munro id: ${munroId}`);
  }

  const targetPath = path.join(MUNROS_DIR, `${munroId}.md`);

  if (fs.existsSync(targetPath)) {
    throw new Error(`Munro record already exists: munros/${munroId}.md`);
  }

  const completionNumber = listCompletedRecordFileNames().length + 1;
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const recordContent = template
    .replace('# <Munro Name>', `# ${friendlyName}`)
    .replace('> <Short subtitle, optional>', `> Munro #${completionNumber} completed on ${dateCompleted}`)
    .replaceAll('<munro-id>', munroId)
    .replace('| Date completed | YYYY-MM-DD |', `| Date completed | ${dateCompleted} |`)
    .replace('| Completion number | <e.g. 1> |', `| Completion number | ${completionNumber} |`)
    .replace('| Rating | <x> / 10 |', `| Rating | ${rating} / 10 |`)
    .replace('| Companions | <names> |', `| Companions | ${companions} |`);

  fs.writeFileSync(targetPath, recordContent, 'utf8');
  rebuildOutputs();
}

function rebuildOutputs() {
  const referenceMap = readReferenceMap();
  const records = readCompletedRecords(referenceMap);
  const companionRanks = buildCompanionRanks(records);
  const generatedAt = new Date().toISOString();
  const completedPayload = {
    generatedFrom: 'munros/*.md',
    generatedAt,
    completedCount: records.length,
    totalMunros: TOTAL_MUNROS,
    completedMunros: records.map((record) => ({
      number: record.number,
      name: record.name,
      slug: record.slug,
      recordPath: record.recordPath,
      dateCompleted: record.dateCompleted,
      rating: record.rating,
      companionsText: record.companionsText,
    })),
  };

  fs.writeFileSync(DERIVED_COMPLETED_EXPORT_PATH, `${JSON.stringify(completedPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(README_PATH, renderReadme(records, companionRanks), 'utf8');
}

function readReferenceMap() {
  const csv = fs.readFileSync(MUNRO_REFERENCE_PATH, 'utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1);
  const map = new Map();

  for (const row of rows) {
    const separatorIndex = row.indexOf(',');

    if (separatorIndex < 0) {
      continue;
    }

    const id = row.slice(0, separatorIndex).trim();
    const friendlyName = row.slice(separatorIndex + 1).trim();
    map.set(id, friendlyName);
  }

  return map;
}

function readCompletedRecords(referenceMap) {
  const records = listCompletedRecordFileNames().map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const filePath = path.join(MUNROS_DIR, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    const details = readDetailsTable(content);
    const number = parseInteger(details['Completion number'], `Invalid completion number in ${fileName}`);
    const dateCompleted = details['Date completed'];
    const companionsText = details.Companions;
    const rating = parseRating(details.Rating);

    validateDate(dateCompleted, `Invalid date in ${fileName}`);

    return {
      number,
      name: referenceMap.get(slug) || slug,
      slug,
      recordPath: `munros/${fileName}`,
      dateCompleted,
      rating,
      ratingText: rating === null ? '—' : `${rating} / 10`,
      companionsText,
    };
  });

  const duplicateNumbers = findDuplicateCompletionNumbers(records);

  if (duplicateNumbers.length > 0) {
    throw new Error(`Duplicate completion numbers found: ${duplicateNumbers.join(', ')}`);
  }

  return records.sort((left, right) => right.number - left.number);
}

function listCompletedRecordFileNames() {
  return fs
    .readdirSync(MUNROS_DIR)
    .filter((fileName) => fileName.endsWith('.md') && fileName !== TEMPLATE_FILE_NAME)
    .sort();
}

function readDetailsTable(markdown) {
  const details = {};
  const tablePattern = /^\|\s*(.+?)\s*\|\s*(.*?)\s*\|$/gm;
  let match;

  while ((match = tablePattern.exec(markdown)) !== null) {
    const key = match[1];
    const value = match[2];

    if (key !== 'Field' && key !== '-------') {
      details[key] = value;
    }
  }

  const requiredFields = ['Date completed', 'Completion number', 'Rating', 'Companions'];

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(details, field)) {
      throw new Error(`Missing ${field} in Munro details table.`);
    }
  }

  return details;
}

function parseRating(value) {
  const match = value.match(/^(\d{1,2})\s*\/\s*10$/);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function buildCompanionRanks(records) {
  const counts = new Map();

  for (const record of records) {
    for (const companion of splitCompanions(record.companionsText)) {
      const key = companion.toLowerCase();
      const existing = counts.get(key);

      if (existing) {
        existing.count += 1;
        continue;
      }

      counts.set(key, { displayName: companion, count: 1 });
    }
  }

  const sorted = [...counts.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.displayName.localeCompare(right.displayName, 'en');
  });

  const ranks = [];
  let currentRank = 0;
  let previousCount = null;

  for (const entry of sorted) {
    if (entry.count !== previousCount) {
      currentRank += 1;
      previousCount = entry.count;
    }

    if (currentRank > 3) {
      break;
    }

    ranks.push({
      rank: currentRank,
      companion: entry.displayName,
      appearances: entry.count,
    });
  }

  return ranks;
}

function splitCompanions(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== 'solo');
}

function renderReadme(records, companionRanks) {
  const completedCount = records.length;
  const remainingCount = TOTAL_MUNROS - completedCount;
  const completedRows = records.length > 0
    ? records.map((record) => {
        return `| ${record.number} | [${record.name}](munros/${record.slug}.md) | ${record.dateCompleted} | ${record.ratingText} | ${record.companionsText} |`;
      }).join('\n')
    : '| - | - | - | - | - |';
  const companionRows = companionRanks.length > 0
    ? companionRanks.map((rank) => `| ${rank.rank} | ${rank.companion} | ${rank.appearances} |`).join('\n')
    : '| - | - | - |';

  return [
    '# My Munro Journey',
    '',
    'A personal record of my journey to complete all 282 Scottish Munros.',
    '',
    '---',
    '',
    '## Progress',
    '',
    `**Completed: ${completedCount} / ${TOTAL_MUNROS}**`,
    '',
    `**Remaining: ${TOTAL_MUNROS} - ${completedCount} = ${remainingCount}**`,
    '',
    '---',
    '',
    '## Completed Munros',
    '',
    '| # | Munro | Date | Rating | Companions |',
    '|---|---|---|---|---|',
    completedRows,
    '',
    '---',
    '',
    '## Top 3 Companion Ranks (Tie-Aware)',
    '',
    '| Rank | Companion | Appearances |',
    '|---|---|---|',
    companionRows,
    '',
    '---',
    '',
    '## Remaining Munros',
    '',
    `${remainingCount} Munros to go. See the [munros/](munros/) folder for individual records as they are completed.`,
    '',
    '---',
    '',
    '## About',
    '',
    'Updates are manual, roughly every 3–4 weeks. Photos are stored in [images/](images/) organised by Munro.',
    '',
    'Machine-readable export: `completed-munros.derived.json` is a derived export generated from `munros/*.md` and `munro-reference.csv`. It is not the source of truth for this README.',
    '',
  ].join('\n');
}

function findDuplicateCompletionNumbers(records) {
  const seen = new Set();
  const duplicates = new Set();

  for (const record of records) {
    if (seen.has(record.number)) {
      duplicates.add(record.number);
      continue;
    }

    seen.add(record.number);
  }

  return [...duplicates].sort((left, right) => left - right);
}

function requiredArg(args, key) {
  const value = args[key];

  if (!value) {
    throw new Error(`Missing required argument: --${key}`);
  }

  return value.trim();
}

function validateDate(value, message = `Invalid date: ${value}`) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(message);
  }
}

function validateRating(value) {
  const numericRating = parseInteger(value, `Invalid rating: ${value}`);

  if (numericRating < 1 || numericRating > 10) {
    throw new Error(`Rating must be between 1 and 10: ${value}`);
  }

  return numericRating;
}

function parseInteger(value, message) {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw new Error(message);
  }

  return number;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}