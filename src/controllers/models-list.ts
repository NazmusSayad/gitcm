import { loadConfig } from '../lib/load-config'
import { listStoredApiKeys } from '../lib/secrets'

export async function listModelsController() {
  const [config, storedKeys] = await Promise.all([
    loadConfig(),
    listStoredApiKeys(),
  ])

  const providers = Array.from(
    new Set([
      ...Object.keys(config.models),
      ...storedKeys.map((key) => key.provider),
    ])
  ).sort((left, right) => left.localeCompare(right))

  if (providers.length === 0) {
    console.log('No configured model groups or stored API keys found.')
    return
  }

  for (const provider of providers) {
    const models = config.models[provider] ?? []

    const storedKey = storedKeys.find(
      (entry) => entry.provider === provider
    )?.apiKey

    const maskedKey = !storedKey
      ? '(not set)'
      : storedKey.length <= 8
        ? `${storedKey.slice(0, 2)}***`
        : `${storedKey.slice(0, 4)}***${storedKey.slice(-4)}`

    const modelNames = models.map((entry) =>
      typeof entry === 'string' ? entry : entry.name
    )

    console.log(
      `${provider}\n  key: ${maskedKey}\n  models: ${modelNames.length > 0 ? modelNames.join(', ') : '(none configured)'}\n`
    )
  }
}
