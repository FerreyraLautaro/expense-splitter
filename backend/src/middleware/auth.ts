import { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      guestToken?: string
    }
  }
}

/**
 * Parses the Authorization header and sets req.guestToken if a guest token is found.
 */
export function parseAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer guest_')) {
    req.guestToken = header.slice(7)
  }
  next()
}
