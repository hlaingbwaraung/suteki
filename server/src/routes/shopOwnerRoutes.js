const express = require('express')
const router = express.Router()
const shopOwnerController = require('../controllers/shopOwnerController')
const couponController = require('../controllers/couponController')
const { authenticate } = require('../middleware/auth')

// All shop owner routes require authentication
router.use(authenticate)

// Dashboard stats
router.get('/stats', shopOwnerController.getDashboardStats)

// My businesses
router.get('/businesses', shopOwnerController.getMyBusinesses)
router.put('/businesses/:id', shopOwnerController.updateMyBusiness)

// My coupons
router.get('/coupons', couponController.getOwnerCoupons)
router.post('/coupons', couponController.createCoupon)
router.put('/coupons/:id', couponController.updateCoupon)
router.delete('/coupons/:id', couponController.deleteCoupon)

module.exports = router
