import { z } from 'zod'

export const postCommandSchema = z.enum(['push', 'push-and-pull'])

export const modelEntrySchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    reasoning: z.union([z.boolean(), z.string().min(1)]).optional(),
  }),
])

export const modelGroupSchema = z.record(
  z.string().min(1),
  z.array(modelEntrySchema)
)

export const configFileSchema = z.object({
  models: modelGroupSchema.optional(),
  defaultModel: z.string().min(1).optional(),
  autoAcceptCommitMessage: z.boolean().optional(),
  postCommand: postCommandSchema.optional(),
  autoRunPostCommand: z.boolean().optional(),
  customInstructions: z.string().min(1).optional(),
})

export const resolvedConfigSchema = z.object({
  models: modelGroupSchema.default({}),
  defaultModel: z.string().min(1).optional(),
  autoAcceptCommitMessage: z.boolean().default(false),
  postCommand: postCommandSchema.default('push'),
  autoRunPostCommand: z.boolean().default(false),
  customInstructions: z.string().min(1).optional(),
})
