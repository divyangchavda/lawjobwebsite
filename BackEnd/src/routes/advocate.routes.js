import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Advocate from '../models/advocate.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// @route   GET /api/advocates/profile
// @desc    Get advocate profile
// @access  Private
router.get('/profile', protect, authorize('advocate'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const advocate = await Advocate.findOne({ user: req.user._id });
    
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate profile not found' });
    }

    res.json({
      ...user.toObject(),
      barCouncilId: advocate.barCouncilId,
      specialization: advocate.specialization,
      experience: advocate.experience,
      fees: advocate.fees,
      bio: advocate.bio,
      lawDegree: advocate.lawDegree
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/advocates/all
// @desc    Get all advocates without pagination
// @access  Public
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all advocates');
    
    const advocates = await Advocate.find()
      .populate({
        path: 'user',
        select: 'firstName lastName email'
      })
      .select('-password')
      .sort({ rating: -1 });

    console.log(`Found ${advocates.length} advocates`);

    // Get unique locations and specializations
    const locations = [...new Set(advocates.map(adv => adv.location).filter(Boolean))];
    const specializations = [...new Set(advocates.map(adv => adv.specialization).filter(Boolean))];

    res.json({
      advocates,
      filters: {
        locations,
        specializations
      },
      total: advocates.length
    });
  } catch (error) {
    console.error('Error fetching all advocates:', error);
    res.status(500).json({ 
      message: 'Failed to fetch advocates',
      error: error.message 
    });
  }
});

// @route   GET /api/advocates/search
// @desc    Search advocates with filters and pagination
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const {
      search,
      location,
      specialization,
      minFee,
      maxFee,
      minRating,
      available,
      verified,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Text search across multiple fields
    if (search) {
      query.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply filters
    if (location) query.location = { $regex: location, $options: 'i' };
    if (specialization) query.specialization = specialization;
    if (minFee || maxFee) {
      query.fees = {};
      if (minFee) query.fees.$gte = Number(minFee);
      if (maxFee) query.fees.$lte = Number(maxFee);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (available !== undefined) query.available = available === 'true';
    if (verified !== undefined) query.verified = verified === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const advocates = await Advocate.find(query)
      .populate({
        path: 'user',
        select: 'firstName lastName email'
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Advocate.countDocuments(query);

    // Get unique locations and specializations for filters
    const locations = await Advocate.distinct('location');
    const specializations = await Advocate.distinct('specialization');

    res.json({
      advocates,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        perPage: Number(limit)
      },
      filters: {
        locations,
        specializations
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/advocates/:id
// @desc    Get advocate by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const advocate = await Advocate.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('reviews.user', 'firstName lastName');

    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }

    res.json(advocate);
  } catch (error) {
    console.error('Error fetching advocate:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/advocates/profile
// @desc    Update advocate profile
// @access  Private
router.put('/profile', protect, authorize('advocate'), async (req, res) => {
  try {
    const advocate = await Advocate.findOne({ user: req.user._id });
    if (!advocate) {
      return res.status(404).json({ message: 'Advocate profile not found' });
    }

    const { specialization, experience, fees, bio } = req.body;

    advocate.specialization = specialization || advocate.specialization;
    advocate.experience = experience || advocate.experience;
    advocate.fees = fees || advocate.fees;
    advocate.bio = bio || advocate.bio;

    const updatedAdvocate = await advocate.save();
    res.json(updatedAdvocate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/advocates/:id/reviews
// @desc    Add review for an advocate
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const advocate = await Advocate.findById(req.params.id);

    if (!advocate) {
      return res.status(404).json({ message: 'Advocate not found' });
    }

    // Check if user has already reviewed
    const hasReviewed = advocate.reviews.some(
      review => review.user.toString() === req.user._id.toString()
    );

    if (hasReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this advocate' });
    }

    const review = {
      user: req.user._id,
      rating,
      comment
    };

    advocate.reviews.push(review);
    await advocate.save();

    res.status(201).json({ message: 'Review added successfully', advocate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 