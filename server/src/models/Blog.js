const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
      len: { args: [3, 255], msg: 'Title must be between 3 and 255 characters' }
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Slug is required' }
    }
  },
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '📝'
  },
  photo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category is required' },
      isIn: {
        args: [['Culture', 'Travel Tips', 'Food & Drink', 'Etiquette', 'Seasons', 'Practical']],
        msg: 'Invalid category'
      }
    }
  },
  tag: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Tag is required' },
      isIn: {
        args: [['culture', 'travel', 'food', 'etiquette', 'seasons', 'practical']],
        msg: 'Invalid tag'
      }
    }
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Excerpt is required' },
      len: { args: [10, 500], msg: 'Excerpt must be between 10 and 500 characters' }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Content is required' }
    }
  },
  read_time: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '5 min read'
  },
  author_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'blogs',
  underscored: true,
  timestamps: true
})

// Helper method to generate slug from title
Blog.generateSlug = function(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

module.exports = Blog
