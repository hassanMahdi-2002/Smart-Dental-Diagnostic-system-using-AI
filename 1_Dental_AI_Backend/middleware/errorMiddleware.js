const notFound = (req, res, next) => {
    const error = new Error(`The path does not exist - ${req.originalUrl}`);
    res.status(404);
    next(error); // تمرير الخطأ للمحطة الأخيرة (Global Error Handler)
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal server error';

    // 1. معالجة أخطاء حجم الملفات (Multer)
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400; // Bad Request
        message = 'The image size is too large. The maximum size is 5 MB.';
    }

    // 2. معالجة أخطاء التحقق من البيانات (Mongoose Validation)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // 3. [إضافة] معالجة خطأ الـ ID غير الصالح (Mongoose CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'Invalid ID format provided.';
    }

    // 4. [إضافة] معالجة خطأ تكرار البيانات مثل الإيميل (MongoDB Duplicate Key)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `An account with that ${field} already exists.`;
    }

    // طباعة الخطأ في الكونسول للمطور
    console.error(`[Error] ${err.message}`);

    // إرسال الرد النهائي الموحد للتطبيق
    res.status(statusCode).json({
        success: false,
        message: message,
        // إخفاء مسار الأكواد في بيئة الإنتاج لدواعي أمنية
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { notFound, errorHandler };