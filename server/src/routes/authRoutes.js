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
