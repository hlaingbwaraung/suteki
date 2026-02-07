const QuizScore = require('../models/QuizScore')
const User = require('../models/User')

// POST /api/quiz/scores — save a quiz score
exports.submitScore = async (req, res) => {
  try {
    const { score, total, quiz_type } = req.body
    const userId = req.user.id

    if (score === undefined || score === null || !quiz_type) {
      return res.status(400).json({ message: 'score and quiz_type are required' })
    }

    // Get user name
    const user = await User.findByPk(userId)
    const userName = user?.name || 'Anonymous'

    const entry = await QuizScore.create({
      user_id: userId,
      user_name: userName,
      quiz_type,
      score: Math.min(Math.max(0, parseInt(score)), total || 10),
      total: total || 10
    })

    // Award points: 1 point per correct answer
    const pointsEarned = Math.min(Math.max(0, parseInt(score)), total || 10)
    if (pointsEarned > 0) {
      user.points = (user.points || 0) + pointsEarned
      await user.save()
    }

    res.status(201).json({ success: true, data: entry, pointsEarned, totalPoints: user.points })
  } catch (error) {
    console.error('Submit score error:', error)
    res.status(500).json({ message: 'Failed to save score' })
  }
}

// GET /api/quiz/leaderboard?quiz_type=jlpt_n3_kanji_reading
exports.getLeaderboard = async (req, res) => {
  try {
    const quizType = req.query.quiz_type || 'jlpt_n3_kanji_reading'

    // Top 20 scores (best score per user, most recent first for ties)
    const { sequelize } = require('../config/database')
    const [leaderboard] = await sequelize.query(`
      SELECT DISTINCT ON (user_id) 
        id, user_id, user_name, score, total, quiz_type, created_at
      FROM quiz_scores
      WHERE quiz_type = :quizType
      ORDER BY user_id, score DESC, created_at DESC
    `, {
      replacements: { quizType },
      type: sequelize.QueryTypes.SELECT
    }).then(rows => {
      // Sort by score descending, then by date
      return [rows.sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at)).slice(0, 20)]
    })

    // Personal best (if authenticated)
    let personalBest = null
    if (req.user?.id) {
      const best = await QuizScore.findOne({
        where: { user_id: req.user.id, quiz_type: quizType },
        order: [['score', 'DESC']],
        attributes: ['score']
      })
      personalBest = best?.score ?? null
    }

    res.json({ leaderboard, personalBest })
  } catch (error) {
    console.error('Leaderboard error:', error)
    // Fallback: simple query without DISTINCT ON (for non-PostgreSQL)
    try {
      const quizType = req.query.quiz_type || 'jlpt_n3_kanji_reading'
      const scores = await QuizScore.findAll({
        where: { quiz_type: quizType },
        order: [['score', 'DESC'], ['created_at', 'ASC']],
        limit: 50
      })

      // Deduplicate by user (keep best)
      const seen = new Set()
      const leaderboard = []
      for (const s of scores) {
        if (!seen.has(s.user_id)) {
          seen.add(s.user_id)
          leaderboard.push(s)
          if (leaderboard.length >= 20) break
        }
      }

      let personalBest = null
      if (req.user?.id) {
        const best = await QuizScore.findOne({
          where: { user_id: req.user.id, quiz_type: quizType },
          order: [['score', 'DESC']],
          attributes: ['score']
        })
        personalBest = best?.score ?? null
      }

      res.json({ leaderboard, personalBest })
    } catch (fallbackErr) {
      console.error('Leaderboard fallback error:', fallbackErr)
      res.status(500).json({ message: 'Failed to fetch leaderboard' })
    }
  }
}
