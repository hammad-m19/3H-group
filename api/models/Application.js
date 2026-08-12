const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    answers: { type: String }, // Custom questions answers
    resumeText: { type: String }, // Extracted text from PDF
    resumeBuffer: { type: Buffer }, // Store original PDF in DB if we want, or skip it to save space
    aiScore: { type: Number },
    aiRationale: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);
