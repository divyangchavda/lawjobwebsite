import User from '../models/user.model.js';
import Advocate from '../models/advocate.model.js';
import Intern from '../models/intern.model.js';
import Client from '../models/client.model.js';
import { generateAccessToken, generateRefreshToken, setTokenCookie, verifyRefreshToken } from '../utils/token.utils.js';
import { deleteFile, validateFileType } from '../utils/file.utils.js';
import { sanitizeUser } from '../utils/sanitize.utils.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const files = req.files || {};
    
    // Validate required fields
    const {
      firstName,
      lastName,
      email,
      password,
      mobile,
      address,
      city,
      state,
      pincode,
      idType,
      userType,
      // Role specific fields are destructured based on userType
      ...roleSpecificData
    } = req.body;

    if (!email || !password || !firstName || !lastName || !userType) {
      throw new Error('Please fill all required fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      // Clean up any uploaded files
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => deleteFile(file.path));
      });
      throw new Error('User already exists');
    }

    // Validate and process files
    const processedFiles = {};
    try {
      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray[0]) {
          const file = fileArray[0];
          if (!validateFileType(file, ['image/jpeg', 'image/png', 'application/pdf'])) {
            throw new Error(`Invalid file type for ${fieldName}`);
          }
          processedFiles[fieldName] = file.path.replace(/\\/g, '/');
        }
      }
    } catch (error) {
      // Clean up files on validation error
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => deleteFile(file.path));
      });
      throw error;
    }

    // Create base user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      mobile,
      address,
      city,
      state,
      pincode,
      idType,
      userType: userType.toLowerCase(),
      idProofFront: processedFiles.idProofFront,
      idProofBack: processedFiles.idProofBack
    });

    // Create role-specific profile
    let roleData = null;
    try {
      if (userType.toLowerCase() === 'advocate') {
        roleData = await Advocate.create({
          user: user._id,
          ...roleSpecificData,
          lawDegree: processedFiles.lawDegree
        });
      } else if (userType.toLowerCase() === 'intern') {
        roleData = await Intern.create({
          user: user._id,
          ...roleSpecificData,
          studentId: processedFiles.studentId,
          resume: processedFiles.resume
        });
      } else if (userType.toLowerCase() === 'client') {
        roleData = await Client.create({
          user: user._id,
          ...roleSpecificData
        });
      }
    } catch (error) {
      // If role creation fails, delete user and clean up files
      await User.findByIdAndDelete(user._id);
      Object.values(processedFiles).forEach(filePath => deleteFile(filePath));
      throw error;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set cookies
    setTokenCookie(res, accessToken, 'access');
    setTokenCookie(res, refreshToken, 'refresh');

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: sanitizeUser({ ...user.toObject(), ...roleData?.toObject() })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      throw new Error('Please provide email and password');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    // Verify role if provided
    if (role && user.userType.toLowerCase() !== role.toLowerCase()) {
      throw new Error(`Invalid role. You are registered as a ${user.userType}`);
    }

    // Get role-specific data
    let roleData = null;
    if (user.userType === 'advocate') {
      roleData = await Advocate.findOne({ user: user._id });
    } else if (user.userType === 'intern') {
      roleData = await Intern.findOne({ user: user._id });
    } else if (user.userType === 'client') {
      roleData = await Client.findOne({ user: user._id });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set cookies
    setTokenCookie(res, accessToken, 'access');
    setTokenCookie(res, refreshToken, 'refresh');

    // Send response
    res.json({
      success: true,
      user: sanitizeUser({ ...user.toObject(), ...roleData?.toObject() })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      throw new Error('No refresh token provided');
    }

    const { valid, expired, decoded } = verifyRefreshToken(refresh_token);

    if (!valid) {
      throw new Error('Invalid refresh token');
    }

    if (expired) {
      throw new Error('Refresh token expired');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Set new cookies
    setTokenCookie(res, accessToken, 'access');
    setTokenCookie(res, newRefreshToken, 'refresh');

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  res.cookie('access_token', '', { maxAge: 0 });
  res.cookie('refresh_token', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new Error('User not found');
    }

    // Get role-specific data
    let roleData = null;
    if (user.userType === 'advocate') {
      roleData = await Advocate.findOne({ user: user._id });
    } else if (user.userType === 'intern') {
      roleData = await Intern.findOne({ user: user._id });
    } else if (user.userType === 'client') {
      roleData = await Client.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: sanitizeUser({ ...user.toObject(), ...roleData?.toObject() })
    });
  } catch (error) {
    next(error);
  }
}; 