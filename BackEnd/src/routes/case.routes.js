import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Case from '../models/case.model.js';
import User from '../models/user.model.js';
import Advocate from '../models/advocate.model.js';
import { deleteFile, validateFileType } from '../utils/file.utils.js';

const router = express.Router();

// Configure multer for case documents
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsPath = path.join(process.cwd(), 'uploads', 'case-documents');
    fs.mkdirSync(uploadsPath, { recursive: true });
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `case-doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for case documents
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file, ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word documents, and images are allowed.'), false);
    }
  }
});

// @route   POST /api/cases
// @desc    Create a new case
// @access  Private (Client only)
router.post('/', protect, authorize('client'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      priority,
      courtName,
      courtLevel,
      expectedDuration,
      consultationFee,
      totalFee,
      nextHearingDate,
      deadlineDate,
      tags,
      notes
    } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    // Create new case
    const newCase = new Case({
      title,
      description,
      clientId: req.user._id,
      category,
      subCategory,
      priority: priority || 'medium',
      courtName,
      courtLevel,
      expectedDuration,
      consultationFee: consultationFee || 0,
      totalFee: totalFee || 0,
      nextHearingDate: nextHearingDate ? new Date(nextHearingDate) : null,
      deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
      tags: tags || [],
      notes
    });

    // Add initial timeline update
    newCase.timeline.push({
      description: 'Case created and submitted for review',
      updatedBy: req.user._id,
      updatedByRole: 'client',
      updateType: 'other',
      metadata: {
        action: 'case_created'
      }
    });

    const savedCase = await newCase.save();
    await savedCase.populate('clientId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Case created successfully',
      data: savedCase
    });
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case',
      error: error.message
    });
  }
});

// @route   GET /api/cases
// @desc    Get all cases with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      clientId,
      advocateId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query based on user role
    let query = {};
    
    // Role-based filtering
    if (req.user.userType === 'client') {
      query.clientId = req.user._id;
    } else if (req.user.userType === 'advocate') {
      query.advocateId = req.user._id;
    } else if (req.user.userType === 'intern') {
      query.internIds = req.user._id;
    }

    // Additional filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (clientId && req.user.userType !== 'client') query.clientId = clientId;
    if (advocateId && req.user.userType !== 'advocate') query.advocateId = advocateId;

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { caseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const cases = await Case.find(query)
      .populate('clientId', 'firstName lastName email')
      .populate('advocateId', 'firstName lastName email')
      .populate('internIds', 'firstName lastName email')
      .populate('timeline.updatedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Case.countDocuments(query);

    res.json({
      success: true,
      data: cases,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        perPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cases',
      error: error.message
    });
  }
});

// @route   GET /api/cases/:id
// @desc    Get a specific case by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id)
      .populate('clientId', 'firstName lastName email mobile')
      .populate('advocateId', 'firstName lastName email mobile')
      .populate('internIds', 'firstName lastName email')
      .populate('timeline.updatedBy', 'firstName lastName')
      .populate('documents.uploadedBy', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user has access to this case
    const hasAccess = (
      caseData.clientId._id.toString() === req.user._id.toString() ||
      caseData.advocateId?._id.toString() === req.user._id.toString() ||
      caseData.internIds.some(intern => intern._id.toString() === req.user._id.toString()) ||
      req.user.userType === 'admin'
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: caseData
    });
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case',
      error: error.message
    });
  }
});

// @route   PUT /api/cases/:id
// @desc    Update a case
// @access  Private (Client or Advocate)
router.put('/:id', protect, async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    const canUpdate = (
      caseData.clientId.toString() === req.user._id.toString() ||
      caseData.advocateId?.toString() === req.user._id.toString()
    );

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      priority,
      courtName,
      courtLevel,
      expectedDuration,
      consultationFee,
      totalFee,
      nextHearingDate,
      deadlineDate,
      tags,
      notes
    } = req.body;

    // Update fields
    if (title) caseData.title = title;
    if (description) caseData.description = description;
    if (priority) caseData.priority = priority;
    if (courtName) caseData.courtName = courtName;
    if (courtLevel) caseData.courtLevel = courtLevel;
    if (expectedDuration) caseData.expectedDuration = expectedDuration;
    if (consultationFee !== undefined) caseData.consultationFee = consultationFee;
    if (totalFee !== undefined) caseData.totalFee = totalFee;
    if (nextHearingDate) caseData.nextHearingDate = new Date(nextHearingDate);
    if (deadlineDate) caseData.deadlineDate = new Date(deadlineDate);
    if (tags) caseData.tags = tags;
    if (notes) caseData.notes = notes;

    // Add timeline update
    caseData.timeline.push({
      description: 'Case details updated',
      updatedBy: req.user._id,
      updatedByRole: req.user.userType,
      updateType: 'other',
      metadata: {
        action: 'case_updated'
      }
    });

    const updatedCase = await caseData.save();
    await updatedCase.populate('clientId', 'firstName lastName email');
    await updatedCase.populate('advocateId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Case updated successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case',
      error: error.message
    });
  }
});

// @route   PUT /api/cases/:id/assign
// @desc    Assign advocate to case
// @access  Private (Client or Admin)
router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { advocateId } = req.body;
    
    if (!advocateId) {
      return res.status(400).json({
        success: false,
        message: 'Advocate ID is required'
      });
    }

    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    const canAssign = (
      caseData.clientId.toString() === req.user._id.toString() ||
      req.user.userType === 'admin'
    );

    if (!canAssign) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify advocate exists
    const advocate = await User.findById(advocateId);
    if (!advocate || advocate.userType !== 'advocate') {
      return res.status(400).json({
        success: false,
        message: 'Invalid advocate ID'
      });
    }

    // Assign advocate and update status
    await caseData.assignAdvocate(advocateId, req.user._id, req.user.userType);
    
    if (caseData.status === 'open') {
      caseData.status = 'in-progress';
    }

    const updatedCase = await caseData.save();
    await updatedCase.populate('clientId', 'firstName lastName email');
    await updatedCase.populate('advocateId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Advocate assigned successfully',
      data: updatedCase
    });
  } catch (error) {
    console.error('Assign advocate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign advocate',
      error: error.message
    });
  }
});

// @route   PUT /api/cases/:id/status
// @desc    Update case status
// @access  Private (Client or Advocate)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    const canUpdate = (
      caseData.clientId.toString() === req.user._id.toString() ||
      caseData.advocateId?.toString() === req.user._id.toString()
    );

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update status with timeline
    await caseData.updateStatus(status, req.user._id, req.user.userType, reason);
    
    await caseData.populate('clientId', 'firstName lastName email');
    await caseData.populate('advocateId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Case status updated successfully',
      data: caseData
    });
  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case status',
      error: error.message
    });
  }
});

// @route   POST /api/cases/:id/timeline
// @desc    Add timeline update to case
// @access  Private (Client, Advocate, or Intern)
router.post('/:id/timeline', protect, async (req, res) => {
  try {
    const { description, updateType, metadata } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    const hasAccess = (
      caseData.clientId.toString() === req.user._id.toString() ||
      caseData.advocateId?.toString() === req.user._id.toString() ||
      caseData.internIds.some(intern => intern.toString() === req.user._id.toString())
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add timeline update
    await caseData.addTimelineUpdate(
      description,
      req.user._id,
      req.user.userType,
      updateType || 'comment',
      metadata || {}
    );

    await caseData.populate('timeline.updatedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Timeline updated successfully',
      data: caseData.timeline[caseData.timeline.length - 1]
    });
  } catch (error) {
    console.error('Add timeline update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add timeline update',
      error: error.message
    });
  }
});

// @route   POST /api/cases/:id/documents
// @desc    Upload document to case
// @access  Private (Client, Advocate, or Intern)
router.post('/:id/documents', protect, upload.single('document'), async (req, res) => {
  try {
    const { type, tags, isConfidential } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required'
      });
    }

    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      // Clean up uploaded file
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check permissions
    const hasAccess = (
      caseData.clientId.toString() === req.user._id.toString() ||
      caseData.advocateId?.toString() === req.user._id.toString() ||
      caseData.internIds.some(intern => intern.toString() === req.user._id.toString())
    );

    if (!hasAccess) {
      // Clean up uploaded file
      if (req.file) deleteFile(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add document to case
    const documentData = {
      name: req.file.originalname,
      url: req.file.path.replace(/\\/g, '/'),
      type: type || 'other',
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedByRole: req.user.userType,
      isConfidential: isConfidential === 'true',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    await caseData.addDocument(documentData);

    // Add timeline update
    await caseData.addTimelineUpdate(
      `Document "${req.file.originalname}" uploaded`,
      req.user._id,
      req.user.userType,
      'document_upload',
      { documentName: req.file.originalname, documentType: type || 'other' }
    );

    await caseData.populate('documents.uploadedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: caseData.documents[caseData.documents.length - 1]
    });
  } catch (error) {
    console.error('Upload document error:', error);
    // Clean up uploaded file on error
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// @route   GET /api/cases/client/:clientId
// @desc    Get cases for a specific client
// @access  Private
router.get('/client/:clientId', protect, async (req, res) => {
  try {
    // Check if user can access this client's cases
    const canAccess = (
      req.user._id.toString() === req.params.clientId ||
      req.user.userType === 'admin'
    );

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const cases = await Case.find({ clientId: req.params.clientId })
      .populate('advocateId', 'firstName lastName email')
      .populate('internIds', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    console.error('Get client cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client cases',
      error: error.message
    });
  }
});

// @route   GET /api/cases/advocate/:advocateId
// @desc    Get cases for a specific advocate
// @access  Private
router.get('/advocate/:advocateId', protect, async (req, res) => {
  try {
    // Check if user can access this advocate's cases
    const canAccess = (
      req.user._id.toString() === req.params.advocateId ||
      req.user.userType === 'admin'
    );

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const cases = await Case.find({ advocateId: req.params.advocateId })
      .populate('clientId', 'firstName lastName email')
      .populate('internIds', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cases
    });
  } catch (error) {
    console.error('Get advocate cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve advocate cases',
      error: error.message
    });
  }
});

// @route   GET /api/cases/stats/overview
// @desc    Get case statistics overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    let filter = {};
    
    // Apply role-based filtering
    if (req.user.userType === 'client') {
      filter.clientId = req.user._id;
    } else if (req.user.userType === 'advocate') {
      filter.advocateId = req.user._id;
    } else if (req.user.userType === 'intern') {
      filter.internIds = req.user._id;
    }

    const stats = await Case.getStatistics(filter);
    const totalCases = await Case.countDocuments(filter);
    
    // Get additional stats
    const averageAge = await Case.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgAge: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalCases,
        statusBreakdown: stats,
        averageAge: averageAge[0]?.avgAge || 0
      }
    });
  } catch (error) {
    console.error('Get case stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case statistics',
      error: error.message
    });
  }
});

// @route   DELETE /api/cases/:id
// @desc    Delete a case (soft delete)
// @access  Private (Client only)
router.delete('/:id', protect, authorize('client'), async (req, res) => {
  try {
    const caseData = await Case.findById(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Check if user owns this case
    if (caseData.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete - mark as inactive
    caseData.isActive = false;
    caseData.status = 'cancelled';
    
    // Add timeline update
    await caseData.addTimelineUpdate(
      'Case cancelled by client',
      req.user._id,
      req.user.userType,
      'status_change',
      { action: 'case_cancelled' }
    );

    await caseData.save();

    res.json({
      success: true,
      message: 'Case cancelled successfully'
    });
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel case',
      error: error.message
    });
  }
});

export default router; 