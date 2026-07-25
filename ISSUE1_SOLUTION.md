# Issue 1: LLM Integration Service — Blueprint-to-Scene Conversion

## Goal

Add an LLM integration service at `services/LLM/` that converts a building blueprint (text description or image) into a structured JSON scene description via OpenRouter. This feeds the existing Three.js floorplan viewer on the frontend.

The service is an isolated integration layer — no DB, no auth, no rendering — called by the Project Service.

---

## Implementation Summary

### New files created

| File | Purpose |
|---|---|
| `src/services/LLM/index.ts` | **Single public entry point** — exports `generateSceneFromBlueprint()` |
| `src/services/LLM/types.ts` | All exported TypeScript types: `Scene`, `SceneObject` (union `Wall \| Door \| Window`), `Blueprint`, `BlueprintImage`, `ContentPart` |
| `src/services/LLM/errors.ts` | 8 typed error classes: `LLMError`, `LLMConfigError`, `LLMInvalidInputError`, `LLMNetworkError`, `LLMTimeoutError`, `LLMAPIClientError`, `LLMAPIServerError`, `LLMParseError`, `LLMValidationError` |
| `src/services/LLM/schema.ts` | Hand-rolled runtime validator — validates every LLM response against the expected shape before returning it |
| `src/services/LLM/env.ts` | Reads `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL` with fast-fail config validation |
| `src/services/LLM/logger.ts` | Leveled console logger (`LLM_LOG_LEVEL` env var), never logs API keys |
| `src/services/LLM/utils.ts` | `extractJSON()` strips markdown fences and stray prose; `sleep()` for retry backoff |
| `src/services/LLM/providers/interface.ts` | `LLMProvider` interface — the only dependency `generateSceneFromBlueprint` has on a provider |
| `src/services/LLM/providers/openrouter.ts` | Concrete OpenRouter provider implementing the `LLMProvider` interface |
| `src/services/LLM/__tests__/index.test.ts` | 23 tests with mocked providers — zero network calls, no API key required |

### Modified files

| File | Change |
|---|---|
| `package.json` | Added `vitest` dev dependency; updated `test` / added `test:watch` scripts |
| `.env.example` | Added `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_BASE_URL`, `LLM_LOG_LEVEL` |

---

## Architecture

```
src/services/LLM/
├── index.ts                  ← generateSceneFromBlueprint(blueprint, options?): Promise<Scene>
├── types.ts                  ← Scene, SceneObject, Wall, Door, Window, Blueprint, BlueprintImage
├── errors.ts                 ← Typed error hierarchy
├── schema.ts                 ← Runtime validation
├── env.ts                    ← Env var loading
├── logger.ts                 ← Leveled logging
├── utils.ts                  ← Markdown fence stripping, sleep
├── providers/
│   ├── interface.ts          ← LLMProvider interface (swap-friendly)
│   └── openrouter.ts         ← OpenRouter implementation
└── __tests__/
    └── index.test.ts         ← 23 tests, all mocked
```

### Data flow

```
Caller (e.g. Project Service)
        │
        ▼
generateSceneFromBlueprint(blueprint, { provider?, timeoutMs?, maxRetries? })
        │
        ├── buildUserContent() — validates input, constructs text or multimodal content
        │
        ├── provider.complete({ systemPrompt, userContent, signal })
        │       └── OpenRouter POST /chat/completions (via fetch)
        │
        ├── extractJSON() — strips ```json fences, leading/trailing prose
        │
        ├── JSON.parse() — returns LLMParseError on failure
        │
        ├── validateScene() — runs against hand-rolled schema, returns LLMValidationError on mismatch
        │
        └── returns validated Scene
```

### Retry strategy

| HTTP / Error | Action |
|---|---|
| 200 (valid JSON matching schema) | Return immediately |
| 200 (invalid JSON or schema mismatch) | **No retry** — throw `LLMParseError` / `LLMValidationError` |
| 400, 401, 402, 403 | **No retry** — throw `LLMAPIClientError` |
| 408, 429, 5xx | Retry up to 3× with exponential backoff (1s, 2s, 4s) |
| Network failure (DNS, ECONNRESET) | Retry up to 3× with exponential backoff |
| Timeout | Retry up to 3× with exponential backoff |
| Empty/invalid input | **No retry** — throw `LLMInvalidInputError` before any network call |

### Error handling

Every failure mode returns a typed error class so callers can branch on `instanceof` instead of parsing message strings:

```typescript
try {
  const scene = await generateSceneFromBlueprint(blueprint)
} catch (err) {
  if (err instanceof LLMInvalidInputError) { /* bad input */ }
  if (err instanceof LLMConfigError) { /* missing env vars */ }
  if (err instanceof LLMTimeoutError) { /* request timed out */ }
  if (err instanceof LLMAPIClientError) { /* 401, 403, etc */ }
  if (err instanceof LLMParseError) { /* model returned bad JSON */ }
  if (err instanceof LLMValidationError) { /* JSON doesn't match schema */ }
}
```

### Provider abstraction

Adding a new LLM backend (e.g. Gemini, Claude directly) requires only:

1. Create `providers/gemini.ts` implementing `LLMProvider` interface
2. Pass it via `options.provider` — zero changes to `generateSceneFromBlueprint`

---

## Public API

```typescript
async function generateSceneFromBlueprint(
  blueprint: string | BlueprintImage,
  options?: {
    provider?: LLMProvider      // Injection point for tests / alternate backends
    timeoutMs?: number           // Default: 60000
    maxRetries?: number          // Default: 3
  }
): Promise<Scene>
```

### Input types

```typescript
type Blueprint = string | BlueprintImage

interface BlueprintImage {
  url?: string   // Remote URL
  data?: string  // Inline base64 with data URI prefix, e.g. "data:image/png;base64,..."
}
```

### Output type

```typescript
interface Scene {
  objects: SceneObject[]  // Array of Wall | Door | Window
}

interface Wall {
  type: 'wall'
  start: [number, number]
  end: [number, number]
  height: number
}

interface Door {
  type: 'door'
  position: [number, number]
  width: number
}

interface Window {
  type: 'window'
  position: [number, number]
  width: number
}
```

Adding a new object type (e.g. `floor`, `column`) requires only:
1. Add an interface in `types.ts`
2. Add a union member in `SceneObject`
3. Add a `case` in `schema.ts`'s `validateSceneObject`

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_MODEL` | Yes | — | Model ID (must be vision-capable for image blueprints, e.g. `google/gemini-2.0-flash-001`) |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `LLM_LOG_LEVEL` | No | `info` | Log level: `debug`, `info`, `warn`, `error` |

---

## Running tests

```bash
npm test                          # vitest run (all 23 tests pass)
npm run test:watch                # vitest interactive watch mode
```

Tests use mocked providers — no real network calls, no API key required.

```bash
npm run build                     # tsc — compiles cleanly with --noEmit
```

---

## OpenRouter API integration details

- **Endpoint**: `POST {OPENROUTER_BASE_URL}/chat/completions`
- **Headers**: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `Content-Type: application/json`
- **Response format**: `{ type: "json_object" }` (broad model compatibility); supports opt-in `{ type: "json_schema", ... }` when caller passes a schema
- **Error handling**: Checks both HTTP status and `choices[0].error` (per-choice errors on HTTP 200)
- **Timeout**: `AbortController` with configurable timeout, raced against the provider call via `Promise.race`
