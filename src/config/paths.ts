import os from 'node:os'
import path from 'node:path'

export function getConfigPaths(cwd = process.cwd()) {
  return {
    globalConfigPath: path.join(os.homedir(), '.config', 'gityo.json'),
    projectConfigPath: path.join(cwd, '.gityo.config.json'),
    projectInstructionsPath: path.join(cwd, '.gityo.instructions.md'),
  }
}
