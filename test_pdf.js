// Mock DOM objects for Vercel / serverless environments
global.DOMMatrix = class DOMMatrix {};
global.ImageData = class ImageData {};
global.Path2D = class Path2D {};
global.window = {};

const pdfParse = require('pdf-parse');
console.log("pdf-parse loaded successfully!");
