const mongoose = require('mongoose');
const MedicalReportSchema = new mongoose.Schema({
    diagnosisId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Diagnosis',
        required: true,
        unique: true 
    },
    advice_text: { 
        type: String, 
        required: true 
    },
    action_plan: { 
        type: String 
    }, 
    specialist: { 
        type: String 
    },
    urgency_level: { 
        type: String, 
        enum: ['Normal', 'Critical', 'Follow-up'], 
        default: 'Normal' 
    },
    language: { 
        type: String, 
        default: 'en' 
    },
}, { 
  timestamps: true // ستقوم بإنشاء createdAt (بدلاً من generatedAt) و updatedAt تلقائياً
});

module.exports = mongoose.model('MedicalReport', MedicalReportSchema);