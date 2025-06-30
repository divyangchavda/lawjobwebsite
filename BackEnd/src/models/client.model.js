import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activeCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }],
  completedCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }],
  savedAdvocates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advocate'
  }],
  occupation: {
    type: String,
    default: 'Not Specified'
  },
  companyName: {
    type: String,
    default: ''
  },
  preferredLanguages: {
    type: [String],
    default: ['English']
  },
  budget: {
    type: Number,
    default: 0
  },
  preferredLocation: {
    type: String,
    default: ''
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Client', clientSchema); 