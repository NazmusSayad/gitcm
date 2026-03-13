import { loadConfig } from '../lib/load-config'
import { getStoredApiKey } from '../lib/secrets'

export async function showConfigController() {
  const config = await loadConfig(process.cwd())
  const storedApiKey = config.model
    ? await getStoredApiKey(config.model.provider)
    : undefined

  const output = {
    ...config,
    model: config.model
      ? {
          ...config.model,
          apiKey: maskApiKey(storedApiKey),
        }
      : undefined,
  }

  console.log(JSON.stringify(output, null, 2))
}

function maskApiKey(value: string | null | undefined) {
  if (!value) {
    return '(not set)'
  }

  if (value.length <= 8) {
    return `${value.slice(0, 2)}***`
  }

  return `${value.slice(0, 4)}***${value.slice(-4)}`
}
