import "dotenv/config";
import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
]

app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("First express server with Google Gemini API !!");
});

//api dummy post generate text
app.post("/generate-text", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt harus di isi!" });
    }

    for (let i=0; i < GEMINI_MODELS?.length; i++) {
        const currentModel = GEMINI_MODELS[i];

        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
          });
          return res.status(200).json({ 
            result: response.text, 
            success: true, 
            model_use: currentModel 
        });
          console.log("Berhasil request:", req);
        } catch (error) {
          console.error(
            `Gagal menggunakan model ${currentModel}:`,
            error?.message || error,
          );
          if (i === GEMINI_MODELS?.length - 1) {
            return res.status(500).json({
              success: false,
              error:
                "Semua model Gemini sedang limit atau bermasalah. Silakan coba lagi nanti.",
            });
          }

          console.log("Beralih ke model cadangan berikutnya...");
        }
    }
})

// api dummy post generate image / gambar
app.post("/generate-image", upload.single("gambar"), async (req, res) => {
    const { prompt } = req.body;
    const base64Image = req.file?.buffer.toString("base64");

    if (!prompt) {
        return res.status(400).json({ error: "Prompt harus di isi!" })
    }

    for (let i = 0; i < GEMINI_MODELS?.length; i++) {
      const currentModel = GEMINI_MODELS[i];

      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [
            { text: prompt, type: "text" },
            { inlineData: { data: base64Image, mimeType: req.file.mimetype }, type: "image" },
          ],
        });
        return res.status(200).json({
          result: response.text,
          success: true,
          model_use: currentModel,
        });
        console.log("Berhasil request:", req);
      } catch (error) {
        console.error(
          `Gagal menggunakan model ${currentModel}:`,
          error?.message || error,
        );
        if (i === GEMINI_MODELS?.length - 1) {
          return res.status(500).json({
            success: false,
            error:
              "Semua model Gemini sedang limit atau bermasalah. Silakan coba lagi nanti.",
          });
        }

        console.log("Beralih ke model cadangan berikutnya...");
      }
    }
})

// api dummy post generate dokumen
app.post("/generate-document", upload.single("document"), async (req, res) => {
    const { prompt } = req.body;
    const base64Document = req.file?.buffer?.toString("base64");

    /** coba komen bagian kondisi if prompt kosong, agar code dibawah nya jika prompt kosong akan mengambil prompt defaultnya */
    if (!prompt) {
      return res.status(400).json({ error: "Prompt harus di isi!" });
    }

    for (let i = 0; i < GEMINI_MODELS?.length; i++) {
      const currentModel = GEMINI_MODELS[i];

      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: [
            { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: "text" },
            {
              inlineData: { data: base64Document, mimeType: req.file.mimetype },
              type: "document",
            },
          ],
        });
        return res.status(200).json({
          result: response.text,
          success: true,
          model_use: currentModel,
        });
        console.log("Berhasil request:", req);
      } catch (error) {
        console.error(
          `Gagal menggunakan model ${currentModel}:`,
          error?.message || error,
        );
        if (i === GEMINI_MODELS?.length - 1) {
          return res.status(500).json({
            success: false,
            error:
              "Semua model Gemini sedang limit atau bermasalah. Silakan coba lagi nanti.",
          });
        }

        console.log("Beralih ke model cadangan berikutnya...");
      }
    }
})


// api dummy post generate audio
app.post("/generate-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Document = req.file?.buffer?.toString("base64");

  /** coba komen bagian kondisi if prompt kosong, agar code dibawah nya jika prompt kosong akan mengambil prompt defaultnya */
  if (!prompt) {
    return res.status(400).json({ error: "Prompt harus di isi!" });
  }

  for (let i = 0; i < GEMINI_MODELS?.length; i++) {
    const currentModel = GEMINI_MODELS[i];

    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            text: prompt ?? "Tolong buat transkip dari rekaman audio berikut.",
            type: "text",
          },
          {
            inlineData: { data: base64Document, mimeType: req.file.mimetype }, type: "audio",
          },
        ],
      });
      return res.status(200).json({
        result: response.text,
        success: true,
        model_use: currentModel,
      });
      console.log("Berhasil request:", req);
    } catch (error) {
      console.error(
        `Gagal menggunakan model ${currentModel}:`,
        error?.message || error,
      );
      if (i === GEMINI_MODELS?.length - 1) {
        return res.status(500).json({
          success: false,
          error:
            "Semua model Gemini sedang limit atau bermasalah. Silakan coba lagi nanti.",
        });
      }

      console.log("Beralih ke model cadangan berikutnya...");
    }
  }
});

app.listen(port, () => 
    console.log(`Server is running on http://localhost:${port}`)
);