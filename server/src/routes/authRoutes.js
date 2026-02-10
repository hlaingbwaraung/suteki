/**
 * Auth routes  –  /api/auth
 *
 * Public:
 *   POST /register          – Create account (email/password)
 *   POST /login              – Email/password sign-in
 *   POST /google             – Google OAuth sign-in
 *
 * Protected (JWT):
 *   GET  /me                 – Current user profile
 *   PUT  /profile            – Update name / email
 *   PUT  /password           – Change password
 *   DELETE /account          – Delete own account
 *   POST /activate-premium   – Activate premium plan
 */
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/google', authController.googleAuth)

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/password', authenticate, authController.updatePassword)
router.delete('/account', authenticate, authController.deleteAccount)
router.post('/activate-premium', authenticate, authController.activatePremium)

module.exports = router
