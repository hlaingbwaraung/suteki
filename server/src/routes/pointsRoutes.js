const express = require('express')
const router = express.Router()
const pointsController = require('../controllers/pointsController')
const { authenticate } = require('../middleware/auth')

// All routes require authentication
router.get('/me', authenticate, pointsController.getMyPoints)
router.get('/shop', authenticate, pointsController.getPointsShop)
router.post('/redeem', authenticate, pointsController.redeemCoupon)
router.get('/my-coupons', authenticate, pointsController.getMyCoupons)
router.post('/use-coupon/:id', authenticate, pointsController.useCoupon)

module.exports = router
