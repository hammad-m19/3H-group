require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
                'hello',
                {
                    inlineData: {
                        data: Buffer.from('dummy').toString('base64'),
                        mimeType: 'application/pdf'
                    }
                }
            ]
        });
        console.log(response.text);
    } catch (e) {
        console.error(e.message);
    }
}
listModels();
