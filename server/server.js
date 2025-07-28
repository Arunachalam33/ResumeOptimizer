
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import fs from "fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
    res.send("Backend is Working");
});

app.post("/parse-pdf", upload.single("file"), async (req, res) => {
    let filePath;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        filePath = req.file.path;
        const pdfData = new Uint8Array(await fs.readFile(filePath));
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let extractedText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            extractedText += pageText + "\n";
        }

        res.json({ text: extractedText.trim() });
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        res.status(500).json({ error: "Failed to parse PDF" });
    } finally {
      
        if (filePath) {
            try {
                await fs.access(filePath);
                await fs.unlink(filePath);
                console.log(`Deleted temporary file: ${filePath}`);
            } catch (unlinkError) {
                console.error(`Error deleting temporary file ${filePath}:`, unlinkError);
            }
        }
    }
});

app.post("/ai-extract", async (req, res) => {
    const { text } = req.body;

    
    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "No text provided for AI extraction." });
    }

    try {
       
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); "

       
        const prompt = `You are an expert at parsing resumes. Extract key information from the provided resume text and return it as a JSON object. Ensure the JSON is always valid and strictly follows the schema below. If a field is not found, use "Not found" for strings or an empty array for lists.

Expected JSON Schema:
{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "skills": ["string"],
  "education": "string",
  "experience": "string"
}

For skills, list prominent technical and soft skills as an array of strings.
For education, summarize the highest degree/institution (e.g., "Master of Science in Computer Science, XYZ University").
For experience, provide a concise summary of the professional experience (e.g., "5 years as Software Engineer at ABC Corp, developed X and Y.").

Resume Text:
${text}

Please return only the JSON object, no additional text or explanation.`;

    
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        console.log("Raw AI response:", content); 

        let parsed = {};
        try {
       
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
            }

            parsed = JSON.parse(cleanContent);
           
            const defaultInfo = { 
                name: "Not found", 
                email: "Not found", 
                phone: "Not found", 
                skills: [], 
                education: "Not found", 
                experience: "Not found" 
            };
            parsed = { ...defaultInfo, ...parsed };
            
        } catch (e) {
            console.warn("⚠️ Gemini did not return valid JSON. Raw content:", content);
            console.error("JSON Parse Error:", e);
            
         
            return res.status(500).json({
                error: "AI did not return valid JSON. Please try again or refine the prompt.",
                rawResponse: content,
                extracted: { 
                    name: "Error", 
                    email: "Error", 
                    phone: "Error", 
                    skills: ["Error"], 
                    education: "Error", 
                    experience: "Error" 
                }
            });
        }

        res.json({ extracted: parsed });

    } catch (error) {
        console.error("Gemini API Error:", error);

        if (error.message) {
            console.error("Error message:", error.message);
        }
        

        if (error.message && error.message.includes("API_KEY")) {
            return res.status(401).json({
                error: "Invalid API key. Please check your GEMINI_API_KEY environment variable.",
                details: error.message
            });
        }
        
        if (error.message && error.message.includes("quota")) {
            return res.status(429).json({
                error: "API quota exceeded. Please try again later.",
                details: error.message
            });
        }

        res.status(500).json({ 
            error: "Gemini extraction failed", 
            details: error.message || "Unknown error occurred"
        });
    }
});

app.listen(port, () => {
    console.log(`Server Running on ${port}`);
});