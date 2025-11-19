import express from 'express'
import { jwtAuth, clearToken } from '../middleware/auth.js'

const router = express.Router()

// GET current user (requires valid token)
router.get('/me', jwtAuth, (req, res) => {
  return res.status(200).json({ user: req.user })
})

// POST /logout - clears cookie
router.post('/logout', (req, res) => {
  const username = req.body.username || (req.user && req.user.username) || 'Unknown';
  clearToken(res);
  console.log(`User ${username} logged out, token cookie cleared.`);
  return res.status(200).json({ message: `Logged out user: ${username}` });
})

export default router
