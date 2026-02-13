import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const DEFAULT_PLAYBOOK_PATH = path.resolve(process.cwd(), "docs", "build-playbook.md");

const STATUS_LABELS = {
  done: "Done",
  in_progress: "In Progress",
  blocked: "Blocked",
  not_started: "Not Started"
};

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripInlineMarkdown(value) {
  let output = normalizeText(value);
  output = output.replace(/`([^`]+)`/g, "$1");
  output = output.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  output = output.replace(/\*\*([^*]+)\*\*/g, "$1");
  output = output.replace(/\*([^*]+)\*/g, "$1");
  return normalizeText(output);
}

function normalizeStatus(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "done") return STATUS_LABELS.done;
  if (normalized === "in progress") return STATUS_LABELS.in_progress;
  if (normalized === "blocked") return STATUS_LABELS.blocked;
  if (normalized === "not started") return STATUS_LABELS.not_started;
  return STATUS_LABELS.not_started;
}

function parseCheckpointId(value) {
  const match = normalizeText(value).match(/^(\d+(?:\.\d+)+)\b/);
  return match ? match[1] : null;
}

function parseKeyValue(lines, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedKey}:\\s*(.+)$`, "i");

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(pattern);
    if (match) {
      return stripInlineMarkdown(match[1]);
    }
  }

  return "";
}

function parseProgressRows(lines) {
  const headerIndex = lines.findIndex((line) =>
    /^\|\s*Checkpoint\s*\|\s*Status\s*\|\s*Notes\s*\|$/i.test(line.trim())
  );

  if (headerIndex < 0) {
    return [];
  }

  const rows = [];
  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line.startsWith("|")) {
      break;
    }

    const cells = line.split("|").slice(1, -1).map((cell) => stripInlineMarkdown(cell));
    if (cells.length < 2) {
      continue;
    }

    const checkpoint = cells[0];
    if (!checkpoint) {
      continue;
    }

    rows.push({
      checkpoint,
      status: normalizeStatus(cells[1]),
      notes: cells[2] || ""
    });
  }

  return rows;
}

function parseCheckpointDefinitions(lines) {
  const definitions = [];
  const headingPattern = /^###\s+Checkpoint\s+(\d+(?:\.\d+)+)\s*-\s*(.+)$/i;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].trim().match(headingPattern);
    if (!match) {
      continue;
    }

    const id = match[1];
    const name = stripInlineMarkdown(match[2]);
    const tasks = [];
    let inTasks = false;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      const trimmed = line.trim();

      if (/^###\s+Checkpoint\s+/i.test(trimmed) || /^##\s+/i.test(trimmed)) {
        break;
      }

      if (/^Tasks:\s*$/i.test(trimmed)) {
        inTasks = true;
        continue;
      }

      if (!inTasks) {
        continue;
      }

      if (/^[A-Za-z][A-Za-z /()_-]*:\s*$/.test(trimmed)) {
        break;
      }

      const bulletMatch = line.match(/^\s*-\s+(.+)\s*$/);
      if (!bulletMatch) {
        continue;
      }

      tasks.push(stripInlineMarkdown(bulletMatch[1]));
    }

    definitions.push({
      id,
      title: `Checkpoint ${id} - ${name}`,
      tasks
    });
  }

  return definitions;
}

