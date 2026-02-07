const express = require('express')
const router = express.Router()
const quizController = require('../controllers/quizController')
const { authenticate } = require('../middleware/auth')

// Submit a quiz score (requires auth)
router.post('/scores', authenticate, quizController.submitScore)

// Get leaderboard (requires auth to see personal best)
router.get('/leaderboard', authenticate, quizController.getLeaderboard)

module.exports = router
