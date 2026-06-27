const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    first: { type: String, required: true },
    mid: { type: String }, 
    last: { type: String, required: true }
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  age: { 
    type: Number, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female'], 
    required: true 
  },
  address: {
    city: { type: String },
    street: { type: String },
    gov: { type: String }
  },
  medical_history: [{
     type: String 
    }], 
}, { 
  timestamps: true // ستقوم بإنشاء createdAt (بدلاً من registeredAt) و updatedAt تلقائياً
});

module.exports = mongoose.model('Patient', patientSchema);