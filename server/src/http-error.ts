export class HttpError extends Error {
  readonly statusCode: number
  constructor(statusCode: number) {
    super()
    this.statusCode = statusCode
  }
}

export class BadRequest extends HttpError {
  constructor() {
    super(400)
  }
}

export class Unauthorized extends HttpError {
  constructor() {
    super(401)
  }
}

export class Forbidden extends HttpError {
  constructor() {
    super(403)
  }
}

export class NotFound extends HttpError {
  constructor() {
    super(404)
  }
}
