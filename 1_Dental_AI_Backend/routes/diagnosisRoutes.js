const express = require('express');
const router = express.Router();

const diagnosisController = require('../controllers/diagnosisController');
const agentController = require('../controllers/agentController');

const upload = require('../middleware/upload'); 
const { protect } = require('../middleware/authMiddleware');

router.post('/predict', 
    protect, 
    upload.single('image'), 
    diagnosisController.createDiagnosis
);

router.get('/history', 
    protect, 
    diagnosisController.getPatientHistory
);


router.post('/agent-chat', 
    protect, 
    agentController.sendMessage
);

router.get('/agent-chat/:diagnosisId', 
    protect, 
    agentController.getChatHistory
);


router.get('/report/:id', 
    protect, 
    diagnosisController.getReport
);

router.route('/:id')
    .get(protect, diagnosisController.getSingleDiagnosis) // عرض تفاصيل التشخيص
    .delete(protect, diagnosisController.deleteDiagnosis); // حذف التشخيص

module.exports = router;