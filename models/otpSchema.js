const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { 
        type: String,
        required: true 
    },
    otp: { 
        type: String,
        required: true 
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        index: { expires: 60 }  
    }
});


otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;