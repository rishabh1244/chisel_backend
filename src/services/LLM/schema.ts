import { Scene, SceneObject } from './types'
import { LLMValidationError } from './errors'

function isNumberArray(val: unknown, length: number): val is number[] {
  return (
    Array.isArray(val) &&
    val.length === length &&
    val.every((v) => typeof v === 'number')
  )
}

function validateSceneObject(
  obj: unknown,
  index: number
): SceneObject {
  if (!obj || typeof obj !== 'object') {
    throw new LLMValidationError(
      `objects[${index}] must be a non-null object`,
      obj
    )
  }

  const o = obj as Record<string, unknown>

  if (typeof o.type !== 'string' || o.type.length === 0) {
    throw new LLMValidationError(
      `objects[${index}] must have a non-empty string "type" field`,
      obj
    )
  }

  switch (o.type) {
    case 'wall': {
      if (!isNumberArray(o.start, 2)) {
        throw new LLMValidationError(
          `objects[${index}].start must be a [x, y] number array`,
          obj
        )
      }
      if (!isNumberArray(o.end, 2)) {
        throw new LLMValidationError(
          `objects[${index}].end must be a [x, y] number array`,
          obj
        )
      }
      if (typeof o.height !== 'number') {
        throw new LLMValidationError(
          `objects[${index}].height must be a number`,
          obj
        )
      }
      return {
        type: 'wall',
        start: o.start as [number, number],
        end: o.end as [number, number],
        height: o.height,
      }
    }
    case 'door': {
      if (!isNumberArray(o.position, 2)) {
        throw new LLMValidationError(
          `objects[${index}].position must be a [x, y] number array`,
          obj
        )
      }
      if (typeof o.width !== 'number') {
        throw new LLMValidationError(
          `objects[${index}].width must be a number`,
          obj
        )
      }
      return {
        type: 'door',
        position: o.position as [number, number],
        width: o.width,
      }
    }
    case 'window': {
      if (!isNumberArray(o.position, 2)) {
        throw new LLMValidationError(
          `objects[${index}].position must be a [x, y] number array`,
          obj
        )
      }
      if (typeof o.width !== 'number') {
        throw new LLMValidationError(
          `objects[${index}].width must be a number`,
          obj
        )
      }
      return {
        type: 'window',
        position: o.position as [number, number],
        width: o.width,
      }
    }
    default: {
      const type = o.type
      throw new LLMValidationError(
        `objects[${index}] has unsupported type "${type}". Supported types: wall, door, window`,
        obj
      )
    }
  }
}

export function validateScene(data: unknown): Scene {
  if (!data || typeof data !== 'object') {
    throw new LLMValidationError('Response must be a non-null object', data)
  }

  const d = data as Record<string, unknown>

  if (!Array.isArray(d.objects)) {
    throw new LLMValidationError(
      'Response must contain an "objects" array',
      data
    )
  }

  const objects: SceneObject[] = []
  for (let i = 0; i < d.objects.length; i++) {
    objects.push(validateSceneObject(d.objects[i], i))
  }

  return { objects }
}
