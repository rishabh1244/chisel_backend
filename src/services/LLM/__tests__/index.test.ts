import { describe, it, expect, beforeEach } from 'vitest'
import { generateSceneFromBlueprint } from '../index'
import { LLMProvider } from '../providers/interface'
import {
  LLMInvalidInputError,
  LLMParseError,
  LLMValidationError,
  LLMTimeoutError,
  LLMAPIClientError,
  LLMAPIServerError,
  LLMNetworkError,
} from '../errors'
import { resetConfig } from '../env'
import type { Scene } from '../types'

function mockProvider(response?: string, shouldThrow?: Error): LLMProvider {
  return {
    async complete() {
      if (shouldThrow) throw shouldThrow
      if (response !== undefined) return response
      return JSON.stringify({
        objects: [
          { type: 'wall', start: [0, 0], end: [5, 0], height: 3 },
          { type: 'door', position: [2, 0], width: 1 },
          { type: 'window', position: [4, 2], width: 1.5 },
        ],
      })
    },
  }
}

const validScene: Scene = {
  objects: [
    { type: 'wall', start: [0, 0], end: [5, 0], height: 3 },
    { type: 'door', position: [2, 0], width: 1 },
    { type: 'window', position: [4, 2], width: 1.5 },
  ],
}

describe('generateSceneFromBlueprint', () => {
  beforeEach(() => {
    resetConfig()
  })

  it('returns a validated Scene from a text blueprint', async () => {
    const result = await generateSceneFromBlueprint('A room with a door and window', {
      provider: mockProvider(),
    })
    expect(result).toEqual(validScene)
  })

  it('strips markdown code fences from the response', async () => {
    const fencedResponse = [
      '```json',
      JSON.stringify(validScene),
      '```',
    ].join('\n')
    const result = await generateSceneFromBlueprint('A room', {
      provider: mockProvider(fencedResponse),
    })
    expect(result).toEqual(validScene)
  })

  it('strips leading/trailing prose from the response', async () => {
    const proseResponse = [
      'Here is the JSON you requested:',
      JSON.stringify(validScene),
      'I hope this helps!',
    ].join('\n')
    const result = await generateSceneFromBlueprint('A room', {
      provider: mockProvider(proseResponse),
    })
    expect(result).toEqual(validScene)
  })

  it('strips markdown fences without json label', async () => {
    const fencedResponse = [
      '```',
      JSON.stringify(validScene),
      '```',
    ].join('\n')
    const result = await generateSceneFromBlueprint('A room', {
      provider: mockProvider(fencedResponse),
    })
    expect(result).toEqual(validScene)
  })

  it('throws LLMParseError for invalid JSON response', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider('not valid json at all'),
      })
    ).rejects.toThrow(LLMParseError)
  })

  it('throws LLMValidationError for JSON missing required fields', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider(JSON.stringify({ objects: [{ type: 'wall' }] })),
      })
    ).rejects.toThrow(LLMValidationError)
  })

  it('throws LLMValidationError for unsupported object type', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider(
          JSON.stringify({ objects: [{ type: 'floor', position: [0, 0], width: 5 }] })
        ),
      })
    ).rejects.toThrow(LLMValidationError)
  })

  it('throws LLMValidationError for missing objects array', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider(JSON.stringify({ notObjects: [] })),
      })
    ).rejects.toThrow(LLMValidationError)
  })

  it('throws LLMInvalidInputError for empty string input', async () => {
    await expect(
      generateSceneFromBlueprint('', { provider: mockProvider() })
    ).rejects.toThrow(LLMInvalidInputError)
  })

  it('throws LLMInvalidInputError for null/undefined blueprint', async () => {
    await expect(
      generateSceneFromBlueprint(null as unknown as string, {
        provider: mockProvider(),
      })
    ).rejects.toThrow(LLMInvalidInputError)
  })

  it('throws LLMInvalidInputError for BlueprintImage with neither url nor data', async () => {
    await expect(
      generateSceneFromBlueprint({}, { provider: mockProvider() })
    ).rejects.toThrow(LLMInvalidInputError)
  })

  it('accepts BlueprintImage with a url', async () => {
    const result = await generateSceneFromBlueprint(
      { url: 'https://example.com/blueprint.png' },
      { provider: mockProvider() }
    )
    expect(result).toEqual(validScene)
  })

  it('accepts BlueprintImage with base64 data', async () => {
    const result = await generateSceneFromBlueprint(
      { data: 'data:image/png;base64,iVBORw0KGgo=' },
      { provider: mockProvider() }
    )
    expect(result).toEqual(validScene)
  })

  it('throws LLMTimeoutError when request times out', { timeout: 15000 }, async () => {
    const slowProvider: LLMProvider = {
      complete() {
        return new Promise<string>(() => {})
      },
    }

    await expect(
      generateSceneFromBlueprint('A room', {
        provider: slowProvider,
        timeoutMs: 10,
        maxRetries: 1,
      })
    ).rejects.toThrow(LLMTimeoutError)
  })

  it('fails without retrying on non-retryable LLMAPIClientError (401)', async () => {
    let callCount = 0
    const clientErrorProvider: LLMProvider = {
      async complete() {
        callCount++
        throw new LLMAPIClientError(401, 'Invalid API key')
      },
    }

    await expect(
      generateSceneFromBlueprint('A room', { provider: clientErrorProvider })
    ).rejects.toThrow(LLMAPIClientError)

    expect(callCount).toBe(1)
  })

  it('fails immediately for LLMInvalidInputError without calling provider', async () => {
    let providerCalled = false
    const provider: LLMProvider = {
      async complete() {
        providerCalled = true
        return ''
      },
    }

    await expect(
      generateSceneFromBlueprint('', { provider })
    ).rejects.toThrow(LLMInvalidInputError)

    expect(providerCalled).toBe(false)
  })

  it('retries on LLMAPIServerError (429) and succeeds on retry', async () => {
    let callCount = 0
    const rateLimitThenOk: LLMProvider = {
      async complete() {
        callCount++
        if (callCount <= 2) {
          throw new LLMAPIServerError(429, 'Rate limited')
        }
        return JSON.stringify(validScene)
      },
    }

    const result = await generateSceneFromBlueprint('A room', {
      provider: rateLimitThenOk,
      maxRetries: 3,
    })

    expect(result).toEqual(validScene)
    expect(callCount).toBe(3)
  })

  it('retries on LLMNetworkError and succeeds on retry', async () => {
    let callCount = 0
    const networkFailThenOk: LLMProvider = {
      async complete() {
        callCount++
        if (callCount <= 2) {
          throw new LLMNetworkError('ECONNRESET')
        }
        return JSON.stringify(validScene)
      },
    }

    const result = await generateSceneFromBlueprint('A room', {
      provider: networkFailThenOk,
      maxRetries: 3,
    })

    expect(result).toEqual(validScene)
    expect(callCount).toBe(3)
  })

  it('gives up after max retries on persistent server errors', async () => {
    let callCount = 0
    const alwaysFails: LLMProvider = {
      async complete() {
        callCount++
        throw new LLMAPIServerError(502, 'Bad Gateway')
      },
    }

    await expect(
      generateSceneFromBlueprint('A room', {
        provider: alwaysFails,
        maxRetries: 2,
      })
    ).rejects.toThrow(LLMAPIServerError)

    expect(callCount).toBe(3)
  })

  it('throws LLMValidationError when wall has missing height field', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider(
          JSON.stringify({
            objects: [{ type: 'wall', start: [0, 0], end: [5, 0] }],
          })
        ),
      })
    ).rejects.toThrow(LLMValidationError)
  })

  it('throws LLMValidationError when door has non-array position', async () => {
    await expect(
      generateSceneFromBlueprint('A room', {
        provider: mockProvider(
          JSON.stringify({
            objects: [{ type: 'door', position: 'not-an-array', width: 1 }],
          })
        ),
      })
    ).rejects.toThrow(LLMValidationError)
  })

  it('does not retry on LLMParseError', async () => {
    let callCount = 0
    const badJSONProvider: LLMProvider = {
      async complete() {
        callCount++
        return '{ broken json'
      },
    }

    await expect(
      generateSceneFromBlueprint('A room', {
        provider: badJSONProvider,
        maxRetries: 3,
      })
    ).rejects.toThrow(LLMParseError)

    expect(callCount).toBe(1)
  })

  it('does not retry on LLMValidationError', async () => {
    let callCount = 0
    const badSchemaProvider: LLMProvider = {
      async complete() {
        callCount++
        return JSON.stringify({ objects: 'not-an-array' })
      },
    }

    await expect(
      generateSceneFromBlueprint('A room', {
        provider: badSchemaProvider,
        maxRetries: 3,
      })
    ).rejects.toThrow(LLMValidationError)

    expect(callCount).toBe(1)
  })
})