function formatDateLabel(value) {
  if (!value) {
    return "Not set";
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.valueOf())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

function buildNextSteps(entries, currentIndex) {
  if (currentIndex < 0) {
    return [];
  }

  const currentEntry = entries[currentIndex];
  const steps = [];

  if (currentEntry.status === STATUS_LABELS.blocked) {
    steps.push(`Unblock ${currentEntry.title}.`);
  } else if (currentEntry.status !== STATUS_LABELS.done) {
    steps.push(`Finish ${currentEntry.title}.`);
  }

  for (let index = currentIndex + 1; index < entries.length && steps.length < 4; index += 1) {
    if (entries[index].status === STATUS_LABELS.done) {
      continue;
    }
    steps.push(`Start ${entries[index].title}.`);
  }

  return steps;
}

export function parseBuildTrackerFromMarkdown(markdown, options = {}) {
  const sourcePath = options.sourcePath || "docs/build-playbook.md";
  const lines = String(markdown || "").split(/\r?\n/);
  const progressRows = parseProgressRows(lines);
  const checkpointDefinitions = parseCheckpointDefinitions(lines);
  const explicitLastUpdated = parseKeyValue(lines, "Tracker Last Updated");
  const explicitCurrentCheckpoint = parseKeyValue(lines, "Current Checkpoint");

  const rowById = new Map();
  for (const row of progressRows) {
    const id = parseCheckpointId(row.checkpoint);
    if (!id || rowById.has(id)) {
      continue;
    }
    rowById.set(id, row);
  }

  let entries = checkpointDefinitions.map((checkpoint) => {
    const row = rowById.get(checkpoint.id);
    return {
      id: checkpoint.id,
      title: checkpoint.title,
      status: row ? row.status : STATUS_LABELS.not_started,
      notes: row ? row.notes : "",
      tasks: checkpoint.tasks
    };
  });

  if (!entries.length) {
    entries = progressRows.map((row) => {
      const id = parseCheckpointId(row.checkpoint);
      const label = id
        ? `Checkpoint ${id} - ${normalizeText(row.checkpoint.replace(/^(\d+(?:\.\d+)+)\s*/, ""))}`
        : row.checkpoint;
      return {
        id: id || row.checkpoint,
        title: label,
        status: row.status,
        notes: row.notes,
        tasks: []
      };
    });
  }

  const doneEntries = entries.filter((entry) => entry.status === STATUS_LABELS.done);

  const explicitCurrentId = parseCheckpointId(explicitCurrentCheckpoint);
  const inProgressEntries = entries.filter((entry) => entry.status === STATUS_LABELS.in_progress);
  const explicitCurrentEntry = explicitCurrentId
    ? entries.find((entry) => entry.id === explicitCurrentId) || null
    : null;

  let currentEntry = null;
  if (inProgressEntries.length === 1) {
    currentEntry = inProgressEntries[0];
  } else if (inProgressEntries.length > 1) {
    currentEntry = inProgressEntries.find((entry) => entry.id === explicitCurrentId) || inProgressEntries[0];
  } else {
    currentEntry =
      explicitCurrentEntry ||
      entries.find((entry) => entry.status === STATUS_LABELS.blocked) ||
      entries.find((entry) => entry.status !== STATUS_LABELS.done) ||
      null;
  }

  if (currentEntry && currentEntry.status === STATUS_LABELS.done) {
    currentEntry = null;
  }

  const currentIndex = currentEntry ? entries.findIndex((entry) => entry.id === currentEntry.id) : -1;
  const doneItems = doneEntries.slice(-6).map((entry) => `${entry.title} is done.`);
  const currentTasks = currentEntry ? currentEntry.tasks.slice(0, 6) : [];
  const nextSteps = buildNextSteps(entries, currentIndex);
  const fallbackWarning = progressRows.length
    ? null
    : `Progress table not found in ${sourcePath}. Add the section 8 status table to drive this tracker.`;

  return {
    sourcePath,
    lastUpdatedLabel: formatDateLabel(options.lastUpdated || explicitLastUpdated),
    doneItems,
    current: currentEntry
      ? {
          title: currentEntry.title,
          status: currentEntry.status,
          tasks: currentTasks,
          notes: currentEntry.notes
        }
      : null,
    nextSteps,
    warning: fallbackWarning
  };
}

export function loadBuildTrackerFromPlaybook(playbookPath = DEFAULT_PLAYBOOK_PATH) {
  const normalizedSource = path.relative(process.cwd(), playbookPath).replace(/\\/g, "/") || "docs/build-playbook.md";

  try {
    const markdown = readFileSync(playbookPath, "utf8");
    const stats = statSync(playbookPath);
    return parseBuildTrackerFromMarkdown(markdown, {
      sourcePath: normalizedSource,
      lastUpdated: stats.mtime
    });
  } catch (error) {
    return {
      sourcePath: normalizedSource,
      lastUpdatedLabel: "Not set",
      doneItems: [],
      current: null,
      nextSteps: [],
      warning: `Unable to load ${normalizedSource}: ${error.message}`
    };
  }
}
