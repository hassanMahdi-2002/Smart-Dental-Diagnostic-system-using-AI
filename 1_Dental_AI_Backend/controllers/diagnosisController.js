const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const MedicalReport = require('../models/MedicalReport');
const ChatSession = require('../models/ChatSession');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fsPromises = require('fs').promises;

exports.createDiagnosis = async (req, res, next) => {
    try {
        console.log("New Protected Request Received...");
        if (!req.user) {
            return res.status(401).json({success: false, message: "User authentication failed."} );
        }
        const patient = req.user; 
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image found. Please upload a dental image." });
        }
        const imagePath = req.file.path;
        console.log(`Image saved locally at: ${imagePath} by User: ${patient.name.first}`);
        
        console.log("Sending request to AI Server...");
        const form = new FormData();
        form.append('file', fs.createReadStream(imagePath));
        
        const historyStr = patient.medical_history && patient.medical_history.length > 0 
                           ? patient.medical_history.join(', ') 
                           : (req.body.medical_history || "None");
                           
        form.append('medical_history', historyStr);

        let aiResult;
        let retries = 3; // عدد المحاولات
        let aiErrorDetails = null;

        while (retries > 0) {
            try {
                const aiResponse = await axios.post('http://localhost:8000/analyze', form, {
                    headers: { ...form.getHeaders() },
                    timeout: 90000 
                });
                aiResult = aiResponse.data;
                break; 
            } catch (error) {
                retries--;
                aiErrorDetails = error.response ? error.response.data : error.message;
                console.warn(`⚠️ AI Server request failed. Retries left: ${retries}`);
                
                if (retries === 0) {
                    console.error("❌ AI Server Error Exhausted:", JSON.stringify(aiErrorDetails, null, 2));
                    await fsPromises.unlink(imagePath).catch(err => console.error("Failed to delete unused image:", err));
                    return res.status(503).json({ 
                        success: false, 
                        message: "AI Engine is Offline or Unavailable after retries", 
                        details: aiErrorDetails 
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); 
            }
        }

        if (aiResult.error) {
            await fsPromises.unlink(imagePath).catch(err => console.error("Failed to delete unused image:", err));
            return res.status(400).json({ success: false, message: aiResult.error });
        }
        
        console.log("AI Analysis completed successfully!");
    
      
        let maxConfidence = 0;
        if (aiResult.classification && aiResult.classification.length > 0) {
            maxConfidence = Math.max(...aiResult.classification.map(c => c.confidence));
        }

        const newDiagnosis = new Diagnosis({
            patientId: patient._id,
            imagePath: imagePath, 
            ai_analysis: aiResult,
            confidence_score: maxConfidence,
            status: 'Completed'
        });
        await newDiagnosis.save();

        const nlpData = aiResult.nlp_reports && aiResult.nlp_reports.length > 0
                        ? aiResult.nlp_reports[0]
                        : { Advice: "No specific advice", Urgency: "Normal" };

        const newReport = new MedicalReport({
            diagnosisId: newDiagnosis._id,
            advice_text: nlpData.Advice,
            urgency_level: nlpData.Urgency === "High" || nlpData.Urgency === "حالة حرجة" ? "Critical" : "Normal",
            // action_plan: "Based on AI Analysis",
            action_plan: nlpData.Action_Plan || "يرجى استشارة الطبيب لتحديد خطة العلاج المناسبة",
            specialist: "Dentist"
        });
        await newReport.save();

        res.status(201).json({
            success: true,
            data: {
                patient_name: `${patient.name.first} ${patient.name.last}`,
                diagnosis_result: aiResult.primary_diagnosis,
                report_advice: nlpData.Advice,
                full_analysis: aiResult,
                diagnosis_id: newDiagnosis._id
            }
        });
    } catch (error) {
        console.error("Server Error:", error);
        next(error);
    }
};

exports.getPatientHistory = async (req, res, next) => {
    try {
        const { status, sort, page = 1, limit = 10 } = req.query;

        let queryObj = { patientId: req.user._id };
        if (status) {
            queryObj.status = status; 
        }

        let sortObj = { diagnosisDate: -1 }; 
        if (sort === 'oldest') {
            sortObj = { diagnosisDate: 1 }; 
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const history = await Diagnosis.find(queryObj)
                                       .sort(sortObj)
                                       .skip(skip)
                                       .limit(parseInt(limit));

        const totalElements = await Diagnosis.countDocuments(queryObj);

        res.status(200).json({
            success: true,
            pagination: {
                total: totalElements,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalElements / parseInt(limit)),
                limit: parseInt(limit)
            },
            data: history
        });
    } catch (error) {
        console.error("Get History Error:", error);
        next(error);
    }
};

exports.deleteDiagnosis = async (req, res, next) => {
    try {
        const { id } = req.params;

        const diagnosis = await Diagnosis.findOne({ _id: id, patientId: req.user._id });
        if (!diagnosis) {
            return res.status(404).json({ success: false, message: 'التشخيص غير موجود أو غير مصرح لك بمسحه' });
        }

        if (diagnosis.imagePath && fs.existsSync(diagnosis.imagePath)) {
            fs.unlinkSync(diagnosis.imagePath);
        }

        await Diagnosis.findByIdAndDelete(id);
        await MedicalReport.findOneAndDelete({ diagnosisId: id });
        await ChatSession.findOneAndDelete({ diagnosisId: id });

        res.status(200).json({ success: true, message: 'تم مسح التشخيص والبيانات المرتبطة به بنجاح' });
    } catch (error) {
        console.error("Delete Diagnosis Error:", error);
        next(error);
    }
};

exports.getSingleDiagnosis = async (req, res, next) => {
    try {
        const { id } = req.params;

        const diagnosis = await Diagnosis.findOne({ _id: id, patientId: req.user._id });

        if (!diagnosis) {
            return res.status(404).json({ success: false, message: 'التشخيص غير موجود أو غير مصرح لك' });
        }

        res.status(200).json({
            success: true,
            data: diagnosis
        });
    } catch (error) {
        console.error("Get Single Diagnosis Error:", error);
        next(error);
    }
};
exports.getReport = async (req, res, next) => {
    try {
        const { id } = req.params; // ده Report ID

        const report = await MedicalReport.findById(id).populate('diagnosisId');

        if (!report) {
            return res.status(404).json({ success: false, message: 'التقرير غير موجود' });
        }

        if (report.diagnosisId.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'غير مصرح لك برؤية هذا التقرير' });
        }

        res.status(200).json({
            success: true,
            data: {
                id: report._id,
                diagnosis_id: report.diagnosisId._id,
                advice_text: report.advice_text,
                urgency_level: report.urgency_level,
                action_plan: report.action_plan,
                specialist: report.specialist,
                generatedAt: report.generatedAt
            }
        });
    } catch (error) {
        console.error("Get Report Error:", error);
        next(error);
    }
};
