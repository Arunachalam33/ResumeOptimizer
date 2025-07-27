import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import fs from "fs";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
    res.send("Backend is Working");
});

app.post("/parse-pdf", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const pdfData = new Uint8Array(fs.readFileSync(filePath));
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
    }
});

app.listen(port, () => {
    console.log(`Server Running on ${port}`);
});
