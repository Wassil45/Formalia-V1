import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // RGPD Art. 20: Data Export
  app.get("/api/user/data-export", (req, res) => {
    // In a real app, verify auth token, fetch data from Supabase, generate ZIP
    // For now, we return a mock JSON response
    res.json({
      message: "Export de données initié. Un lien de téléchargement vous sera envoyé par email (valide 24h).",
      status: "processing"
    });
  });

  // RGPD Art. 17: Account Deletion (Soft Delete)
  app.delete("/api/user/account", (req, res) => {
    // In a real app, verify auth token, verify password, anonymize data in Supabase
    res.json({
      message: "Votre compte a été supprimé. Vos données personnelles ont été anonymisées.",
      status: "deleted"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
