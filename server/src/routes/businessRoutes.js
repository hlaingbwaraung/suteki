const express = require('express')
const router = express.Router()
const businessController = require('../controllers/businessController')
const { authenticate } = require('../middleware/auth')

// Admin stats (before /:id to avoid matching "admin" as id)
router.get('/admin/stats', authenticate, businessController.getBusinessStats)

// Public routes
router.get('/', businessController.getAllBusinesses)
router.get('/:id', businessController.getBusinessById)

// Admin write routes
router.post('/', authenticate, businessController.createBusiness)
router.put('/:id', authenticate, businessController.updateBusiness)
router.delete('/:id', authenticate, businessController.deleteBusiness)
router.patch('/:id/toggle-active', authenticate, businessController.toggleBusinessActive)

module.exports = router
