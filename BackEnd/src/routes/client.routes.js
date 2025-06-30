import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import Client from '../models/client.model.js';
import User from '../models/user.model.js';

const router = express.Router();

// Debug route
router.get('/test', async (req, res) => {
  try {
    // Count total clients
    const totalClients = await Client.countDocuments();
    
    // Get all clients with their data
    const clients = await Client.find()
      .populate('user', 'firstName lastName email')
      .populate('savedAdvocates')
      .limit(5);

    res.json({
      message: 'Database connection is working',
      totalClients,
      recentClients: clients
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      message: 'Database test failed',
      error: error.message
    });
  }
});

// @route   GET /api/clients
// @desc    Get all clients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const clients = await Client.find().populate('user', '-password');
    res.json(clients);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('user', '-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client profile
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Ensure user can only update their own profile
    if (client.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('user', '-password');

    res.json(updatedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/clients/stats/:clientId
// @desc    Get client stats
// @access  Private
router.get('/stats/:clientId', protect, async (req, res) => {
  try {
    console.log('Fetching stats for client:', req.params.clientId);
    console.log('User from token:', req.user);

    // First, try to find the client
    let client = await Client.findOne({ user: req.params.clientId });
    console.log('Found client:', client);

    // If client doesn't exist, create one with default values
    if (!client) {
      console.log('Client not found, creating new client');
      client = await Client.create({
        user: req.params.clientId,
        activeCases: [],
        completedCases: [],
        savedAdvocates: []
      });
      console.log('Created new client:', client);
    }

    // Get client stats with actual database queries
    const stats = {
      activeCases: await Client.countDocuments({ 
        user: req.params.clientId,
        'activeCases.0': { $exists: true } 
      }),
      completedCases: await Client.countDocuments({ 
        user: req.params.clientId,
        'completedCases.0': { $exists: true } 
      }),
      savedAdvocates: await Client.countDocuments({ 
        user: req.params.clientId,
        'savedAdvocates.0': { $exists: true } 
      })
    };

    console.log('Calculated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error in /stats/:clientId:', error);
    res.status(500).json({ 
      message: 'Error fetching client stats',
      error: error.message 
    });
  }
});

// @route   GET /api/clients/cases/:clientId
// @desc    Get client cases
// @access  Private
router.get('/cases/:clientId', protect, async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.params.clientId })
      .populate('activeCases')
      .populate('completedCases');
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({
      activeCases: client.activeCases || [],
      completedCases: client.completedCases || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/clients/save-advocate/:advocateId
// @desc    Save an advocate
// @access  Private
router.post('/save-advocate/:advocateId', protect, async (req, res) => {
  try {
    let client = await Client.findOne({ user: req.user._id });

    if (!client) {
      client = await Client.create({
        user: req.user._id,
        savedAdvocates: [req.params.advocateId]
      });
    } else {
      if (client.savedAdvocates?.includes(req.params.advocateId)) {
        return res.status(400).json({ message: 'Advocate already saved' });
      }
      client.savedAdvocates = [...(client.savedAdvocates || []), req.params.advocateId];
      await client.save();
    }

    res.json({ message: 'Advocate saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/clients/saved-advocate/:advocateId
// @desc    Remove a saved advocate
// @access  Private
router.delete('/saved-advocate/:advocateId', protect, async (req, res) => {
  try {
    const client = await Client.findOne({ user: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.savedAdvocates = client.savedAdvocates?.filter(
      id => id.toString() !== req.params.advocateId
    );
    await client.save();

    res.json({ message: 'Advocate removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 