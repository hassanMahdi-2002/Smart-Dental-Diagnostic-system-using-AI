const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. إيقاف الطلب مبكراً إذا لم يتم إرسال توكن
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized, no token provided' 
        });
    }

    try {
        // 3. فك تشفير التوكن
        // ملاحظة: أزلنا الـ fallback_secret_key لدواعي أمنية
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. البحث عن المريض في قاعدة البيانات واستبعاد كلمة المرور
        req.user = await Patient.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized, user not found' 
            });
        }

        // 5. السماح بالمرور للـ Controller
        next();

    } catch (error) {
        console.error("Token Verification Error:", error);
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized, invalid or expired token' 
        }); 
    }
};

module.exports = { protect };