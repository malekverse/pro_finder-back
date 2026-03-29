const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'info', 'error'],
        default: 'success'
    }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);