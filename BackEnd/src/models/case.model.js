import mongoose from 'mongoose';

const timelineUpdateSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedByRole: {
    type: String,
    enum: ['client', 'advocate', 'intern', 'system'],
    required: true
  },
  updateType: {
    type: String,
    enum: ['status_change', 'assignment', 'document_upload', 'comment', 'meeting', 'hearing', 'other'],
    default: 'other'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['contract', 'evidence', 'court_order', 'petition', 'affidavit', 'correspondence', 'other'],
    default: 'other'
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByRole: {
    type: String,
    enum: ['client', 'advocate', 'intern'],
    required: true
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  caseNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advocateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  internIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['open', 'in-progress', 'closed', 'on-hold', 'cancelled'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['Criminal Law', 'Civil Law', 'Corporate Law', 'Family Law', 'Property Law', 'Tax Law', 'Labor Law', 'Constitutional Law'],
    required: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  courtName: {
    type: String,
    trim: true
  },
  courtLevel: {
    type: String,
    enum: ['District Court', 'High Court', 'Supreme Court', 'Tribunal', 'Other'],
    default: 'District Court'
  },
  expectedDuration: {
    type: Number, // in months
    min: 1,
    max: 120
  },
  consultationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  totalFee: {
    type: Number,
    min: 0,
    default: 0
  },
  paidAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  nextHearingDate: {
    type: Date
  },
  deadlineDate: {
    type: Date
  },
  documents: [documentSchema],
  timeline: [timelineUpdateSchema],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  clientSatisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better performance
caseSchema.index({ clientId: 1, status: 1 });
caseSchema.index({ advocateId: 1, status: 1 });
caseSchema.index({ status: 1, priority: 1 });
caseSchema.index({ category: 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ 'timeline.createdAt': -1 });

// Virtual for case age in days
caseSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for progress percentage
caseSchema.virtual('progressPercentage').get(function() {
  if (this.status === 'closed') return 100;
  if (this.status === 'cancelled') return 0;
  if (this.status === 'in-progress') return 50;
  if (this.status === 'open') return 10;
  return 0;
});

// Pre-save middleware to generate case number
caseSchema.pre('save', async function(next) {
  if (this.isNew && !this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to add timeline update
caseSchema.methods.addTimelineUpdate = function(description, updatedBy, updatedByRole, updateType = 'other', metadata = {}) {
  this.timeline.push({
    description,
    updatedBy,
    updatedByRole,
    updateType,
    metadata
  });
  return this.save();
};

// Method to add document
caseSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  return this.save();
};

// Method to update status with timeline
caseSchema.methods.updateStatus = function(newStatus, updatedBy, updatedByRole, reason = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  const description = reason ? 
    `Status changed from ${oldStatus} to ${newStatus}. Reason: ${reason}` :
    `Status changed from ${oldStatus} to ${newStatus}`;
  
  this.timeline.push({
    description,
    updatedBy,
    updatedByRole,
    updateType: 'status_change',
    metadata: {
      oldStatus,
      newStatus,
      reason
    }
  });
  
  return this.save();
};

// Method to assign advocate
caseSchema.methods.assignAdvocate = function(advocateId, assignedBy, assignedByRole) {
  const oldAdvocateId = this.advocateId;
  this.advocateId = advocateId;
  
  const description = oldAdvocateId ? 
    `Advocate reassigned` : 
    `Advocate assigned to case`;
  
  this.timeline.push({
    description,
    updatedBy: assignedBy,
    updatedByRole: assignedByRole,
    updateType: 'assignment',
    metadata: {
      oldAdvocateId,
      newAdvocateId: advocateId
    }
  });
  
  return this.save();
};

// Static method to get case statistics
caseSchema.statics.getStatistics = async function(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgFee: { $avg: '$totalFee' },
        totalFee: { $sum: '$totalFee' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

const Case = mongoose.model('Case', caseSchema);

export default Case; 