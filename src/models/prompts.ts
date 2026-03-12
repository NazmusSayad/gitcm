import { input, password, select } from '@inquirer/prompts'

export async function promptForProviderSelection(providers: string[]) {
  const customProviderValue = '__custom__'
  const selected = await select({
    message: 'Choose a provider or custom base URL',
    choices: [
      ...providers.map((provider) => ({
        name: provider,
        value: provider,
      })),
      {
        name: 'Custom base URL',
        value: customProviderValue,
      },
    ],
  })

  if (selected !== customProviderValue) {
    return selected
  }

  const baseUrl = await input({
    message: 'Custom base URL',
    validate: (value) => {
      try {
        const url = new URL(value)

        return url.protocol === 'https:'
          ? true
          : 'Custom base URLs must use https.'
      } catch {
        return 'Enter a valid https URL.'
      }
    },
  })

  return baseUrl.trim()
}

export async function promptForApiKey(provider: string) {
  return password({
    message: `API key for ${provider}`,
    mask: '*',
    validate: (value) =>
      value.trim().length > 0 ? true : 'API key cannot be empty.',
  })
}
