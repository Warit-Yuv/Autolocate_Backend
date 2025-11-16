import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret'
const TOKEN_NAME = process.env.JWT_COOKIE_NAME || 'token'
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m' // can be '15m', '1h', etc.

// cookie options are configurable via environment variables for safe production behavior
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production'
const COOKIE_SAMESITE = process.env.JWT_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined
const COOKIE_PATH = process.env.COOKIE_PATH || '/'
const COOKIE_MAX_AGE = process.env.JWT_COOKIE_MAX_AGE_MS ? parseInt(process.env.JWT_COOKIE_MAX_AGE_MS, 10) : 15 * 60 * 1000

// browsers require Secure=true when SameSite=None
const finalSecure = COOKIE_SAMESITE === 'none' ? true : COOKIE_SECURE

const cookieOptions = {
  httpOnly: true,
  secure: finalSecure,
  sameSite: COOKIE_SAMESITE,
  domain: COOKIE_DOMAIN,
  path: COOKIE_PATH,
  // maxAge in ms
  maxAge: COOKIE_MAX_AGE,
}

export function issueToken(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
  // Issue cookie with configured options. It's safe to include token in cookie only when
  // cookieOptions.httpOnly is true (prevents JS access) and secure/sameSite are set for production.
  res.cookie(TOKEN_NAME, token, cookieOptions)
  return token
}

export function clearToken(res) {
  res.clearCookie(TOKEN_NAME, cookieOptions)
}

export function jwtAuth(req, res, next) {
  try {
    // Accept token from cookie (primary), Authorization header (Bearer), or ?token= query (testing)
    let token = req.cookies?.[TOKEN_NAME]
    if (!token) {
      const authHeader = req.get('Authorization') || req.get('authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.slice(7).trim()
      }
    }
    if (!token && req.query && req.query.token) {
      token = req.query.token
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated' })
    const payload = jwt.verify(token, JWT_SECRET)
    // payload should contain sub and role
    req.user = { id: payload.sub, role: payload.role }
    return next()
  } catch (err) {
    console.error('jwtAuth error:', err && err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (!userRole) return res.status(401).json({ error: 'Not authenticated' })
    if (roles.includes(userRole)) return next()
    return res.status(403).json({ error: 'Forbidden' })
  }
}

export default { issueToken, clearToken, jwtAuth, requireRole }
