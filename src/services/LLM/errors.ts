export class LLMError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'LLMError'
  }
}

export class LLMConfigError extends LLMError {
  constructor(message: string) {
    super(message)
    this.name = 'LLMConfigError'
  }
}

export class LLMInvalidInputError extends LLMError {
  constructor(message: string) {
    super(message)
    this.name = 'LLMInvalidInputError'
  }
}

export class LLMNetworkError extends LLMError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
    this.name = 'LLMNetworkError'
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(message?: string) {
    super(message ?? 'Request timed out')
    this.name = 'LLMTimeoutError'
  }
}

export class LLMAPIClientError extends LLMError {
  public readonly status: number
  public readonly code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'LLMAPIClientError'
    this.status = status
    this.code = code
  }
}

export class LLMAPIServerError extends LLMError {
  public readonly status: number
  public readonly code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'LLMAPIServerError'
    this.status = status
    this.code = code
  }
}

export class LLMParseError extends LLMError {
  public readonly rawText?: string
  constructor(message: string, rawText?: string) {
    super(message)
    this.name = 'LLMParseError'
    this.rawText = rawText
  }
}

export class LLMValidationError extends LLMError {
  public readonly rawValue?: unknown
  constructor(message: string, rawValue?: unknown) {
    super(message)
    this.name = 'LLMValidationError'
    this.rawValue = rawValue
  }
}
