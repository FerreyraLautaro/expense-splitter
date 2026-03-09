import { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret')

export interface AuthPayload {
  userId: string
  email: string
}

// Extends Express Request with optional auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload
      guestToken?: string
    }
  }
}

/**
 * Parses the Authorization header. Sets req.auth if a valid JWT is found,
 * or req.guestToken if a guest token is provided.
 * Does NOT reject unauthenticated requests — use requireAuth for that.
 */
export async function parseAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return next()

  if (header.startsWith('Bearer ')) {
    const token = header.slice(7)

    // Guest tokens are prefixed with "guest_"
    if (token.startsWith('guest_')) {
      req.guestToken = token
      return next()
    }

    try {
      const { payload } = await jwtVerify(token, secret)
      req.auth = { userId: payload.sub as string, email: payload.email as string }
    } catch {
      // Invalid JWT — treat as unauthenticated
    }
  }

  next()
}

/** Rejects requests that are not authenticated as a registered user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
