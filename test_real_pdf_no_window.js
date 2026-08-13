const fs = require('fs');
global.DOMMatrix = class DOMMatrix {};
global.ImageData = class ImageData {};
global.Path2D = class Path2D {};
// NOT mocking window!

const pdfParse = require('pdf-parse');
const { PDFDocument, rgb } = require('pdf-lib');

async function createAndParse() {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    page.drawText('Hello World from PDF!', { x: 50, y: 700 })
    const pdfBytes = await pdfDoc.save()
    const buffer = Buffer.from(pdfBytes);
    
    console.log("PDF created. Parsing...");
    try {
        const data = await pdfParse(buffer);
        console.log("Parsed text length:", data.text.length);
        console.log("Text snippet:", data.text.substring(0, 50));
    } catch (err) {
        console.error("Parse error:", err);
    }
}
createAndParse();
