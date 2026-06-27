const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود مجلد uploads، وإذا لم يكن موجوداً يتم إنشاؤه تلقائياً
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // مسار الحفظ
    },
    filename: function (req, file, cb) {
        // توليد اسم فريد لتجنب التكرار
        cb(null, Date.now() + path.extname(file.originalname).toLowerCase());
    }
});

// فلترة الملفات المرفوعة لتناسب نماذج الـ AI
const fileFilter = (req, file, cb) => {
    // تحديد الامتدادات المدعومة فقط
    const allowedTypes = /jpeg|jpg|png/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
        cb(null, true);
    } else {
        // إنشاء خطأ مخصص سيلتقطه الـ Global Error Handler
        const error = new Error('Invalid file type! Please upload only JPG, JPEG, or PNG images.');
        error.name = 'MulterError'; // لتمييزه في الـ Error Middleware
        cb(error, false);
    }
};

// تهيئة أداة الرفع
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // الحد الأقصى: 5 ميجابايت
});

module.exports = upload;