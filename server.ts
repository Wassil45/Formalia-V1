import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Stripe from 'stripe';
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import sgMail from '@sendgrid/mail';
import adminUsersRouter from "./server/routes/admin-users.ts";
import { requireAdmin } from "./server/middleware/auth.ts";

dotenv.config();

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' as any }) 
  : null;

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Supabase Admin Client (bypasses RLS)
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabaseAdmin = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // Stripe Webhook (must be before express.json())
  app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe || !supabaseAdmin) return res.sendStatus(500);

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const dossierId = session.metadata?.dossierId;

      if (dossierId) {
        await supabaseAdmin
          .from('dossiers')
          .update({ 
            status: 'received',
            stripe_payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', dossierId);
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Gemini AI Route
  app.post("/api/ai/generate", async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: "Gemini API not configured" });
    }
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // API Routes
  app.use("/api/admin/users", adminUsersRouter);

  // SendGrid Email Route
  app.post("/api/admin/emails/send", requireAdmin, async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ error: "SendGrid API Key is not configured." });
      }

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'support@formalia.com', // fallback
        subject,
        html: body,
      };

      await sgMail.send(msg);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("SendGrid Error:", error.response?.body || error);
      res.status(500).json({ error: error.message || "Failed to send email" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session
  app.post("/api/payments/create-checkout-session", async (req, res) => {
    if (!stripe || !supabaseAdmin) {
      return res.status(500).json({ error: "Stripe or Supabase not configured" });
    }

    try {
      const { dossierId, formaliteId, successUrl, cancelUrl } = req.body;

      // Fetch dossier and formalite
      const { data: dossier, error: dossierError } = await supabaseAdmin
        .from('dossiers')
        .select('*, formalites_catalogue(*)')
        .eq('id', dossierId)
        .single();
      
      if (dossierError || !dossier) throw new Error('Dossier non trouvé');

      const formalite = dossier.formalites_catalogue;
      const amount = dossier.total_amount || formalite.price_ttc || formalite.price_ht * (1 + formalite.tva_rate / 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: formalite.name,
                description: `Référence: ${dossier.reference}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          dossierId,
          clientId: dossier.client_id
        }
      });

      // Update dossier with session ID
      await supabaseAdmin
        .from('dossiers')
        .update({ stripe_session_id: session.id })
        .eq('id', dossierId);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Role Setup Endpoint (Bypasses RLS to force admin role)
  app.post("/api/admin/setup-role", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { userId, email } = req.body;
      
      if (!userId || !email) {
        return res.status(400).json({ error: "Missing userId or email" });
      }

      // Verify the token matches the requested user
      if (user.id !== userId || user.email !== email) {
        return res.status(403).json({ error: "Token does not match requested user" });
      }

      // Only allow specific emails to be forced to admin
      if (email !== 'wassilhamadouche@gmail.com') {
        return res.status(403).json({ error: "Unauthorized email for admin role" });
      }

      // Check if profile exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      let result;
      if (profile) {
        // Update existing profile
        result = await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId);
      } else {
        // Create new profile
        result = await supabaseAdmin
          .from('profiles')
          .insert([{
            id: userId,
            email: email,
            role: 'admin',
            first_name: '',
            last_name: ''
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      res.json({ success: true, message: "Admin role configured successfully" });
    } catch (error: any) {
      console.error("Admin role setup error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Admin Formalites Endpoint (Bypasses RLS if service key is available)
  app.post("/api/admin/formalites", requireAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { id, ...payload } = req.body;
      
      let result;
      if (id) {
        // Update
        result = await supabaseAdmin
          .from('formalites_catalogue')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
      } else {
        // Insert
        result = await supabaseAdmin
          .from('formalites_catalogue')
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      res.json(result.data);
    } catch (error: any) {
      console.error("Admin formalites error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.delete("/api/admin/formalites/:id", requireAdmin, async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase Admin client not configured" });
    }

    try {
      const { id } = req.params;
      
      // Check if there are any dossiers using this formalite
      const { data: dossiers, error: countError } = await supabaseAdmin
        .from('dossiers')
        .select('id')
        .eq('formalite_id', id)
        .limit(1);

      if (countError) throw countError;

      if (dossiers && dossiers.length > 0) {
        return res.status(400).json({ error: 'IN_USE' });
      }

      const { error } = await supabaseAdmin
        .from('formalites_catalogue')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin formalites delete error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
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

  // Serve static files in production, otherwise use Vite dev server
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
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
