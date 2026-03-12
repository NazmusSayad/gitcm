import { checkbox, confirm, input } from '@inquirer/prompts'
import chalk from 'chalk'
import readline from 'node:readline'
import type { getRepositoryState } from '../git/repo'
import { AppUserCanceledError } from '../lib/errors'
import type { getConfiguredModelOptions } from '../models/options'

type RepositoryState = Awaited<ReturnType<typeof getRepositoryState>>
type ModelOption = ReturnType<typeof getConfiguredModelOptions>[number]

export async function promptForFilesToStage(repositoryState: RepositoryState) {
  process.stdout.write(`${chalk.bold('branch:')} ${repositoryState.branch}\n\n`)

  return checkbox({
    message: 'changes (press enter with no selection to stage all):',
    choices: repositoryState.files.map((file) => ({
      name: file,
      value: file,
    })),
    pageSize: 12,
  })
}

export async function promptForCommitMessageInput(
  modelOptions: ReturnType<typeof getConfiguredModelOptions>,
  defaultModel?: ModelOption
) {
  const initialIndex = defaultModel
    ? Math.max(
        modelOptions.findIndex((model) => model.id === defaultModel.id),
        0
      )
    : 0

  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    const message = await input({
      message: `Commit message (enter = use typed message, empty = generate${modelOptions[initialIndex] ? ` | model: ${modelOptions[initialIndex].label}` : ''})`,
    })

    return {
      message: message.trim(),
      activeModel: modelOptions[initialIndex],
    }
  }

  return new Promise<{ message: string; activeModel?: ModelOption }>(
    (resolve, reject) => {
      const stdin = process.stdin
      let currentValue = ''
      let activeIndex = initialIndex

      readline.emitKeypressEvents(stdin)
      stdin.setRawMode(true)
      stdin.resume()

      function render() {
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        process.stdout.write(
          `Commit message (enter = use typed message, empty = generate${modelOptions[activeIndex] ? ` | model: ${modelOptions[activeIndex].label}` : ''}) ${currentValue}`
        )
      }

      function cleanup() {
        stdin.off('keypress', onKeypress)
        stdin.setRawMode(false)
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        process.stdout.write('\n')
      }

      function onKeypress(chunk: string, key: readline.Key) {
        if (key.ctrl && key.name === 'c') {
          cleanup()
          reject(new AppUserCanceledError())
          return
        }

        if (key.name === 'return' || key.name === 'enter') {
          cleanup()
          resolve({
            message: currentValue.trim(),
            activeModel: modelOptions[activeIndex],
          })
          return
        }

        if (key.name === 'backspace') {
          currentValue = currentValue.slice(0, -1)
          render()
          return
        }

        if (key.name === 'tab' && modelOptions.length > 0) {
          activeIndex = (activeIndex + 1) % modelOptions.length
          render()
          return
        }

        if (
          chunk.length > 0 &&
          !key.ctrl &&
          !key.meta &&
          key.name !== 'escape' &&
          key.name !== 'tab'
        ) {
          currentValue += chunk
          render()
        }
      }

      render()
      stdin.on('keypress', onKeypress)
    }
  )
}

export async function promptForGeneratedCommitAction(message: string) {
  process.stdout.write(`\n${chalk.bold('generated:')} ${message}\n`)

  function mapResponse(value: string) {
    const normalized = value.trim().toLowerCase()

    if (normalized === '' || normalized === 'enter' || normalized === 'y') {
      return 'accept' as const
    }

    if (normalized === 'n') {
      return 'cancel' as const
    }

    if (normalized === 'r') {
      return 'regenerate' as const
    }

    return undefined
  }

  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    return mapResponse(
      await input({
        message: 'Accept generated commit message? [Y/n/r]',
      })
    )
  }

  return new Promise<'accept' | 'cancel' | 'regenerate'>((resolve, reject) => {
    const stdin = process.stdin

    readline.emitKeypressEvents(stdin)
    stdin.setRawMode(true)
    stdin.resume()
    process.stdout.write(
      'Press enter or y to accept, n to cancel, r to regenerate.\n'
    )

    function cleanup() {
      stdin.off('keypress', onKeypress)
      stdin.setRawMode(false)
    }

    function onKeypress(chunk: string, key: readline.Key) {
      if (key.ctrl && key.name === 'c') {
        cleanup()
        reject(new AppUserCanceledError())
        return
      }

      const action = mapResponse(key.name ?? chunk)

      if (!action) {
        return
      }

      cleanup()
      resolve(action)
    }

    stdin.on('keypress', onKeypress)
  })
}

export async function promptForPostCommand(commandLabel: string) {
  return confirm({
    message: `Run post command: ${commandLabel}?`,
    default: true,
  })
}
