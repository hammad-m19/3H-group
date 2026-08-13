require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');

const Job = require('./models/Job');
const Application = require('./models/Application');

const app = express();
app.use(cors());
app.use(express.json());

// In Vercel, serve static files via vercel.json, but for local dev we can serve the public directory
if (process.env.NODE_ENV !== 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '..')));
}

// Memory storage for Vercel compatibility
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

let mongooseConnected = false;
async function connectDB() {
    if (mongooseConnected) return;
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI is not set!");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        mongooseConnected = true;
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

// Ensure DB is connected for every request in serverless environment
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// --- JOBS API ---

// Get all jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new job
app.post('/api/jobs', async (req, res) => {
    try {
        const { title, description } = req.body;
        const job = new Job({ title, description });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a job
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        await Application.deleteMany({ jobId: req.params.id });
        res.json({ message: 'Job and associated applications deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- APPLICATIONS API ---

// Submit an application
app.post('/api/apply', upload.single('resume'), async (req, res) => {
    try {
        const { jobId, name, email, answers } = req.body;
        if (!req.file) return res.status(400).json({ error: "Resume PDF is required" });

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });

        // Convert PDF buffer to Base64 to send directly to Gemini
        const base64Pdf = req.file.buffer.toString("base64");
        const resumeText = "PDF analyzed directly by Gemini AI"; 

        // Gemini AI Evaluation
        let aiScore = 0;
        let aiRationale = "AI evaluation failed.";
        
        if (process.env.GEMINI_API_KEY) {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                
                const prompt = `
You are an expert HR recruiter. Please evaluate the following candidate for the job provided.
Return ONLY a raw JSON object (no markdown formatting, no backticks, just the json) with two keys:
1. "score": a number from 0 to 100 representing how good of a fit they are.
2. "rationale": a short paragraph explaining why.

Job Title: ${job.title}
Job Description: ${job.description}

Candidate Name: ${name}
Candidate Answers: ${answers}
`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: [
                        prompt,
                        {
                            inlineData: {
                                data: base64Pdf,
                                mimeType: 'application/pdf'
                            }
                        }
                    ],
                });
                
                let resultText = response.text;
                // Clean up potential markdown formatting from the response
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const aiResult = JSON.parse(resultText);
                aiScore = aiResult.score;
                aiRationale = aiResult.rationale;
            } catch (aiErr) {
                console.error("AI Evaluation error:", aiErr);
                aiRationale = "AI evaluation failed: " + aiErr.message;
            }
        }

        const application = new Application({
            jobId,
            name,
            email,
            answers,
            resumeText,
            resumeBuffer: req.file.buffer, // Optional: storing the PDF buffer
            aiScore,
            aiRationale
        });
        await application.save();

        res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all applications
app.get('/api/applications', async (req, res) => {
    try {
        const apps = await Application.find()
            .populate('jobId', 'title')
            .sort({ aiScore: -1 }); // Sort by AI score descending
            
        // Don't send the full resume buffer in the list API to save bandwidth
        const safeApps = apps.map(app => {
            const obj = app.toObject();
            delete obj.resumeBuffer;
            return obj;
        });
        
        res.json(safeApps);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all applications
app.delete('/api/applications', async (req, res) => {
    try {
        await Application.deleteMany({});
        res.json({ message: 'All applications deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download resume
app.get('/api/applications/:id/resume', async (req, res) => {
    try {
        const appDoc = await Application.findById(req.params.id);
        if (!appDoc || !appDoc.resumeBuffer) {
            return res.status(404).send('Resume not found');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="resume_${appDoc.name}.pdf"`);
        res.send(appDoc.resumeBuffer);
    } catch (error) {
        res.status(500).send('Error retrieving resume');
    }
});


module.exports = app;

if (require.main === module) {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
