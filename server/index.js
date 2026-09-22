import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-8b",
  "gemini-1.5-flash",
];

app.use(cors());
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("First express server with Google Gemini API !!");
});

// api chat asisten kesehatan P3K & edukasi gejala ringan.
app.post("/api/chat", async (req, res) => {
    const { conversation } = req.body;
    if (!conversation || !Array.isArray(conversation)) {
        return res.status(400).json({ error: "Pesan atau keluhan tidak boleh kosong!"})
    }

    const systemInstruction = `
    Kamu adalah "Astrobot" (asisten dokter robot), seorang asisten P3K digital dan edukator kesehatan gejala ringan yang ramah, empati, dan profesional.
    Tugas utama kamu:
    1. Memberikan panduan pertolongan pertama (P3K) yang jelas, aman, dan mudah dipahami.
    2. Memberikan edukasi umum mengenai gejala penyakit ringan (seperti batuk, flu, demam ringan).
    3. Jika pengguna menyebutkan gejala darurat berbahaya (seperti nyeri dada kiri berat, sesak napas parah, tidak sadarkan diri, atau perdarahan hebat), kamu WAJIB menyarankan mereka untuk segera menghubungi nomor darurat (119) atau ke IGD terdekat.
    4. Berikan minimal 3 opsi penanganan mandiri atau pertolongan pertama yang aman dilakukan di rumah.
    5. Jawablah menggunakan bahasa Indonesia yang santun dan mudah dimengerti oleh orang awam.
    6. Jawablah dengan sedetail mungkin tapi ringkas (summry) namun point dari pertanyaan user nya tersampaikan, 
    7. Setelah kamu menjawab di sesi akhir dengan user, sarankan agar mereka tetap menghubungi tenaga medis profesional jika gejala tidak membaik atau memburuk, dan jangan memberikan diagnosa pasti, dan jelaskan bawah AI bisa saja salah .
    `;

    // loop conversation untuk di ubah menjadi format yang di butuhkan gemini api
    const contents = conversation?.map(({ role, text }) => ({
        role,
        parts: [{ text }],
    }))

    for (let i = 0; i < GEMINI_MODELS?.length; i++) {
      const currentModel = GEMINI_MODELS[i];

      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: {
            temperature: 0.4, // set temperature rendah, agar jawaban AI lebih aktual dan tidak mengarang bebas.
            systemInstruction: systemInstruction
          }
        });

        // response jawaban AI
        let docBotReply = response.text;
        const medicalDisclaimer =
          "\n\n*Catatan: Informasi ini hanya bersifat edukasi P3K dan bantuan awal gejala ringan, bukan pengganti diagnosis medis resmi. Jika gejala memburuk atau menetap, segera konsultasikan dengan dokter atau tenaga medis profesional.*";

        docBotReply += medicalDisclaimer;

        return res.status(200).json({
          result: docBotReply,
          success: true,
          model_use: currentModel,
        });
      } catch (error) {
        console.error(
          `Gagal menggunakan model ${currentModel}:`,
          error?.message || error,
        );
        if (i === GEMINI_MODELS?.length - 1) {
          return res.status(500).json({
            success: false,
            error:
              "Mohon maaf, Sistem medis kami sedang sibuk/limit. Silakan coba beberapa saat lagi.",
          });
        }

        console.log("Beralih ke model cadangan berikutnya...");
      }
    }

}); 

//api dummy post generate text
app.post("/generate-text", async (req, res) => {
    console.log("Berhasil request:", req);
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