import { loadConfig } from '../lib/load-config'
import { listStoredApiKeys } from '../lib/secrets'

export async function listModelsController() {
  const [config, storedKeys] = await Promise.all([
    loadConfig(),
    listStoredApiKeys(),
  ])

  const providers = Array.from(
    new Set([
      ...storedKeys.map((key) => key.provider),
      ...(config.model ? [config.model.provider] : []),
    ])
  ).sort((left, right) => left.localeCompare(right))

  if (!config.model && providers.length === 0) {
    console.log('No configured model or stored API keys found.')
    return
  }

  if (config.model) {
    const configuredProvider = config.model.provider
    const configuredModelName = config.model.name

    const configuredStoredKey = storedKeys.find(
      (entry) => entry.provider === configuredProvider
    )?.apiKey

    const configuredMaskedKey = !configuredStoredKey
      ? '(not set)'
      : configuredStoredKey.length <= 8
        ? `${configuredStoredKey.slice(0, 2)}***`
        : `${configuredStoredKey.slice(0, 4)}***${configuredStoredKey.slice(-4)}`

    console.log(
      `${configuredProvider}\n  key: ${configuredMaskedKey}\n  model: ${configuredModelName}\n`
    )
  }

  for (const provider of providers) {
    if (provider === config.model?.provider) {
      continue
    }

    const storedKey = storedKeys.find(
      (entry) => entry.provider === provider
    )?.apiKey

    const maskedKey = !storedKey
      ? '(not set)'
      : storedKey.length <= 8
        ? `${storedKey.slice(0, 2)}***`
        : `${storedKey.slice(0, 4)}***${storedKey.slice(-4)}`

    console.log(`${provider}\n  key: ${maskedKey}\n  model: (not configured)\n`)
  }
}
