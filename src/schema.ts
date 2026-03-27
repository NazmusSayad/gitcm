import { z } from 'zod'

const BUILTIN_PROVIDERS = ['openai', 'anthropic', 'google'] as const
const COMPATIBLE_PROVIDERS = ['openrouter', 'kilo'] as const
export const SUPPORTED_PROVIDERS = [
  ...BUILTIN_PROVIDERS,
  ...COMPATIBLE_PROVIDERS,
] as const
export const POST_COMMANDS = ['push', 'push-and-pull', 'push-and-pr'] as const
export type PostCommand = (typeof POST_COMMANDS)[number] | null

export const configSchema = z
  .object({
    $schema: z.url(),

    model: z.object({
      provider: z.union([
        ...SUPPORTED_PROVIDERS.map((p) => z.literal(p)),
        z.url(),
      ]),

      name: z.string().min(1),

      reasoning: z.union([z.boolean(), z.string().min(1)]).default(false),
    }),

    autoAcceptMessage: z.boolean(),
    instructions: z.string().min(1),

    postCommand: z.enum(POST_COMMANDS).nullable(),
    pullRequestBaseBranch: z.string().min(1),
    autoRunPostCommand: z.boolean(),
  })
  .partial()

export function resolveConfig(input: unknown) {
  const parsed = configSchema.parse(input)
  const postCommand: PostCommand =
    parsed.postCommand === undefined ? 'push' : parsed.postCommand

  return {
    model: parsed.model,

    instructions: parsed.instructions,
    autoAcceptCommitMessage: parsed.autoAcceptMessage ?? false,

    postCommand,

    pullRequestBaseBranch: parsed.pullRequestBaseBranch,

    autoRunPostCommand: parsed.autoRunPostCommand ?? false,
  }
}

export type ResolvedConfig = ReturnType<typeof resolveConfig>
