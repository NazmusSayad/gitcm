import { execa } from 'execa'
import type { ResolvedConfig } from '../schema'

export async function ensureInsideGitRepo(cwd = process.cwd()) {
  const result = await execa('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd,
    reject: false,
  })

  if (result.exitCode !== 0 || result.stdout.trim() !== 'true') {
    throw new Error('gityo must be run inside a git repository.')
  }
}

export async function getRepositoryRoot(cwd = process.cwd()) {
  const result = await execa('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    reject: false,
  })

  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr.trim() || 'Failed to resolve git repository root.'
    )
  }

  return result.stdout.trim()
}

export async function getCurrentBranch(cwd = process.cwd()) {
  const result = await execa(
    'git',
    ['symbolic-ref', '--quiet', '--short', 'HEAD'],
    {
      cwd,
      reject: false,
    }
  )

  if (result.exitCode === 0) {
    return result.stdout.trim()
  }

  if (result.exitCode === 1) {
    return '(detached HEAD)'
  }

  throw new Error(result.stderr.trim() || 'Git command failed.')
}

export async function getChangedFiles(cwd = process.cwd()) {
  const [unstagedResult, stagedResult, untrackedResult] = await Promise.all([
    runGit(['diff', '--name-only', '--diff-filter=ACDMRTUXB', '-z'], cwd),
    runGit(
      ['diff', '--cached', '--name-only', '--diff-filter=ACDMRTUXB', '-z'],
      cwd
    ),
    runGit(['ls-files', '--others', '--exclude-standard', '-z'], cwd),
  ])

  return Array.from(
    new Set([
      ...unstagedResult.stdout.split('\0').filter(Boolean),
      ...stagedResult.stdout.split('\0').filter(Boolean),
      ...untrackedResult.stdout.split('\0').filter(Boolean),
    ])
  ).sort((left, right) => left.localeCompare(right))
}

export async function stageFiles(files: string[], cwd = process.cwd()) {
  if (files.length === 0) {
    return
  }

  await runGit(['add', '--', ...files], cwd)
}

export async function getStagedDiff(
  cwd = process.cwd(),
  options: {
    files?: string[]
    unified?: number
  } = {}
) {
  const args = ['diff', '--cached', '--no-ext-diff', '--no-color']

  if (typeof options.unified === 'number') {
    args.push(`--unified=${Math.max(0, options.unified)}`)
  }

  if (options.files && options.files.length > 0) {
    args.push('--', ...options.files)
  }

  return (await runGit(args, cwd)).stdout
}

export async function getStagedNameStatus(cwd = process.cwd()) {
  return (
    await runGit(
      ['diff', '--cached', '--name-status', '--find-renames', '--no-ext-diff'],
      cwd
    )
  ).stdout
}

export async function getStagedDiffStat(cwd = process.cwd()) {
  return (
    await runGit(
      [
        'diff',
        '--cached',
        '--stat',
        '--summary',
        '--find-renames',
        '--no-ext-diff',
      ],
      cwd
    )
  ).stdout
}

export async function commitChanges(message: string, cwd = process.cwd()) {
  await execa('git', ['commit', '-m', message], {
    cwd,
    stdio: 'inherit',
  })
}

export async function runPostCommand(
  postCommand: ResolvedConfig['postCommand'],
  cwd = process.cwd(),
  options: {
    pullRequestBaseBranch?: string
  } = {}
) {
  await pushCurrentBranch(cwd)

  if (postCommand === 'push-and-pull') {
    await execa('git', ['pull', '--rebase'], {
      cwd,
      stdio: 'inherit',
    })

    return
  }

  if (postCommand === 'push-and-pr') {
    const baseBranch = options.pullRequestBaseBranch?.trim()

    if (!baseBranch) {
      throw new Error(
        'A pull request base branch is required. Use --pr <branch> or set pullRequestBaseBranch in config.'
      )
    }

    await createPullRequest(baseBranch, cwd)
  }
}

export async function pushCurrentBranch(cwd = process.cwd()) {
  const hasUpstream = await currentBranchHasUpstream(cwd)

  if (hasUpstream) {
    await execa('git', ['push'], {
      cwd,
      stdio: 'inherit',
    })

    return
  }

  const remote = await getDefaultRemote(cwd)
  if (!remote) {
    throw new Error('No git remote found to push the current branch.')
  }

  await execa('git', ['push', '--set-upstream', remote, 'HEAD'], {
    cwd,
    stdio: 'inherit',
  })
}

export async function createPullRequest(
  baseBranch: string,
  cwd = process.cwd()
) {
  await execa('gh', ['pr', 'create', '--base', baseBranch, '--fill'], {
    cwd,
    stdio: 'inherit',
  })
}

async function currentBranchHasUpstream(cwd: string) {
  const result = await execa(
    'git',
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
    {
      cwd,
      reject: false,
    }
  )

  return result.exitCode === 0
}

async function getDefaultRemote(cwd: string) {
  const configuredRemote = await getConfiguredBranchRemote(cwd)
  if (configuredRemote) {
    return configuredRemote
  }

  const remotes = (await runGit(['remote'], cwd)).stdout
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)

  if (remotes.includes('origin')) {
    return 'origin'
  }

  return remotes[0]
}

async function getConfiguredBranchRemote(cwd: string) {
  const branch = await getCurrentBranch(cwd)
  if (branch === '(detached HEAD)') {
    return undefined
  }

  const result = await execa(
    'git',
    ['config', '--get', `branch.${branch}.remote`],
    {
      cwd,
      reject: false,
    }
  )

  return result.exitCode === 0 ? result.stdout.trim() || undefined : undefined
}

async function runGit(args: string[], cwd: string) {
  const result = await execa('git', args, {
    cwd,
    reject: false,
  })

  if (result.exitCode !== 0) {
    throw new Error(result.stderr.trim() || 'Git command failed.')
  }

  return result
}
