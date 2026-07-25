import { ContentPart } from '../types'

export interface LLMProviderConfig {
  systemPrompt: string
  userContent: string | ContentPart[]
  responseSchema?: object
  signal?: AbortSignal
}

export interface LLMProvider {
  complete(config: LLMProviderConfig): Promise<string>
}
