import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const advocateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    enum: ['Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law', 'Property Law', 'Tax Law', 'Labor Law', 'Constitutional Law']
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  fees: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  available: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  cases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }],
  courtLocations: [{
    type: String,
    required: true
  }],
  languages: [{
    type: String,
    required: true
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  barCouncilNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  totalCases: {
    type: Number,
    default: 0
  },
  wonCases: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate average rating when reviews are modified
advocateSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = totalRating / this.reviews.length;
  }
  next();
});

advocateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

advocateSchema.methods.comparePassword = async function(candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

const Advocate = mongoose.model('Advocate', advocateSchema);

export default Advocate; 