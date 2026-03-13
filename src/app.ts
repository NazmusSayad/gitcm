import { NoArg } from 'noarg'
import { mainController } from './controllers/main'
import { listModelsController } from './controllers/models-list'
import { setModelsController } from './controllers/models-set'
import { handleError } from './lib/handle-error'

export const app = NoArg.create('gityo', {
  description:
    'Stage changes, generate or enter a commit message, create a commit, and run a post-commit git command.',
})

const modelProgram = app.create('model', {
  description: 'Manage configured model provider and stored API keys.',
})

const modelsListProgram = modelProgram.create('list', {
  description: 'Show configured model and any stored API keys.',
})

const modelsSetProgram = modelProgram.create('set', {
  description:
    'Set or update a stored API key for a provider or custom base URL.',

  arguments: [{ name: 'provider', type: NoArg.string() }],
  optionalArguments: [{ name: 'api-key', type: NoArg.string() }],
})

app.on(() => {
  handleError(mainController)
})

modelsListProgram.on(() => {
  handleError(listModelsController)
})

modelsSetProgram.on(([provider, apiKey]) => {
  handleError(() => setModelsController(provider, apiKey))
})
