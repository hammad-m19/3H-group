require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');

// Mock DOM objects for Vercel / serverless environment to prevent pdf-parse from crashing
global.DOMMatrix = class DOMMatrix {};
global.ImageData = class ImageData {};
global.Path2D = class Path2D {};
const pdfParse = require('pdf-parse');
const nodemailer = require('nodemailer');

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

        // Parse PDF locally to save time and API tokens
        let resumeText = "Could not read resume text.";
        try {
            const pdfData = await pdfParse(req.file.buffer);
            resumeText = pdfData.text;
        } catch (pdfErr) {
            console.error("PDF Parsing Error:", pdfErr);
        }

        // Gemini AI Evaluation
        let aiScore = 0;
        let aiRationale = "AI evaluation failed.";

        if (process.env.GEMINI_API_KEY) {
            let attempt = 0;
            const maxAttempts = 3;
            let success = false;
            
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

Candidate Resume Text:
${resumeText}
`;

            while (attempt < maxAttempts && !success) {
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-1.5-flash',
                        contents: [prompt],
                        config: {
                            responseMimeType: "application/json",
                        }
                    });

                    let resultText = response.text;
                    // Clean up potential markdown formatting from the response
                    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

                    const aiResult = JSON.parse(resultText);
                    aiScore = aiResult.score || 0;
                    aiRationale = aiResult.rationale || "AI evaluation completed.";
                    success = true;
                } catch (aiErr) {
                    attempt++;
                    console.error(`AI Evaluation error (attempt ${attempt}):`, aiErr);
                    
                    if (attempt >= maxAttempts) {
                        let errorMsg = aiErr.message || String(aiErr);
                        try {
                            // Try to parse the error message if it's a JSON string
                            const parsedErr = JSON.parse(errorMsg);
                            if (parsedErr.error && parsedErr.error.message) {
                                errorMsg = parsedErr.error.message;
                            }
                        } catch (e) {
                            // Ignore parsing error
                        }

                        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
                            aiRationale = "AI evaluation paused: API rate limit exceeded. Please try again later.";
                        } else if (errorMsg.includes("503") || errorMsg.includes("demand") || errorMsg.includes("UNAVAILABLE")) {
                            aiRationale = "AI evaluation paused: AI models are currently experiencing high demand. Please try again later.";
                        } else {
                            aiRationale = "AI evaluation failed: " + errorMsg;
                        }
                    } else {
                        // Exponential backoff: wait 2s, then 4s
                        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
                    }
                }
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

// Retry AI Evaluation
app.post('/api/applications/:id/evaluate', async (req, res) => {
    try {
        const appDoc = await Application.findById(req.params.id).populate('jobId');
        if (!appDoc) return res.status(404).json({ error: "Application not found" });
        if (!appDoc.jobId) return res.status(404).json({ error: "Associated job not found" });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
        }

        let attempt = 0;
        const maxAttempts = 3;
        let success = false;
        let aiScore = 0;
        let aiRationale = "AI evaluation failed.";

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
You are an expert HR recruiter. Please evaluate the following candidate for the job provided.
Return ONLY a raw JSON object (no markdown formatting, no backticks, just the json) with two keys:
1. "score": a number from 0 to 100 representing how good of a fit they are.
2. "rationale": a short paragraph explaining why.

Job Title: ${appDoc.jobId.title}
Job Description: ${appDoc.jobId.description}

Candidate Name: ${appDoc.name}
Candidate Answers: ${appDoc.answers}

Candidate Resume Text:
${appDoc.resumeText}
`;

        while (attempt < maxAttempts && !success) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [prompt],
                    config: {
                        responseMimeType: "application/json",
                    }
                });

                let resultText = response.text;
                resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

                const aiResult = JSON.parse(resultText);
                aiScore = aiResult.score || 0;
                aiRationale = aiResult.rationale || "AI evaluation completed.";
                success = true;
            } catch (aiErr) {
                attempt++;
                console.error(`AI Evaluation error on retry (attempt ${attempt}):`, aiErr);
                
                if (attempt >= maxAttempts) {
                    let errorMsg = aiErr.message || String(aiErr);
                    try {
                        const parsedErr = JSON.parse(errorMsg);
                        if (parsedErr.error && parsedErr.error.message) {
                            errorMsg = parsedErr.error.message;
                        }
                    } catch (e) { }

                    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
                        aiRationale = "AI evaluation paused: API rate limit exceeded. Please try again later.";
                    } else if (errorMsg.includes("503") || errorMsg.includes("demand") || errorMsg.includes("UNAVAILABLE")) {
                        aiRationale = "AI evaluation paused: AI models are currently experiencing high demand. Please try again later.";
                    } else {
                        aiRationale = "AI evaluation failed: " + errorMsg;
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
                }
            }
        }

        appDoc.aiScore = aiScore;
        appDoc.aiRationale = aiRationale;
        await appDoc.save();

        res.json({ message: "AI Evaluation complete", aiScore, aiRationale });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// --- AI HR CHATBOT ---
