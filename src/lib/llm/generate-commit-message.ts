import type { OpenAICompatibleProviderOptions } from '@ai-sdk/openai-compatible'
import { generateText, stepCountIs } from 'ai'
import { SUPPORTED_PROVIDERS, type ResolvedConfig } from '../../schema'
import { buildCommitMessageContext } from './build-commit-message-context'
import { createCommitMessageTools } from './create-commit-message-tools'
import { resolveAiProvider } from './resolve-provider'
import systemPrompt from './system-prompt.txt?raw'

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
  const provider = resolveAiProvider(model.provider, model.key)
  if (!provider) {
    throw new Error(
      `Unsupported model provider '${provider}'. Use ${SUPPORTED_PROVIDERS.join(', ')} or an https base URL.`
    )
  }

  const stagedContext = await buildCommitMessageContext(cwd)

  const result = await generateText({
    model: provider(model.name),
    stopWhen: stepCountIs(6),

    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Generate a concise git commit message for the currently staged changes.\n\n${stagedContext}\n\nAdditional instructions:\n${
          config.instructions ||
          'Generate a concise git commit message based on the staged changes.'
        }\n\nUse the available tools when you need more detail about specific files, diffs, GitHub issues, or linked documentation.`,
      },
    ],

    tools: createCommitMessageTools(cwd),

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
