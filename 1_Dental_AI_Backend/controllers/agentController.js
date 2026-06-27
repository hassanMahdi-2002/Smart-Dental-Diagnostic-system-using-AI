const { 
    GoogleGenerativeAI, 
    HarmCategory, 
    HarmBlockThreshold 
} = require('@google/generative-ai');
const Diagnosis = require('../models/Diagnosis');
const ChatSession = require('../models/ChatSession');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const getPatientDiagnosisTool = {
    name: "get_patient_diagnosis",
    description: "Use this tool to fetch the patient's diagnosis details, detected dental diseases, and medical history from the database using the diagnosisId.",
    parameters: {
        type: "OBJECT",
        properties: {
            diagnosisId: {
                type: "STRING",
                description: "The unique Diagnosis ID of the patient"
            }
        },
        required: ["diagnosisId"]
    }
};
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
const systemInstruction = `
You are an expert dentist and a smart assistant. Your role is to analyze diagnostic data, write accurate medical reports, and answer patients' questions.
Adhere strictly to the following rules:
1. Speak in polite and reassuring Egyptian Arabic or clear and simple Modern Standard Arabic.
2. If there are chronic conditions in your medical history (such as diabetes, hypertension, or blood clotting disorders), relate them to your current dental condition.
3. If your medical history is "none," act as if you are perfectly healthy.
4. I always recommend a clinic visit for a definitive diagnosis. Don't discuss the roots or nerves, as the diagnosis is based solely on a visual image.
5. An important rule for the project: When writing a report or treatment plan, treat tartar (calculus) as a separate category within the classification only. Do not include it as a primary disease requiring a complex treatment plan. Focus your treatment plan on the other detected conditions.
`;
// أنت طبيب أسنان خبير ومساعد ذكي. دورك هو تحليل بيانات التشخيص وكتابة تقارير طبية دقيقة، والرد على أسئلة المرضى.
// التزم بالقواعد التالية حرفياً:
// 1. تحدث باللهجة المصرية المهذبة والمطمئنة أو العربية الفصحى البسيطة والواضحة.
// 2. عند وجود أمراض مزمنة في التاريخ المرضي (مثل السكري، الضغط، سيولة الدم)، يجب ربطها بالحالة الحالية للأسنان (مثال: حذر من بطء التئام اللثة مع السكري، أو انصح بإخبار الطبيب بالضغط لتجنب أنواع بنج معينة).
// 3. إذا كان التاريخ المرضي "لا يوجد" أو "None"، تعامل كشخص سليم تماماً.
// 4. دائماً انصح بزيارة العيادة للتشخيص النهائي، ولا تتحدث عن الجذور أو العصب لأن التشخيص مبني على صورة ظاهرية فقط.
// 5. قاعدة هامة للمشروع: عند كتابة تقرير أو خطة علاج، تعامل مع "الجير" (Tartar/Calculus) كفئة منفصلة في التصنيف فقط، ولا تدرجه كمرض رئيسي يستدعي خطة علاج معقدة. ركز في خطة العلاج على باقي الأمراض المكتشفة.
exports.sendMessage = async (req, res, next) => {
    try {
        const { diagnosisId, message } = req.body;
        if (!diagnosisId) return res.status(400).json({success: false, message: "رقم التشخيص (diagnosisId) مطلوب." });
        if (!message) return res.status(400).json({success: false, message: "الرسالة (message) مطلوبة." });
        const checkDiagnosis = await Diagnosis.findById(diagnosisId);
        if (!checkDiagnosis) {
            return res.status(404).json({ success: false, message: "This diagnosis was not found." });
        }
        if (checkDiagnosis.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "You are not the owner of this diagnosis." });
        }
        let chatSession = await ChatSession.findOne({ diagnosisId: diagnosisId });
        let formattedHistory = [];
        if (chatSession && chatSession.messages.length > 0) {
            const recentMessages = chatSession.messages.slice(-30);
            formattedHistory = recentMessages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
        
        } else {
            chatSession = new ChatSession({ diagnosisId: diagnosisId, messages: [] });
        }
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ functionDeclarations: [getPatientDiagnosisTool] }],
            safetySettings: safetySettings,
            systemInstruction: systemInstruction 
        });
        console.log("Super Agent is thinking...");
        const chat = model.startChat({ history: formattedHistory });
        let prompt = `Diagnosis ID: ${diagnosisId}\nUser Query: ${message}`;
        let result = await chat.sendMessage(prompt);
        let response = result.response;
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "get_patient_diagnosis") {
                console.log(" Agent is using tool: Fetching data...");
                await checkDiagnosis.populate('patientId');
                const toolResponseData = {
                    patientAge: checkDiagnosis.patientId.age,
                    medicalHistory: checkDiagnosis.patientId.medical_history,
                    aiAnalysis: checkDiagnosis.ai_analysis
                };
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: "get_patient_diagnosis",
                        response: toolResponseData
                    }
                }]);
                response = result.response;
            }
        }
        const finalReply = response.text();
        chatSession.messages.push({ role: 'user', content: message });
        chatSession.messages.push({ role: 'model', content: finalReply });
        chatSession.markModified('messages');
        await chatSession.save();
        res.status(200).json({
            success: true,
            reply: finalReply,
            chatId: chatSession._id
        });
    }catch (error) {
        console.error("Agent Error:", error.message);
        if (error.message && (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('Service Unavailable'))) {
            return res.status(503).json({ 
                success: false, 
                message: "الذكاء الاصطناعي يواجه ضغطاً كبيراً حالياً. يرجى المحاولة مرة أخرى بعد قليل." 
            });
        }
        next(error);
    }
};
exports.getChatHistory = async (req, res, next) => {
    try {
        const { diagnosisId } = req.params;
        const checkDiagnosis = await Diagnosis.findById(diagnosisId);
        if (!checkDiagnosis) {
            return res.status(404).json({ success: false, message: "التشخيص غير موجود." });
        }
        if (checkDiagnosis.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "غير مصرح لك بالوصول لهذه المحادثة." });
        }
        const chatSession = await ChatSession.findOne({ diagnosisId: diagnosisId });
        if (!chatSession) {
            return res.status(200).json({ success: true, messages: [] });
        }
        res.status(200).json({
            success: true,
            chatId: chatSession._id,
            messages: chatSession.messages
        });
    } catch (error) {
        console.error("Get Chat History Error:", error);
        next(error);    
    }
};