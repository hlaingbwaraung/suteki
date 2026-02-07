const User = require('./User')
const Category = require('./Category')
const Business = require('./Business')
const SavedBusiness = require('./SavedBusiness')
const Blog = require('./Blog')
const Coupon = require('./Coupon')
const QuizScore = require('./QuizScore')
const UserCoupon = require('./UserCoupon')

// Define associations
Category.hasMany(Business, {
  foreignKey: 'category_id',
  as: 'businesses'
})

Business.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
})

User.belongsToMany(Business, {
  through: SavedBusiness,
  foreignKey: 'user_id',
  otherKey: 'business_id',
  as: 'savedBusinesses'
})

Business.belongsToMany(User, {
  through: SavedBusiness,
  foreignKey: 'business_id',
  otherKey: 'user_id',
  as: 'savedByUsers'
})

// Direct associations for SavedBusiness
SavedBusiness.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

SavedBusiness.belongsTo(Business, {
  foreignKey: 'business_id',
  as: 'business'
})

// Blog associations
Blog.belongsTo(User, {
  foreignKey: 'author_id',
  as: 'author'
})

User.hasMany(Blog, {
  foreignKey: 'author_id',
  as: 'blogs'
})

// Business owner association
Business.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner'
})

User.hasMany(Business, {
  foreignKey: 'owner_id',
  as: 'ownedBusinesses'
})

// Coupon associations
Coupon.belongsTo(Business, {
  foreignKey: 'business_id',
  as: 'business'
})

Business.hasMany(Coupon, {
  foreignKey: 'business_id',
  as: 'coupons'
})

// Quiz score associations
QuizScore.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

User.hasMany(QuizScore, {
  foreignKey: 'user_id',
  as: 'quizScores'
})

// UserCoupon associations
UserCoupon.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
})

UserCoupon.belongsTo(Coupon, {
  foreignKey: 'coupon_id',
  as: 'coupon'
})

User.hasMany(UserCoupon, {
  foreignKey: 'user_id',
  as: 'redeemedCoupons'
})

Coupon.hasMany(UserCoupon, {
  foreignKey: 'coupon_id',
  as: 'redemptions'
})

module.exports = {
  User,
  Category,
  Business,
  SavedBusiness,
  Blog,
  Coupon,
  QuizScore,
  UserCoupon
}
