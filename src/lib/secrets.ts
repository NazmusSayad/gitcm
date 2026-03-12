const SERVICE_NAME = 'gityo'

export async function getStoredApiKey(provider: string) {
  const keytar = await import('keytar')
  return keytar.getPassword(SERVICE_NAME, provider)
}

export async function setStoredApiKey(provider: string, apiKey: string) {
  const keytar = await import('keytar')
  await keytar.setPassword(SERVICE_NAME, provider, apiKey)
}

export async function listStoredApiKeys() {
  const keytar = await import('keytar')
  const credentials = await keytar.findCredentials(SERVICE_NAME)

  return credentials.map((credential) => ({
    provider: credential.account,
    apiKey: credential.password,
  }))
}
