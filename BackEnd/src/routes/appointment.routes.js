import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Appointment from '../models/appointment.model.js';

const router = express.Router();

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { advocateId, date, time, type } = req.body;

    const appointment = await Appointment.create({
      client: req.user._id,
      advocate: advocateId,
      date,
      time,
      type
    });

    await appointment.populate('advocate', 'user');
    await appointment.populate('client', 'firstName lastName email');

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/appointments/advocate/:advocateId
// @desc    Get advocate's appointments
// @access  Private
router.get('/advocate/:advocateId', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ advocate: req.params.advocateId })
      .populate('client', 'firstName lastName email')
      .populate('advocate', 'user')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get advocate appointments error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/appointments/client/:clientId
// @desc    Get client's appointments
// @access  Private
router.get('/client/:clientId', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find({ client: req.params.clientId })
      .populate('advocate', 'user')
      .populate('client', 'firstName lastName email')
      .sort({ date: 1, time: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get client appointments error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router; 