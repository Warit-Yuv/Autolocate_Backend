import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret'
const TOKEN_NAME = process.env.JWT_COOKIE_NAME || 'token'
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m' // can be '15m', '1h', etc.

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  // maxAge in ms
  maxAge: 15 * 60 * 1000,
}

export function issueToken(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
  res.cookie(TOKEN_NAME, token, cookieOptions)
  return token
}

export function clearToken(res) {
  res.clearCookie(TOKEN_NAME, cookieOptions)
}

export function jwtAuth(req, res, next) {
  try {
    const token = req.cookies?.[TOKEN_NAME]
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
