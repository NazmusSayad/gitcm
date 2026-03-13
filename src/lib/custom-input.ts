import { createPrompt, isEnterKey, useKeypress, useState } from '@inquirer/core'
import chalk from 'chalk'

type CustomInputConfig = {
  message: string
  required?: boolean
}

const customInputPrompt = createPrompt<string, CustomInputConfig>(
  (config, done) => {
    const [status, setStatus] = useState<'idle' | 'done'>('idle')
    const [value, setValue] = useState('')
    const inputPrefix = chalk.dim('❯ ')

    useKeypress((key, readline) => {
      if (!isEnterKey(key)) {
        setValue(readline.line)
        return
      }

      const answer = value

      if (config.required && answer.trim().length === 0) {
        return
      }

      setStatus('done')
      setValue(answer)
      done(answer)
    })

    const prefix = status === 'done' ? chalk.green('') : chalk.blue('?')
    const messageColor = status === 'done' ? chalk.green : chalk.blue
    const header = `${prefix} ${messageColor(config.message)}`

    if (status === 'done') {
      return value.length === 0
        ? header
        : `${header}\n${chalk.magenta.dim(value)}`
    }

    return `${header}\n${inputPrefix}${value}`
  }
)

export async function customInput(config: CustomInputConfig) {
  return customInputPrompt(config)
}