app.post('/api/admin/chat', async (req, res) => {
    try {
        const { query, jobId } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Gemini API Key is not configured." });

        // Filter by job if provided
        let filter = {};
        if (jobId && jobId !== 'all') {
            filter.jobId = jobId;
        }

        const apps = await Application.find(filter).populate('jobId', 'title');

        // Prepare data for AI
        const candidates = apps.map(app => ({
            name: app.name,
            email: app.email,
            jobTitle: app.jobId ? app.jobId.title : 'Unknown Job',
            answers: app.answers,
            aiScore: app.aiScore,
            aiRationale: app.aiRationale,
            resumeText: app.resumeText
        }));

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `
You are an expert HR Assistant for 3H GROUP Construction Company. 
Your task is to answer the admin's query based on the following candidate data.

Admin's Query: "${query}"

Here are the candidates:
${JSON.stringify(candidates, null, 2)}

Provide a helpful, well-formatted response (using markdown if needed) to answer the admin's query based on the candidate data provided above.
`;

        let attempt = 0;
        const maxAttempts = 3;
        let success = false;
        let replyText = "";
        
        while (attempt < maxAttempts && !success) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: [prompt],
                });
                replyText = response.text;
                success = true;
            } catch (aiErr) {
                attempt++;
                console.error(`Chat API Error (attempt ${attempt}):`, aiErr);
                
                if (attempt >= maxAttempts) {
                    let errorMsg = aiErr.message || String(aiErr);
                    try {
                        const parsedErr = JSON.parse(errorMsg);
                        if (parsedErr.error && parsedErr.error.message) {
                            errorMsg = parsedErr.error.message;
                        }
                    } catch (e) {
                        // ignore
                    }
                    
                    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
                        throw new Error("Chat unavailable: API rate limit exceeded. Please try again later or upgrade your plan.");
                    } else if (errorMsg.includes("503") || errorMsg.includes("demand") || errorMsg.includes("UNAVAILABLE")) {
                        throw new Error("Chat unavailable: AI models are currently experiencing high demand. Please try again later.");
                    } else {
                        throw new Error("AI Chat failed: " + errorMsg);
                    }
                } else {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
                }
            }
        }

        res.json({ reply: replyText });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Send Interview Email
app.post('/api/send-interview-email', async (req, res) => {
    try {
        const { applicationIds, date, time, numbers } = req.body;
        if (!applicationIds || applicationIds.length === 0 || !date || !time || !numbers) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const applications = await Application.find({ _id: { $in: applicationIds } }).populate('jobId');
        if (!applications || applications.length === 0) {
            return res.status(404).json({ error: 'Applications not found' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'Email configuration is missing on server' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const formatDate = (dateString) => {
            const d = new Date(dateString);
            const nth = (d) => {
                if (d > 3 && d < 21) return 'th';
                switch (d % 10) {
                    case 1:  return "st";
                    case 2:  return "nd";
                    case 3:  return "rd";
                    default: return "th";
                }
            };
            const dateNum = d.getDate();
            const month = d.toLocaleString('default', { month: 'long' });
            const year = d.getFullYear();
            const dayName = d.toLocaleString('default', { weekday: 'long' });
            return `${dayName}, ${dateNum}${nth(dateNum)} ${month} ${year}`;
        };

        const formattedDate = formatDate(date);

        // Convert 24h time string (e.g. "14:30") to 12h format ("02:30 PM")
        const formatTime = (timeStr) => {
            const [h, m] = timeStr.split(':');
            const hNum = parseInt(h, 10);
            const ampm = hNum >= 12 ? 'PM' : 'AM';
            const h12 = hNum % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        };
        const formattedTime = formatTime(time);

        let emailsSent = 0;

        for (const app of applications) {
            const mailText = `Dear Candidate,

We are pleased to inform you that you have been shortlisted for an interview with 3H Group.

Your interview is scheduled for ${formattedDate}, at ${formattedTime} at the 3H Group Office.

About 3H Group:
3H Group comprises 3H Contractors, 3H Consultants, and 3H Marketing. We are committed to excellence in construction, engineering consultancy, and business solutions, while providing a professional environment that promotes innovation, integrity, professional development, and career growth.

Please bring the following documents:
• Updated CV
• Original CNIC
• Copies of educational and professional certificates, if available

Kindly arrive 10–15 minutes before your scheduled interview to complete the necessary formalities.

We look forward to meeting you and discussing the opportunity with you.

Human Resources Department
3H Group

For any queries or assistance, please contact:
${numbers}`;

            const mailOptions = {
                from: `"3H Group HR" <${process.env.EMAIL_USER}>`,
                to: app.email,
                subject: 'Interview Invitation - 3H Group',
                text: mailText
            };

            await transporter.sendMail(mailOptions);
            emailsSent++;
        }

        res.json({ success: true, count: emailsSent });
    } catch (error) {
        console.error("Email API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;

if (require.main === module) {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
