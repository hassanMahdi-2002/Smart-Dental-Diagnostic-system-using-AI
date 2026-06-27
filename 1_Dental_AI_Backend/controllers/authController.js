const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

//1. Validation rules for registration and login
exports.registerValidation = [
  check('name', 'Please enter your name').not().isEmpty(),
  check('email', 'Please enter a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  check('phone', 'Phone number is required').not().isEmpty()
];
exports.loginValidation = [
  check('email', 'Please enter a valid email').isEmail(),
  check('password', 'Password is required').exists()
];
// 2. Register Controller
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { name, email, password, phone, age, gender, address, medical_history } = req.body;
    
    const existingUser = await Patient.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with the same email or phone number' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const nameArray = name.trim().split(/\s+/); 
    const nameObject = {
        first: nameArray[0],
        mid: nameArray.length > 2 ? nameArray.slice(1, -1).join(' ') : undefined, 
        last: nameArray.length > 1 ? nameArray[nameArray.length - 1] : nameArray[0] 
    };
    
    const newPatient = new Patient({
      name: nameObject,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      address,
      medical_history
    });
    await newPatient.save();
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error("Register Error:", error);
    next(error);
  }
};

//3. Login Controller  
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { email, password } = req.body;
    // Check User
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    // Check Password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    // Generate Token 
    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: patient._id,
        name: `${patient.name.first} ${patient.name.last}`,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        address: patient.address,
        medical_history: patient.medical_history,
        registeredAt: patient.registeredAt
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    next(error);
  }
};
// 4. Update Profile Controllers
exports.updateProfile = async (req, res, next) => {
    try {
        const { phone, age, address, medical_history } = req.body;
        let updateFields = {};
        if (phone) updateFields.phone = phone;
        if (age) updateFields.age = age;
        if (address) updateFields.address = address;
        if (medical_history) updateFields.medical_history = medical_history;

        const updatedPatient = await Patient.findByIdAndUpdate
        (req.user._id,
            {$set: updateFields},
            {new: true, runValidators: true} 
        ).select('-password'); 
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedPatient._id,
                name: `${updatedPatient.name.first} ${updatedPatient.name.last}`,
                phone: updatedPatient.phone,
                age: updatedPatient.age,
                address: updatedPatient.address,
                medical_history: updatedPatient.medical_history
            }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        next(error);
    }
};
// 5. Get Profile Controller
exports.getProfile = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: `${req.user.name.first} ${req.user.name.last}`,
                email: req.user.email,
                phone: req.user.phone,
                age: req.user.age,
                address: req.user.address,
                medical_history: req.user.medical_history,
                registeredAt: req.user.registeredAt
            }
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        next(error);
    }
};