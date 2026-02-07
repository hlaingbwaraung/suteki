const express = require('express')
const router = express.Router()
const couponController = require('../controllers/couponController')
const { authenticate } = require('../middleware/auth')

// Public: get active coupons for a business
router.get('/business/:businessId', couponController.getBusinessCoupons)

// Admin: get all coupons
router.get('/admin/all', authenticate, couponController.getAllCoupons)

// Shop owner: get coupons for own businesses
router.get('/my', authenticate, couponController.getOwnerCoupons)

// Create / Update / Delete (admin or shop owner)
router.post('/', authenticate, couponController.createCoupon)
router.put('/:id', authenticate, couponController.updateCoupon)
router.delete('/:id', authenticate, couponController.deleteCoupon)

module.exports = router
