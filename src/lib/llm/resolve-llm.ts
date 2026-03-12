import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'
import z from 'zod'

function resolveAiProvider(provider: string, apiKey: string) {
  if (provider === 'openai') {
    return createOpenAI({ apiKey })
  }

  if (provider === 'anthropic') {
    return createAnthropic({ apiKey })
  }

  if (provider === 'google') {
    return createGoogleGenerativeAI({ apiKey })
  }

  if (provider === 'openrouter') {
    return createOpenAICompatible({
      name: 'OpenRouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    })
  }

  const isUrl = z.url().safeParse(provider).success
  if (isUrl) {
    return createOpenAICompatible({
      name: 'Custom OpenAI-Compatible',
      baseURL: provider,
      apiKey,
    })
  }
}

export function resolveLLM(input: {
  provider: string
  apiKey: string
  model: string
}): Extract<LanguageModel, { specificationVersion: 'v3' }> {
  const provider = resolveAiProvider(input.provider, input.apiKey)
  if (!provider) {
    throw new Error(
      `Unsupported model provider '${provider}'. Use openai, anthropic, google, openrouter, or an https base URL.`
    )
  }

  return provider(input.model)
}
