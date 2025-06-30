import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Intern from '../models/intern.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// @route   GET /api/interns/profile
// @desc    Get intern profile
// @access  Private
router.get('/profile', protect, authorize('intern'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const intern = await Intern.findOne({ user: req.user._id });
    
    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }

    res.json({
      ...user.toObject(),
      schoolName: intern.schoolName,
      currentYear: intern.currentYear,
      interests: intern.interests,
      skills: intern.skills,
      studentId: intern.studentId,
      resume: intern.resume
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/interns
// @desc    Get all interns
// @access  Public
router.get('/', async (req, res) => {
  try {
    const interns = await Intern.find().populate('user', '-password');
    res.json(interns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/interns/:id
// @desc    Get intern by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const intern = await Intern.findById(req.params.id).populate('user', '-password');
    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }
    res.json(intern);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/interns/profile
// @desc    Update intern profile
// @access  Private
router.put('/profile', protect, authorize('intern'), async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }

    const { schoolName, currentYear, interests, skills } = req.body;

    intern.schoolName = schoolName || intern.schoolName;
    intern.currentYear = currentYear || intern.currentYear;
    intern.interests = interests || intern.interests;
    intern.skills = skills || intern.skills;

    const updatedIntern = await intern.save();
    res.json(updatedIntern);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/interns/:id/achievements
// @desc    Add achievement for intern
// @access  Private
router.post('/achievements', protect, authorize('intern'), async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }

    const { title, description, date } = req.body;
    intern.achievements.push({ title, description, date: new Date(date) });
    await intern.save();

    res.status(201).json({ message: 'Achievement added' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/interns/:id/certifications
// @desc    Add certification for intern
// @access  Private
router.post('/certifications', protect, authorize('intern'), async (req, res) => {
  try {
    const intern = await Intern.findOne({ user: req.user._id });
    if (!intern) {
      return res.status(404).json({ message: 'Intern profile not found' });
    }

    const { name, issuer, date, url } = req.body;
    intern.certifications.push({ name, issuer, date: new Date(date), url });
    await intern.save();

    res.status(201).json({ message: 'Certification added' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 