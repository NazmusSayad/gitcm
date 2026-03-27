import { tool } from 'ai'
import { execa } from 'execa'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { getStagedDiff } from '../git'

const MAX_FILE_CONTENT_CHARS = 12000
const MAX_DIRECTORY_ENTRIES = 200
const MAX_FETCH_CONTENT_CHARS = 12000
const MAX_DIFF_CONTENT_CHARS = 12000
const MAX_COMMAND_OUTPUT_CHARS = 12000

export function createCommitMessageTools(repoRoot: string) {
  return {
    read_files: tool({
      description: 'Read one or more UTF-8 files from the repository.',
      inputSchema: z.object({
        paths: z.array(z.string().min(1)).min(1).max(5),
      }),
      execute: async ({ paths }) => ({
        files: await Promise.all(
          paths.map((currentPath) => readRepoFile(repoRoot, currentPath))
        ),
      }),
    }),

    read_directories: tool({
      description: 'List files and folders in repository directories.',
      inputSchema: z.object({
        paths: z.array(z.string().min(1)).min(1).max(5),
      }),
      execute: async ({ paths }) => ({
        directories: await Promise.all(
          paths.map((currentPath) => readRepoDirectory(repoRoot, currentPath))
        ),
      }),
    }),

    read_staged_diffs: tool({
      description: 'Read staged git diffs for specific repository files.',
      inputSchema: z.object({
        paths: z.array(z.string().min(1)).min(1).max(5),
      }),
      execute: async ({ paths }) => ({
        diffs: await Promise.all(
          paths.map((currentPath) => readRepoDiff(repoRoot, currentPath))
        ),
      }),
    }),

    fetch: tool({
      description: 'Fetch a public HTTPS URL as text.',
      inputSchema: z.object({
        url: z.url(),
      }),
      execute: async ({ url }) => fetchUrl(url),
    }),

    gh: tool({
      description:
        'Run a read-only gh command for issues, pull requests, or repository metadata.',
      inputSchema: z.object({
        args: z.array(z.string().min(1)).min(1).max(12),
      }),
      execute: async ({ args }) => runGhCommand(repoRoot, args),
    }),
  }
}

async function readRepoFile(repoRoot: string, userPath: string) {
  try {
    const absolutePath = resolveRepoPath(repoRoot, userPath)
    const fileStat = await stat(absolutePath)

    if (!fileStat.isFile()) {
      return {
        path: normalizeRepoPath(repoRoot, absolutePath),
        error: 'Path is not a file.',
      }
    }

    const content = await readFile(absolutePath, 'utf8')

    return {
      path: normalizeRepoPath(repoRoot, absolutePath),
      content: truncateText(content, MAX_FILE_CONTENT_CHARS),
    }
  } catch (error) {
    return {
      path: userPath,
      error: toErrorMessage(error),
    }
  }
}

async function readRepoDirectory(repoRoot: string, userPath: string) {
  try {
    const absolutePath = resolveRepoPath(repoRoot, userPath)
    const directoryStat = await stat(absolutePath)

    if (!directoryStat.isDirectory()) {
      return {
        path: normalizeRepoPath(repoRoot, absolutePath),
        error: 'Path is not a directory.',
      }
    }

    const entries = await readdir(absolutePath, { withFileTypes: true })

    return {
      path: normalizeRepoPath(repoRoot, absolutePath),
      entries: entries
        .slice(0, MAX_DIRECTORY_ENTRIES)
        .map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`),
      truncated: entries.length > MAX_DIRECTORY_ENTRIES,
    }
  } catch (error) {
    return {
      path: userPath,
      error: toErrorMessage(error),
    }
  }
}

async function readRepoDiff(repoRoot: string, userPath: string) {
  try {
    const absolutePath = resolveRepoPath(repoRoot, userPath)
    const relativePath = normalizeRepoPath(repoRoot, absolutePath)
    const diff = await getStagedDiff(repoRoot, {
      unified: 0,
      files: [relativePath],
    })

    return {
      path: relativePath,
      diff: truncateText(
        diff.trim() || '(no staged diff)',
        MAX_DIFF_CONTENT_CHARS
      ),
    }
  } catch (error) {
    return {
      path: userPath,
      error: toErrorMessage(error),
    }
  }
}

async function fetchUrl(url: string) {
  const targetUrl = new URL(url)
  if (targetUrl.protocol !== 'https:') {
    return {
      url,
      error: 'Only HTTPS URLs are supported.',
    }
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'user-agent': 'gityo',
      },
      signal: AbortSignal.timeout(10000),
    })

    const text = await response.text()

    return {
      url,
      status: response.status,
      content: truncateText(text, MAX_FETCH_CONTENT_CHARS),
    }
  } catch (error) {
    return {
      url,
      error: toErrorMessage(error),
    }
  }
}

async function runGhCommand(repoRoot: string, args: string[]) {
  if (!isReadOnlyGhCommand(args)) {
    return {
      command: `gh ${args.join(' ')}`,
      error:
        'Only read-only gh commands are supported: issue view/list, pr view/list, repo view, and api GET.',
    }
  }

  const result = await execa('gh', args, {
    cwd: repoRoot,
    reject: false,
  })

  return {
    command: `gh ${args.join(' ')}`,
    ok: result.exitCode === 0,
    output: truncateText(
      result.stdout || result.stderr || '(no output)',
      MAX_COMMAND_OUTPUT_CHARS
    ),
  }
}

function isReadOnlyGhCommand(args: string[]) {
  const [command, subcommand] = args

  if (command === 'issue' || command === 'pr') {
    return subcommand === 'view' || subcommand === 'list'
  }

  if (command === 'repo') {
    return subcommand === 'view'
  }

  if (command !== 'api') {
    return false
  }

  for (let index = 1; index < args.length; index += 1) {
    const value = args[index]

    if (value === '-X') {
      return args[index + 1]?.toUpperCase() === 'GET'
    }

    if (
      value === '--method' ||
      value === '--input' ||
      value === '--field' ||
      value === '-f' ||
      value === '--raw-field' ||
      value === '-F'
    ) {
      return false
    }
  }

  return true
}

function resolveRepoPath(repoRoot: string, userPath: string) {
  const absolutePath = path.resolve(repoRoot, userPath)
  const relativePath = path.relative(repoRoot, absolutePath)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Path must stay inside the repository root.')
  }

  return absolutePath
}

function normalizeRepoPath(repoRoot: string, absolutePath: string) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/') || '.'
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 21))}\n[output truncated...]`
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error'
}
