import api from './api'

// Get shop owner dashboard stats
export const getOwnerStats = () => {
  return api.get('/shop-owner/stats')
}

// Get my businesses
export const getMyBusinesses = () => {
  return api.get('/shop-owner/businesses')
}

// Update my business
export const updateMyBusiness = (id, data) => {
  return api.put(`/shop-owner/businesses/${id}`, data)
}
