import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { generateText } from 'ai'
import { getStoredApiKey, setStoredApiKey } from './keys'
import type { getConfiguredModelOptions } from './options'
import { promptForApiKey } from './prompts'

type ModelOption = ReturnType<typeof getConfiguredModelOptions>[number]

export async function generateCommitMessage(options: {
  model: ModelOption
  prompt: string
}) {
  let apiKey = await getStoredApiKey(options.model.provider)

  if (!apiKey) {
    apiKey = (await promptForApiKey(options.model.provider)).trim()
    await setStoredApiKey(options.model.provider, apiKey)
  }

  const provider = createProvider(options.model, apiKey)
  const providerOptions = getReasoningOptions(options.model)
  const result = await generateText({
    model: provider(options.model.name),
    prompt: options.prompt,
    ...(providerOptions
      ? { providerOptions: { [options.model.provider]: providerOptions } }
      : {}),
  })

  return result.text
}

function createProvider(model: ModelOption, apiKey: string) {
  if (model.kind === 'anthropic') {
    return createAnthropic({ apiKey })
  }

  if (model.kind === 'google') {
    return createGoogleGenerativeAI({ apiKey })
  }

  if (model.kind === 'openai') {
    return createOpenAI({ apiKey })
  }

  return createOpenAICompatible({
    apiKey,
    baseURL: model.baseUrl,
    name: model.provider,
  })
}

function getReasoningOptions(model: ModelOption) {
  const { reasoning } = model

  if (reasoning === undefined || reasoning === false) {
    return undefined
  }

  if (model.kind === 'anthropic') {
    if (reasoning === 'disabled') {
      return {
        thinking: { type: 'disabled' as const },
      }
    }

    if (reasoning === 'enabled') {
      return {
        thinking: { type: 'enabled' as const },
      }
    }

    return {
      thinking: { type: 'adaptive' as const },
    }
  }

  if (model.kind === 'google') {
    return {
      thinkingConfig: {
        thinkingLevel: reasoning === true ? 'medium' : reasoning,
      },
    }
  }

  return {
    reasoningEffort: reasoning === true ? 'medium' : reasoning,
  }
}
