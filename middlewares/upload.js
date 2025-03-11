const path = require('path');
const multer = require('multer');

// Storage configuration for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Public/uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Timestamp-based unique filenames
    }
});

// Multer upload configuration with file filter and size limit
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true); // Accept JPEG and PNG files
        } else {
            console.log('Only JPEG and PNG files are supported!');
            cb(new Error('Unsupported file type!'), false); // Reject unsupported files
        }
    },
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB file size limit
});

module.exports = upload;
