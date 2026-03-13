import { NoArg } from 'noarg'
import { showConfigController } from './controllers/config'
import { setConfigController } from './controllers/config-set'
import { setConfigModelController } from './controllers/config-set-model'
import { mainController } from './controllers/main'
import { resolveScope } from './helpers/resolve-scope'
import { handleError } from './lib/handle-error'

export const app = NoArg.create('gityo', {
  description:
    'Stage changes, generate or enter a commit message, create a commit, and run a post-commit git command.',
})

const configProgram = app.create('config', {
  description: 'View and update gityo configuration.',
})

const configSetProgram = configProgram.create('set', {
  description:
    'Set a config value, or set model with provider, name, and API key.',
  optionalArguments: [
    { name: 'key', type: NoArg.string() },
    { name: 'value', type: NoArg.string() },
  ],

  globalFlags: {
    local: NoArg.boolean().default(false).aliases('l'),
    global: NoArg.boolean().default(true).aliases('g'),
  },
})

const configSetModelProgram = configSetProgram.create('model', {
  description: 'Set the model provider, name, and API key.',
  optionalArguments: [
    { name: 'provider', type: NoArg.string() },
    { name: 'name', type: NoArg.string() },
    { name: 'apiKey', type: NoArg.string() },
  ],
})

app.on(() => {
  handleError(mainController)
})

configProgram.on(() => {
  handleError(showConfigController)
})

configSetProgram.on(([key, value], options) => {
  handleError(() =>
    setConfigController(resolveScope(options.global, options.local), key, value)
  )
})

configSetModelProgram.on(([provider, name, apiKey], options) => {
  handleError(() =>
    setConfigModelController(
      resolveScope(options.global, options.local),
      provider,
      name,
      apiKey
    )
  )
})
