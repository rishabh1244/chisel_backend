import { LLMProvider, LLMProviderConfig } from './interface'
import { getConfig } from '../env'
import {
  LLMAPIClientError,
  LLMAPIServerError,
  LLMNetworkError,
} from '../errors'
import { logger } from '../logger'
import { ContentPart } from '../types'

interface OpenRouterMessage {
  role: 'system' | 'user'
  content: string | OpenRouterContentPart[]
}

interface OpenRouterContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}

interface OpenRouterErrorBody {
  error?: {
    code?: string
    message?: string
    metadata?: Record<string, unknown>
  }
}

interface OpenRouterChoice {
  message?: {
    content?: string | null
  }
  error?: {
    code?: string
    message?: string
  }
}

interface OpenRouterSuccessBody {
  choices?: OpenRouterChoice[]
}

function fromContentPart(part: ContentPart): OpenRouterContentPart {
  if (part.type === 'text') {
    return { type: 'text', text: part.text }
  }
  return { type: 'image_url', image_url: { url: part.image_url!.url } }
}

function buildMessages(
  systemPrompt: string,
  userContent: string | ContentPart[]
): OpenRouterMessage[] {
  const userMessageContent =
    typeof userContent === 'string'
      ? userContent
      : userContent.map(fromContentPart)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessageContent },
  ]
}

export function createOpenRouterProvider(): LLMProvider {
  return {
    async complete(config: LLMProviderConfig): Promise<string> {
      const { apiKey, model, baseURL } = getConfig()
      const messages = buildMessages(config.systemPrompt, config.userContent)

      const body: Record<string, unknown> = {
        model,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 4096,
        temperature: 0.1,
      }

      if (config.responseSchema) {
        body.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'scene',
            strict: true,
            schema: config.responseSchema,
          },
        }
      }

      const url = `${baseURL}/chat/completions`

      logger.debug(`Sending request to ${url} with model ${model}`)

      let response: Response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: config.signal,
        })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err
        }
        const msg =
          err instanceof Error ? err.message : 'Unknown network error'
        logger.error(`Network error calling OpenRouter: ${msg}`)
        throw new LLMNetworkError(`Failed to reach OpenRouter: ${msg}`, err)
      }

      if (!response.ok) {
        const errorBody: OpenRouterErrorBody = await response
          .json()
          .catch(() => ({}))
        const errorMessage = errorBody?.error?.message || response.statusText
        const errorCode = errorBody?.error?.code

        if (
          response.status === 400 ||
          response.status === 401 ||
          response.status === 402 ||
          response.status === 403
        ) {
          logger.error(
            `OpenRouter client error ${response.status}: ${errorMessage}`
          )
          throw new LLMAPIClientError(
            response.status,
            errorMessage,
            errorCode
          )
        }

        logger.warn(
          `OpenRouter server error ${response.status}: ${errorMessage}`
        )
        throw new LLMAPIServerError(
          response.status,
          errorMessage,
          errorCode
        )
      }

      const data: OpenRouterSuccessBody = await response.json()

      const choice = data.choices?.[0]
      if (!choice) {
        throw new LLMAPIServerError(200, 'No choices returned from OpenRouter')
      }

      if (choice.error) {
        const errMsg =
          choice.error.message || 'Unknown per-choice error'
        logger.error(`OpenRouter per-choice error: ${errMsg}`)
        throw new LLMAPIServerError(200, errMsg, choice.error.code)
      }

      const content = choice.message?.content
      if (content == null) {
        throw new LLMAPIServerError(
          200,
          'Choice message content is null or undefined'
        )
      }

      logger.debug(`OpenRouter response received (${content.length} chars)`)

      return content
    },
  }
}
