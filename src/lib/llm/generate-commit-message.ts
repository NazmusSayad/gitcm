import type { OpenAICompatibleProviderOptions } from '@ai-sdk/openai-compatible'
import { generateText } from 'ai'
import type { ResolvedConfig } from '../../schema'
import { getStagedDiff } from '../git'
import { resolveLLM } from './resolve-llm'

export async function generateCommitMessage(
  cwd: string,
  config: ResolvedConfig,
  model: {
    provider: string
    name: string
    key: string

    reasoning?: boolean | string
  }
) {
  const stagedDiff = await getStagedDiff(cwd)
  const sections = [
    'Write a concise git commit message for the staged changes.',
    'Focus on why the changes were made, not a file-by-file summary.',
    'Return only the commit message text with no quotes or code fences.',
  ]

  if (config.customInstructions) {
    sections.push(`Project instructions:\n${config.customInstructions}`)
  }

  sections.push(`Staged diff:\n${stagedDiff}`)
  const prompt = sections.join('\n\n')

  const result = await generateText({
    model: resolveLLM({
      provider: model.provider,
      model: model.name,
      apiKey: model.key,
    }),

    prompt,

    providerOptions: {
      openai: {
        reasoningEffort:
          model.reasoning === true ? 'medium' : model.reasoning || undefined,
      } satisfies OpenAICompatibleProviderOptions,
    },
  })

  return {
    text: result.text.trim(),
  }
}
