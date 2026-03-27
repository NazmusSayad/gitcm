import {
  readGlobalConfig,
  readProjectConfig,
  writeGlobalConfig,
  writeProjectConfig,
} from '../lib/load-config'

export async function setConfigController(
  scope: 'local' | 'global',
  keyArgument?: string,
  valueArgument?: string
) {
  const key = keyArgument?.trim()
  const rawValue = valueArgument?.trim()
  const target = scope
  const normalizedKey = key === 'customInstructions' ? 'instructions' : key

  if (!key) {
    throw new Error('Usage: config set <key> <value>')
  }

  if (key === 'model') {
    throw new Error('Use: config set model [provider] [name] [apiKey]')
  }

  if (
    normalizedKey !== 'autoAcceptCommitMessage' &&
    normalizedKey !== 'autoRunPostCommand' &&
    normalizedKey !== 'postCommand' &&
    normalizedKey !== 'pullRequestBaseBranch' &&
    normalizedKey !== 'instructions'
  ) {
    throw new Error(
      `Unsupported key '${key}'. Use autoAcceptCommitMessage, autoRunPostCommand, postCommand, pullRequestBaseBranch, instructions, or model.`
    )
  }

  if (!rawValue) {
    throw new Error(
      `Missing value for '${key}'. Usage: config set ${key} <value>`
    )
  }

  const config =
    target === 'local'
      ? ((await readProjectConfig(process.cwd())) ?? {})
      : ((await readGlobalConfig()) ?? {})

  if (normalizedKey === 'autoAcceptCommitMessage') {
    config.autoAcceptMessage = parseBoolean(rawValue)
  }

  if (normalizedKey === 'autoRunPostCommand') {
    config.autoRunPostCommand = parseBoolean(rawValue)
  }

  if (normalizedKey === 'postCommand') {
    if (
      rawValue !== 'push' &&
      rawValue !== 'push-and-pull' &&
      rawValue !== 'push-and-pr'
    ) {
      throw new Error(
        "Invalid postCommand. Use 'push', 'push-and-pull', or 'push-and-pr'."
      )
    }

    config.postCommand = rawValue
  }

  if (normalizedKey === 'pullRequestBaseBranch') {
    if (rawValue.length === 0) {
      throw new Error('pullRequestBaseBranch cannot be empty.')
    }

    config.pullRequestBaseBranch = rawValue
  }

  if (normalizedKey === 'instructions') {
    if (rawValue.length === 0) {
      throw new Error('instructions cannot be empty.')
    }

    config.instructions = rawValue
  }

  if (target === 'local') {
    await writeProjectConfig(process.cwd(), config)
  } else {
    await writeGlobalConfig(config)
  }

  console.log(`Updated ${normalizedKey} in ${target} config.`)
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase()

  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }

  throw new Error(`Invalid boolean value '${value}'. Use true or false.`)
}
