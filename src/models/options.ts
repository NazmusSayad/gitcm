import { z } from 'zod'
import { modelEntrySchema, resolvedConfigSchema } from '../schema'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export function getConfiguredModelOptions(
  config: z.infer<typeof resolvedConfigSchema>
) {
  return Object.entries(config.models).flatMap(([provider, entries]) =>
    entries.map((entry) => createModelOption(provider, entry))
  )
}

export function getDefaultModelOption(
  modelOptions: ReturnType<typeof getConfiguredModelOptions>,
  defaultModel: z.infer<typeof resolvedConfigSchema>['defaultModel']
) {
  if (modelOptions.length === 0) {
    return undefined
  }

  if (!defaultModel) {
    return modelOptions[0]
  }

  const byId = modelOptions.find((option) => option.id === defaultModel)

  if (byId) {
    return byId
  }

  const byName = modelOptions.filter((option) => option.name === defaultModel)

  if (byName.length === 1) {
    return byName[0]
  }

  return modelOptions[0]
}

function createModelOption(
  provider: string,
  entry: z.infer<typeof modelEntrySchema>
) {
  const name = typeof entry === 'string' ? entry : entry.name
  const reasoning = typeof entry === 'string' ? undefined : entry.reasoning
  const id = `${provider}:${name}`

  if (provider === 'anthropic') {
    return {
      id,
      label: id,
      kind: 'anthropic' as const,
      provider,
      name,
      reasoning,
    }
  }

  if (provider === 'google') {
    return {
      id,
      label: id,
      kind: 'google' as const,
      provider,
      name,
      reasoning,
    }
  }

  if (provider === 'openai') {
    return {
      id,
      label: id,
      kind: 'openai' as const,
      provider,
      name,
      reasoning,
    }
  }

  if (provider === 'openrouter') {
    return {
      id,
      label: id,
      kind: 'openai-compatible' as const,
      provider,
      name,
      baseUrl: OPENROUTER_BASE_URL,
      reasoning,
    }
  }

  if (isHttpsUrl(provider)) {
    return {
      id,
      label: id,
      kind: 'openai-compatible' as const,
      provider,
      name,
      baseUrl: provider,
      reasoning,
    }
  }

  throw new Error(
    `Unsupported model provider '${provider}'. Use openai, anthropic, google, openrouter, or an https base URL.`
  )
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'https:'
  } catch {
    return false
  }
}
