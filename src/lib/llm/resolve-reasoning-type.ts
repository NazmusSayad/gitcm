export function resolveReasoningType(
  provider: string,
  input: boolean | string
) {
  if (reasoning !== undefined && reasoning !== false) {
    if (provider === 'anthropic') {
      providerOptions = {
        anthropic: {
          thinking:
            reasoning === 'disabled'
              ? { type: 'disabled' as const }
              : reasoning === 'enabled'
                ? { type: 'enabled' as const }
                : { type: 'adaptive' as const },
        },
      }
    } else if (provider === 'google') {
      providerOptions = {
        google: {
          thinkingConfig: {
            thinkingLevel: reasoning === true ? 'medium' : reasoning,
          },
        },
      }
    } else {
      providerOptions = {
        [provider]: {
          reasoningEffort: reasoning === true ? 'medium' : reasoning,
        },
      }
    }
  }
}
