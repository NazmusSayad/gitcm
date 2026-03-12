import { NoArg } from 'noarg'
import { listModelsCommand } from './models/commands/list'
import { setModelKeyCommand } from './models/commands/set'
import { runCommand } from './run/command'

export const app = NoArg.create('gityo', {
  description:
    'Stage changes, generate or enter a commit message, create a commit, and run a post-commit git command.',
}).on(async () => {
  try {
    await runCommand()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    process.stderr.write(
      `${message === 'Prompt cancelled.' ? 'Cancelled.' : message}\n`
    )

    if (message !== 'Prompt cancelled.') {
      process.exitCode = 1
    }
  }
})

const modelsProgram = app.create('models', {
  description: 'Manage configured models and stored API keys.',
  config: { skipGlobalFlags: true },
})

modelsProgram
  .create('set', {
    description:
      'Set or update a stored API key for a provider or custom base URL.',
    arguments: [{ name: 'provider', type: NoArg.string() }],
    optionalArguments: [{ name: 'api-key', type: NoArg.string() }],
  })
  .on(async ([provider, apiKey]) => {
    try {
      await setModelKeyCommand(provider, apiKey)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      process.stderr.write(
        `${message === 'Prompt cancelled.' ? 'Cancelled.' : message}\n`
      )

      if (message !== 'Prompt cancelled.') {
        process.exitCode = 1
      }
    }
  })

modelsProgram
  .create('list', {
    description: 'List configured model groups and any stored API keys.',
  })
  .on(async () => {
    try {
      await listModelsCommand()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      process.stderr.write(
        `${message === 'Prompt cancelled.' ? 'Cancelled.' : message}\n`
      )

      if (message !== 'Prompt cancelled.') {
        process.exitCode = 1
      }
    }
  })
