import { LLMConfigError } from './errors'

export interface LLMConfig {
  apiKey: string
  model: string
  baseURL: string
}

let cached: LLMConfig | null = null

export function getConfig(): LLMConfig {
  if (cached) return cached

  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL
  const baseURL =
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'

  if (!apiKey) {
    throw new LLMConfigError(
      'OPENROUTER_API_KEY environment variable is required but was not set'
    )
  }
  if (!model) {
    throw new LLMConfigError(
      'OPENROUTER_MODEL environment variable is required but was not set. ' +
        'It must be a vision-capable model (e.g. google/gemini-2.0-flash-001) ' +
        'if you plan to use image blueprints.'
    )
  }

  cached = { apiKey, model, baseURL }
  return cached
}

export function resetConfig(): void {
  cached = null
}
