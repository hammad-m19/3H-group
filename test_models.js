require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: 'hello'
        });
        console.log(response.text);
    } catch (e) {
        console.error(e.message);
    }
}
listModels();
