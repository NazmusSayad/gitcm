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

export const configSchema = z
  .object({
    $schema: z.url().optional(),

    models: modelGroupSchema.default({}),

    autoAcceptCommitMessage: z.boolean().default(false),
    customInstructions: z.string().min(1).optional(),

    postCommand: postCommandSchema.default('push'),
    autoRunPostCommand: z.boolean().default(false),
  })
  .default({
    models: {},

    autoAcceptCommitMessage: false,
    customInstructions: undefined,

    postCommand: 'push',
    autoRunPostCommand: false,
  })

export type ConfigSchema = z.infer<typeof configSchema>
