/**
 * Auth controller  –  handles user registration, login, Google OAuth,
 * profile management, password changes, and premium activation.
 *
 * Exports: register, login, googleAuth, getCurrentUser,
 *          updateProfile, updatePassword, deleteAccount, activatePremium
 */
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const { User } = require('../models')

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, birthdate } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      birthdate: birthdate || null
    })

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin, is_shop_owner: user.is_shop_owner, is_premium: user.is_premium }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    })

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_shop_owner: user.is_shop_owner,
        is_premium: user.is_premium,
        premium_type: user.premium_type,
        points: user.points || 0
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
}

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check if user has a password (not a Google OAuth user)
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Please sign in with Google instead' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email, is_admin: user.is_admin, is_shop_owner: user.is_shop_owner, is_premium: user.is_premium }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_shop_owner: user.is_shop_owner,
        is_premium: user.is_premium,
        premium_type: user.premium_type,
        points: user.points || 0
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Google OAuth login
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' })
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID
    if (!googleClientId) {
      return res.status(500).json({ message: 'Google OAuth is not configured on the server' })
    }

    // Verify the Google ID token
    const client = new OAuth2Client(googleClientId)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture, email_verified } = payload

    if (!email) {
      return res.status(400).json({ message: 'Unable to get email from Google account' })
    }

    // Check if user exists by google_id or email
    let user = await User.findOne({ where: { google_id: googleId } })

    if (!user) {
      // Check if a user with same email exists (link accounts)
      user = await User.findOne({ where: { email } })

      if (user) {
        // Link existing email account with Google
        user.google_id = googleId
        if (!user.name && name) user.name = name
        if (email_verified) user.email_verified = true
        await user.save()
      } else {
        // Create new user
        user = await User.create({
          email,
          name: name || email.split('@')[0],
          google_id: googleId,
          email_verified: !!email_verified,
          password_hash: null
        })
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin, is_shop_owner: user.is_shop_owner, is_premium: user.is_premium },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    )

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_shop_owner: user.is_shop_owner,
        is_premium: user.is_premium,
        premium_type: user.premium_type,
        points: user.points || 0
      }
    })
  } catch (error) {
    console.error('Google auth error:', error)
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid or expired Google token. Please try again.' })
    }
    res.status(500).json({ message: 'Server error during Google authentication' })
  }
}

// Update profile (name and email)
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    const userId = req.user.id

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email is already in use' })
      }
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Update fields
    if (name) user.name = name
    if (email) user.email = email
    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_shop_owner: user.is_shop_owner
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Server error updating profile' })
  }
}

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    // Hash and save new password
    user.password_hash = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Update password error:', error)
    res.status(500).json({ message: 'Server error updating password' })
  }
}

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await user.destroy()

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ message: 'Server error deleting account' })
  }
}

// Activate premium
exports.activatePremium = async (req, res) => {
  try {
    const userId = req.user.id
    const { plan } = req.body // 'monthly' or 'lifetime'

    if (!['monthly', 'lifetime'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Choose monthly or lifetime.' })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.is_premium = true
    user.premium_type = plan

    if (plan === 'monthly') {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      user.premium_expires_at = expiresAt
    } else {
      user.premium_expires_at = null // Lifetime never expires
    }

    await user.save()

    // Return updated token with premium status
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin, is_shop_owner: user.is_shop_owner || false, is_premium: user.is_premium },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    res.json({
      message: 'Premium activated successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferred_language: user.preferred_language,
        is_admin: user.is_admin,
        is_shop_owner: user.is_shop_owner || false,
        is_premium: user.is_premium,
        premium_type: user.premium_type,
        premium_expires_at: user.premium_expires_at
      }
    })
  } catch (error) {
    console.error('Activate premium error:', error)
    res.status(500).json({ message: 'Server error activating premium' })
  }
}
