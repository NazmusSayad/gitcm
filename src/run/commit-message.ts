import type { generateCommitMessage as generateCommitMessageFunction } from '../models/generate'
import type { getConfiguredModelOptions } from '../models/options'
import {
  promptForCommitMessageInput,
  promptForGeneratedCommitAction,
} from './prompts'

type ModelOption = ReturnType<typeof getConfiguredModelOptions>[number]

export async function resolveCommitMessage(options: {
  autoAcceptCommitMessage: boolean
  customInstructions?: string
  defaultModel?: ModelOption
  modelOptions: ModelOption[]
  stagedDiff: string
  generateCommitMessage: typeof generateCommitMessageFunction
}) {
  const entry = await promptForCommitMessageInput(
    options.modelOptions,
    options.defaultModel
  )

  if (entry.message.length > 0) {
    return entry.message
  }

  const activeModel =
    entry.activeModel ?? options.defaultModel ?? options.modelOptions[0]

  if (!activeModel) {
    throw new Error('No models are configured for commit message generation.')
  }

  const sections = [
    'Write a concise git commit message for the staged changes.',
    'Focus on why the changes were made, not a file-by-file summary.',
    'Return only the commit message text with no quotes or code fences.',
  ]

  if (options.customInstructions) {
    sections.push(`Project instructions:\n${options.customInstructions}`)
  }

  sections.push(`Staged diff:\n${options.stagedDiff}`)

  while (true) {
    const generatedMessage = (
      await options.generateCommitMessage({
        model: activeModel,
        prompt: sections.join('\n\n'),
      })
    ).trim()

    if (generatedMessage.length === 0) {
      throw new Error('The selected model returned an empty commit message.')
    }

    if (options.autoAcceptCommitMessage) {
      return generatedMessage
    }

    const action = await promptForGeneratedCommitAction(generatedMessage)

    if (action === 'accept') {
      return generatedMessage
    }

    if (action === 'cancel') {
      return undefined
    }
  }
}
