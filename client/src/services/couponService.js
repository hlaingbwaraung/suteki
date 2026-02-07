import api from './api'

// Public: get active coupons for a business
export const getBusinessCoupons = (businessId) => {
  return api.get(`/coupons/business/${businessId}`)
}

// Shop owner: get my coupons
export const getMyCoupons = () => {
  return api.get('/shop-owner/coupons')
}

// Create coupon
export const createCoupon = (couponData) => {
  return api.post('/shop-owner/coupons', couponData)
}

// Update coupon
export const updateCoupon = (id, couponData) => {
  return api.put(`/shop-owner/coupons/${id}`, couponData)
}

// Delete coupon
export const deleteCoupon = (id) => {
  return api.delete(`/shop-owner/coupons/${id}`)
}
