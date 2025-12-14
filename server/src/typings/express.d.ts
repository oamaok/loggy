declare namespace Express {
  export interface Request {
    auth?: { personId: number }
  }
}
