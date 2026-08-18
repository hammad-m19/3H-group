require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = await ai.models.list();
        console.log(models.map(m => m.name));
    } catch(e) {
        console.error(e);
    }
}
test();
