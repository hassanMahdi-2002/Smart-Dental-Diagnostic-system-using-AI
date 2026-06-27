const mongoose = require('mongoose');
const ChatSessionSchema = new mongoose.Schema({
    diagnosisId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Diagnosis',
        required: true,
        unique: true ,
        index: true
    },
    messages: [
        {
            role: { 
                type: String, 
                enum: ['user', 'model'], 
                required: true 
            },
            content: { 
                type: String, 
                required: true 
            },
            timestamp: { 
                type: Date, 
                default: Date.now 
            }
        }
    ]
}, { 
  timestamps: true // هذه الخاصية تغنينا تماماً عن دالة ChatSessionSchema.pre('save')
});

// ChatSessionSchema.pre('save', function() {
//     this.lastUpdated = Date.now();
// });
module.exports = mongoose.model('ChatSession', ChatSessionSchema);