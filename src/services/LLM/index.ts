import { LLMProvider } from './providers/interface'
import { createOpenRouterProvider } from './providers/openrouter'
import { Blueprint, BlueprintImage, Scene, ContentPart } from './types'
import { extractJSON, sleep } from './utils'
import { validateScene } from './schema'
import { logger } from './logger'
import {
  LLMError,
  LLMInvalidInputError,
  LLMNetworkError,
  LLMTimeoutError,
  LLMAPIClientError,
  LLMAPIServerError,
  LLMParseError,
} from './errors'

const DEFAULT_TIMEOUT_MS = 60_000
const MAX_RETRIES = 3

const SYSTEM_PROMPT = [
  'You are a blueprint-to-JSON converter. Given a building blueprint (text description or image),',
  'output a JSON object with an "objects" array containing typed elements.',
  '',
  'Supported object types:',
  '- wall: { "type": "wall", "start": [x, y], "end": [x, y], "height": z }',
  '- door: { "type": "door", "position": [x, y], "width": w }',
  '- window: { "type": "window", "position": [x, y], "width": w }',
  '',
  'All coordinates are in meters. Output ONLY valid JSON. No markdown fences, no commentary, no code.',
].join('\n')

function isBlueprintImage(blueprint: Blueprint): blueprint is BlueprintImage {
  return typeof blueprint === 'object' && blueprint !== null
}

function buildUserContent(
  blueprint: Blueprint
): string | ContentPart[] {
  if (typeof blueprint === 'string') {
    if (blueprint.trim().length === 0) {
      throw new LLMInvalidInputError(
        'Blueprint text description cannot be empty'
      )
    }
    return blueprint
  }

  if (isBlueprintImage(blueprint)) {
    if (blueprint.url) {
      return [
        {
          type: 'text',
          text: 'Generate a scene description from this blueprint image.',
        },
        { type: 'image_url', image_url: { url: blueprint.url } },
      ]
    }
    if (blueprint.data) {
      return [
        {
          type: 'text',
          text: 'Generate a scene description from this blueprint image.',
        },
        { type: 'image_url', image_url: { url: blueprint.data } },
      ]
    }
    throw new LLMInvalidInputError(
      'BlueprintImage must have a "url" or "data" field'
    )
  }

  throw new LLMInvalidInputError('Invalid blueprint input')
}

function isRetryable(err: unknown): boolean {
  if (err instanceof LLMAPIServerError) {
    return (
      err.status === 408 || err.status === 429 || err.status >= 500
    )
  }
  return err instanceof LLMNetworkError || err instanceof LLMTimeoutError
}

function isNonRetryable(err: LLMError): boolean {
  return (
    err instanceof LLMInvalidInputError ||
    err instanceof LLMAPIClientError ||
    err instanceof LLMParseError
  )
}

export async function generateSceneFromBlueprint(
  blueprint: Blueprint,
  options?: {
    provider?: LLMProvider
    timeoutMs?: number
    maxRetries?: number
  }
): Promise<Scene> {
  if (!blueprint) {
    throw new LLMInvalidInputError('Blueprint is required')
  }

  const provider = options?.provider ?? createOpenRouterProvider()
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options?.maxRetries ?? MAX_RETRIES

  const userContent = buildUserContent(blueprint)

  const label =
    typeof blueprint === 'string' ? 'text blueprint' : 'image blueprint'
  logger.info(`Generating scene from ${label}`)

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = Math.pow(2, attempt - 1) * 1000
      logger.info(`Retry attempt ${attempt}/${maxRetries} after ${backoff}ms`)
      await sleep(backoff)
    }

    const controller = new AbortController()

    try {
      logger.debug(`LLM request attempt ${attempt + 1}/${maxRetries + 1}`)

      const rawText = await Promise.race([
        provider.complete({
          systemPrompt: SYSTEM_PROMPT,
          userContent,
          signal: controller.signal,
        }),
        new Promise<string>((_, reject) => {
          const timeoutId = setTimeout(() => {
            controller.abort()
            reject(
              new LLMTimeoutError(`Request timed out after ${timeoutMs}ms`)
            )
          }, timeoutMs)
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId)
          })
        }),
      ])

      controller.abort()

      logger.debug(`Raw LLM response: ${rawText.length} chars`)

      const jsonText = extractJSON(rawText)

      let parsed: unknown
      try {
        parsed = JSON.parse(jsonText)
      } catch (e) {
        throw new LLMParseError(
          `Failed to parse LLM response as JSON: ${(e as Error).message}`,
          rawText
        )
      }

      return validateScene(parsed)
    } catch (err) {
      controller.abort()

      if (err instanceof DOMException && err.name === 'AbortError') {
        const timeoutErr = new LLMTimeoutError(
          `Request timed out after ${timeoutMs}ms`
        )
        if (attempt < maxRetries) {
          lastError = timeoutErr
          continue
        }
        throw timeoutErr
      }

      if (err instanceof LLMError) {
        if (isNonRetryable(err)) {
          logger.error(`Non-retryable error: ${err.message}`)
          throw err
        }
        if (isRetryable(err) && attempt < maxRetries) {
          lastError = err
          continue
        }
        throw err
      }

      throw err
    }
  }

  throw lastError ?? new LLMError('Failed to generate scene after all retries')
}

export type { LLMProvider } from './providers/interface'
export type {
  Blueprint,
  BlueprintImage,
  Scene,
  SceneObject,
  Wall,
  Door,
  Window,
  ContentPart,
} from './types'
export {
  LLMError,
  LLMConfigError,
  LLMInvalidInputError,
  LLMNetworkError,
  LLMTimeoutError,
  LLMAPIClientError,
  LLMAPIServerError,
  LLMParseError,
  LLMValidationError,
} from './errors'
