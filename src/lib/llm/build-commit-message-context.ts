import { getStagedDiff, getStagedDiffStat, getStagedNameStatus } from '../git'

const MAX_COMPACT_DIFF_CHARS = 24000
const MAX_CHANGED_LINES_PER_HUNK = 8
const MAX_HUNKS_PER_FILE = 8

export async function buildCommitMessageContext(cwd: string) {
  const [nameStatus, diffStat, compactDiff] = await Promise.all([
    getStagedNameStatus(cwd),
    getStagedDiffStat(cwd),
    getCompactStagedDiff(cwd),
  ])

  return [
    'Staged file changes:',
    nameStatus.trim() || '(none)',
    '',
    'Diff summary:',
    diffStat.trim() || '(none)',
    '',
    'Compact staged diff:',
    compactDiff,
  ].join('\n')
}

async function getCompactStagedDiff(cwd: string) {
  const diff = (await getStagedDiff(cwd, { unified: 0 })).trim()

  if (diff.length === 0) {
    return '(empty staged diff)'
  }

  if (diff.length <= MAX_COMPACT_DIFF_CHARS) {
    return diff
  }

  const sections = splitDiffSections(diff)
  const compactSections: string[] = []
  let totalLength = 0

  for (const section of sections) {
    const compactSection = compactDiffSection(section)
    if (!compactSection) {
      continue
    }

    if (totalLength + compactSection.length > MAX_COMPACT_DIFF_CHARS) {
      break
    }

    compactSections.push(compactSection)
    totalLength += compactSection.length + 2
  }

  if (compactSections.length === 0) {
    return truncateText(diff, MAX_COMPACT_DIFF_CHARS)
  }

  return `${compactSections.join('\n\n')}\n\n[diff truncated; use tools for more context]`
}

function splitDiffSections(diff: string) {
  return diff
    .split('\ndiff --git ')
    .map((section, index) => (index === 0 ? section : `diff --git ${section}`))
}

function compactDiffSection(section: string) {
  const lines = section.split('\n')
  const header: string[] = []
  const hunks: string[][] = []
  let currentHunk: string[] | null = null

  for (const line of lines) {
    if (line.startsWith('@@')) {
      currentHunk = [line]
      hunks.push(currentHunk)
      continue
    }

    if (!currentHunk) {
      header.push(line)
      continue
    }

    if (
      (line.startsWith('+') || line.startsWith('-')) &&
      !line.startsWith('+++') &&
      !line.startsWith('---')
    ) {
      currentHunk.push(line)
    }
  }

  const output = [...header]

  for (const hunk of hunks.slice(0, MAX_HUNKS_PER_FILE)) {
    output.push(hunk[0])
    output.push(...hunk.slice(1, 1 + MAX_CHANGED_LINES_PER_HUNK))

    const omittedLineCount = hunk.length - 1 - MAX_CHANGED_LINES_PER_HUNK
    if (omittedLineCount > 0) {
      output.push(`[...${omittedLineCount} more changed lines omitted]`)
    }
  }

  const omittedHunkCount = hunks.length - MAX_HUNKS_PER_FILE
  if (omittedHunkCount > 0) {
    output.push(`[...${omittedHunkCount} more hunks omitted]`)
  }

  return output.join('\n').trim()
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 21))}\n[output truncated...]`
}
