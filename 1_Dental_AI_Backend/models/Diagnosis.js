const mongoose = require('mongoose');
const DiagnosisSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    imagePath: { 
        type: String, 
        required: true 
    },
    ai_analysis: {
        type: Object, 
        required: true
    },
    confidence_score: { 
        type: Number 
    }, 
    doctor_validation: { 
        type: Boolean, 
        default: null 
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Reviewed'],
        default: 'Completed'
    },
    diagnosisDate: { 
        type: Date, 
        default: Date.now 
    }
}, { 
  timestamps: true // ستقوم بإنشاء createdAt (بدلاً من diagnosisDate) و updatedAt تلقائياً
});
module.exports = mongoose.model('Diagnosis', DiagnosisSchema);