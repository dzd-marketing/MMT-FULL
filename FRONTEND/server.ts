import express from "express";
import { createServer as createViteServer } from "vite";
import cors from 'cors';
import translate from 'google-translate-api-x';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());


  app.post("/api/translate", async (req, res) => {
    try {
      const { texts, to } = req.body;
      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return res.json({ translations: [] });
      }

    
      const nonEmptyIndices = [];
      const textsToTranslate = [];
      
      texts.forEach((text, index) => {
        if (text && text.trim() !== '') {
          nonEmptyIndices.push(index);
          textsToTranslate.push(text);
        }
      });

      let translatedResults = [];
      if (textsToTranslate.length > 0) {
        try {
          const result: any = await translate(textsToTranslate, { to });
    
          translatedResults = Array.isArray(result) ? result.map((r: any) => r.text) : [result.text];
        } catch (err) {
          console.error("Translation API error:", err);
          return res.json({ translations: texts }); 
        }
      }

      const finalTranslations = [...texts];
      nonEmptyIndices.forEach((originalIndex, i) => {
        finalTranslations[originalIndex] = translatedResults[i] || texts[originalIndex];
      });

      res.json({ translations: finalTranslations });
    } catch (error) {
      console.error("Translation batch error:", error);
      res.json({ translations: req.body.texts || [] });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
