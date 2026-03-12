import { loadConfig } from '../../config/load'
import { setStoredApiKey } from '../keys'
import { promptForApiKey, promptForProviderSelection } from '../prompts'

export async function setModelKeyCommand(
  providerArgument?: string,
  apiKeyArgument?: string
) {
  const { config } = await loadConfig()
  const provider =
    providerArgument?.trim() ??
    (await promptForProviderSelection(
      Array.from(
        new Set([
          'anthropic',
          'google',
          'openai',
          'openrouter',
          ...Object.keys(config.models),
        ])
      )
    ))
  const apiKey = (apiKeyArgument ?? (await promptForApiKey(provider))).trim()

  await setStoredApiKey(provider, apiKey)

  process.stdout.write(`Stored API key for ${provider}.\n`)
}
