import { readFile } from 'node:fs/promises'
import { configFileSchema, resolvedConfigSchema } from '../schema'
import { getConfigPaths } from './paths'

export async function loadConfig(cwd = process.cwd()) {
  const paths = getConfigPaths(cwd)

  const [globalConfig, projectConfig, projectInstructions] = await Promise.all([
    readConfigFile(paths.globalConfigPath),
    readConfigFile(paths.projectConfigPath),
    readInstructionsFile(paths.projectInstructionsPath),
  ])

  return {
    config: resolvedConfigSchema.parse({
      models: {
        ...(globalConfig?.models ?? {}),
        ...(projectConfig?.models ?? {}),
      },
      defaultModel: projectConfig?.defaultModel ?? globalConfig?.defaultModel,
      autoAcceptCommitMessage:
        projectConfig?.autoAcceptCommitMessage ??
        globalConfig?.autoAcceptCommitMessage,
      postCommand: projectConfig?.postCommand ?? globalConfig?.postCommand,
      autoRunPostCommand:
        projectConfig?.autoRunPostCommand ?? globalConfig?.autoRunPostCommand,
      customInstructions:
        projectInstructions ??
        projectConfig?.customInstructions ??
        globalConfig?.customInstructions,
    }),
    paths,
  }
}

async function readConfigFile(filePath: string) {
  let contents: string

  try {
    contents = await readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined
    }

    throw error
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(contents)
  } catch (error) {
    throw new Error(
      `Invalid config in ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  const result = configFileSchema.safeParse(parsed)

  if (!result.success) {
    throw new Error(`Invalid config in ${filePath}: ${result.error.message}`)
  }

  return result.data
}

async function readInstructionsFile(filePath: string) {
  let contents: string

  try {
    contents = await readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined
    }

    throw error
  }

  const value = contents.trim()

  return value.length > 0 ? value : undefined
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code === 'ENOENT'
  )
}
