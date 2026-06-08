import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import { db, generateSlug } from "../db.ts";
import { signToken } from "../auth.ts";
import { z } from "zod";

const VALID_COUPONS: Record<string, number> = {
  "DESCONTO10": 10,
  "BARBER30": 30,
  "VIP50": 50,
  "FREE100": 100,
  "MESTRE20": 20,
};

const registerSchema = z.object({
  barbershopName: z.string().min(2),
  adminName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  coupon: z.string().optional(),
  code: z.string().length(6),
});

const sendCodeSchema = z.object({
  email: z.string().email(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  password: z.string().min(6),
});

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/send-verification-code", async (req: Request, res: Response) => {
    try {
      const { email } = sendCodeSchema.parse(req.body);

      // Check if email already exists
      const usersRef = db.collection("users");
      const existingUserSnapshot = await usersRef.where("email", "==", email).get();
      if (!existingUserSnapshot.empty) {
        return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
      }

      // Generate a 6-digit verify code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

      // Store in email_verifications (keyed by email to overwrite older requests)
      await db.collection("email_verifications").doc(email).set({
        email,
        code,
        expiresAt,
        createdAt: new Date().toISOString()
      });

      const emailUser = process.env.SUPPORT_EMAIL_USER || "";
      const emailPass = process.env.SUPPORT_EMAIL_PASS || "";

      let emailSent = false;

      if (emailUser && emailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          const mailOptions = {
            from: `"Suporte BarberTool" <${emailUser}>`,
            to: email,
            subject: "[BarberTool] Confirme seu e-mail de cadastro",
            text: `Olá!\n\nObrigado por escolher o BarberTool.\n\nPara continuar com a criação da sua conta, utilize o código de confirmação abaixo:\n\nCódigo: ${code}\n\nEste código é válido por 15 minutos.\n\nAtenciosamente,\nEquipe BarberTool`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; color: #111111; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="color: #111111; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">BarberTool</h2>
                  <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">Confirmação de Cadastro</p>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #333333; margin-top: 0;">Olá,</p>
                <p style="font-size: 14px; line-height: 1.6; color: #333333;">Seja muito bem-vindo ao BarberTool! Use o código de 6 dígitos abaixo para confirmar o seu endereço de e-mail e finalizar a criação de sua conta de administrador:</p>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 12px;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: 950; letter-spacing: 6px; color: #111111;">${code}</span>
                </div>
                
                <p style="font-size: 12px; color: #777777; line-height: 1.6; text-align: center; margin-top: 25px;">
                  Este código é válido por <strong>15 minutos</strong> e expira automaticamente após esse período.
                </p>
                
                <div style="border-t: 1px solid #f0f0f0; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 11px; color: #a0a0a0;">
                  Se você não solicitou este e-mail, por favor ignore esta mensagem.
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
        } catch (err: any) {
          console.error("Failed to send SMTP register verification email:", err);
        }
      }

      if (!emailSent) {
        // Fallback for development/sandbox where SUPPORT_EMAIL is not yet configured or fails
        return res.json({
          success: true,
          warning: "Configuração de e-mail do servidor (SUPPORT_EMAIL_USER e SUPPORT_EMAIL_PASS) não detectada. Em modo demonstração, o código foi gerado no sistema com sucesso.",
          code: code // Expose so developer can easily copy-paste and complete register in preview
        });
      }

      res.json({
        success: true,
        message: "Um código de verificação de 6 dígitos foi enviado para o seu e-mail cadastrado."
      });
    } catch (err: any) {
      console.error("Send verification code API error:", err);
      res.status(500).json({ error: "Ocorreu um erro ao enviar o código de verificação." });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { barbershopName, adminName, email, password, phone, code } = registerSchema.parse(req.body);

      // Verify the registration verification code first!
      const verificationDoc = await db.collection("email_verifications").doc(email).get();
      if (!verificationDoc.exists) {
        return res.status(400).json({ error: "Nenhum código de verificação solicitado para este e-mail." });
      }

      const verificationData = verificationDoc.data();
      if (verificationData?.code !== code) {
        return res.status(400).json({ error: "Código de verificação incorreto." });
      }

      if (new Date() > new Date(verificationData?.expiresAt)) {
        return res.status(400).json({ error: "O código de verificação expirou (15 minutos). Solicite um novo código." });
      }

      // Check if email already exists to be double sure
      const usersRef = db.collection("users");
      const existingUserSnapshot = await usersRef.where("email", "==", email).get();
      if (!existingUserSnapshot.empty) {
        return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado no sistema." });
      }

      const barbershopId = uuidv4();
      const userId = uuidv4();
      const bookingToken = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      
      let baseSlug = generateSlug(barbershopName);
      let finalSlug = baseSlug;
      let counter = 1;
      
      // Ensure unique slug (sequential check - in real app, indexes or different structures are better)
      const shopsRef = db.collection("barbershops");
      while (true) {
        const slugQuery = await shopsRef.where("slug", "==", finalSlug).get();
        if (slugQuery.empty) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const now = new Date();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(now.getDate() + 21);

      let appliedCoupon = null;
      let discountPercent = null;
      if (req.body.coupon) {
        const uppercaseCoupon = req.body.coupon.trim().toUpperCase();
        const couponDoc = await db.collection("coupons").doc(uppercaseCoupon).get();
        if (couponDoc.exists) {
          appliedCoupon = uppercaseCoupon;
          discountPercent = couponDoc.data()?.discountPercent;
        } else if (VALID_COUPONS[uppercaseCoupon]) {
          appliedCoupon = uppercaseCoupon;
          discountPercent = VALID_COUPONS[uppercaseCoupon];
        }
      }

      const barbershopData = {
        id: barbershopId,
        name: barbershopName,
        slug: finalSlug,
        phone: phone || null,
        email,
        subscriptionStatus: "trial",
        trialEndsAt: trialEndsAt.toISOString(),
        createdAt: now.toISOString(),
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        appliedCoupon,
        discountPercent
      };

      const userData = {
        id: userId,
        barbershopId: barbershopId,
        name: adminName,
        email,
        passwordHash,
        role: "admin",
        bookingToken,
        createdAt: now.toISOString()
      };

      // Create in Firestore
      await shopsRef.doc(barbershopId).set(barbershopData);
      await usersRef.doc(userId).set(userData);

      // Clean up the registration email verification document
      await verificationDoc.ref.delete();

      const token = signToken({
        id: userId,
        email,
        role: "admin",
        barbershopId: barbershopId
      });

      res.status(201).json({
        token,
        user: { id: userId, name: adminName, email, role: "admin" },
        barbershop: { id: barbershopId, name: barbershopName, slug: finalSlug }
      });
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.errors || "Failed to register" });
    }
  });

  app.get("/api/auth/verify-coupon/:code", async (req: Request, res: Response) => {
    try {
      const code = req.params.code.trim().toUpperCase();
      const couponDoc = await db.collection("coupons").doc(code).get();
      if (couponDoc.exists) {
        return res.json({
          valid: true,
          code,
          discountPercent: couponDoc.data()?.discountPercent
        });
      }

      if (VALID_COUPONS[code] !== undefined) {
        return res.json({
          valid: true,
          code,
          discountPercent: VALID_COUPONS[code]
        });
      } else {
        return res.status(404).json({
          valid: false,
          error: "Cupom inválido ou expirado."
        });
      }
    } catch (err: any) {
      console.error("Error verifying coupon:", err);
      res.status(500).json({ error: "Erro interno ao processar o cupom." });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("email", "==", email).get();

      if (userSnapshot.empty) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userDoc = userSnapshot.docs[0];
      const user = userDoc.data();

      if (!(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Proactive Fix: generate bookingToken if missing
      if (!user.bookingToken) {
        user.bookingToken = uuidv4();
        await userDoc.ref.update({ bookingToken: user.bookingToken });
      }

      // Fetch barbershop info for the slug and name (Manual JOIN)
      const shopDoc = await db.collection("barbershops").doc(user.barbershopId).get();
      const shop = shopDoc.exists ? shopDoc.data() : { name: "Barbearia", slug: "" };

      const token = signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        barbershopId: user.barbershopId
      });

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        barbershop: { id: user.barbershopId, name: shop?.name, slug: shop?.slug }
      });
    } catch (err: any) {
      console.error("Login error full details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      res.status(400).json({ error: "Invalid login attempt" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("email", "==", email).get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: "E-mail não cadastrado no sistema." });
      }

      // Generate a 6-digit numeric code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

      // Store in password_recoveries (keyed by email to overwrite older requests)
      await db.collection("password_recoveries").doc(email).set({
        email,
        code,
        expiresAt,
        createdAt: new Date().toISOString()
      });

      const emailUser = process.env.SUPPORT_EMAIL_USER || "";
      const emailPass = process.env.SUPPORT_EMAIL_PASS || "";

      let emailSent = false;
      let emailError = null;

      if (emailUser && emailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: emailUser,
              pass: emailPass,
            },
          });

          const mailOptions = {
            from: `"Suporte BarberTool" <${emailUser}>`,
            to: email,
            subject: "[BarberTool] Seu código de recuperação de conta",
            text: `Olá!\n\nVocê solicitou a recuperação de acesso ao painel do BarberTool.\n\nSeu código de recuperação é: ${code}\n\nEste código é válido por 15 minutos e só pode ser utilizado uma vez.\n\nSe você não realizou esta solicitação, ignore este e-mail.\n\nAtenciosamente,\nEquipe BarberTool`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff; color: #111111; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="color: #111111; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">BarberTool</h2>
                  <p style="color: #666666; font-size: 12px; margin: 5px 0 0 0;">Recuperação de Acesso</p>
                </div>
                
                <p style="font-size: 14px; line-height: 1.6; color: #333333; margin-top: 0;">Olá,</p>
                <p style="font-size: 14px; line-height: 1.6; color: #333333;">Recebemos uma solicitação para recuperar o acesso à sua conta de administrador do painel BarberTool. Use o código abaixo para redefinir sua senha:</p>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 12px;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: 950; letter-spacing: 6px; color: #111111;">${code}</span>
                </div>
                
                <p style="font-size: 12px; color: #777777; line-height: 1.6; text-align: center; margin-top: 25px;">
                  Este código é válido por <strong>15 minutos</strong> e expira automaticamente após esse período.
                </p>
                
                <div style="border-t: 1px solid #f0f0f0; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 11px; color: #a0a0a0;">
                  Se você não solicitou este código, por favor desconsidere este e-mail.
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
        } catch (err: any) {
          console.error("Failed to send SMTP email for validation:", err);
          emailError = err.message || err;
        }
      }

      if (!emailSent) {
        // Fallback for development/sandbox where SUPPORT_EMAIL is not yet configured
        return res.json({
          success: true,
          warning: "Configuração de e-mail de envio (SUPPORT_EMAIL_USER / SUPPORT_EMAIL_PASS) ausente ou incorreta no servidor. Como estamos em modo teste, seu código foi gerado com sucesso.",
          code: code // Exposed for seamless sandbox developer flow!
        });
      }

      res.json({
        success: true,
        message: "Código de recuperação enviado para o e-mail informado."
      });
    } catch (err: any) {
      console.error("Forgot password API error:", err);
      res.status(500).json({ error: "Ocorreu um erro ao processar a solicitação." });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, password } = resetPasswordSchema.parse(req.body);

      const recoveryDoc = await db.collection("password_recoveries").doc(email).get();
      if (!recoveryDoc.exists) {
        return res.status(404).json({ error: "Nenhum código de recuperação encontrado ou solicitado para este e-mail." });
      }

      const recoveryData = recoveryDoc.data();
      
      // Verify code match
      if (recoveryData?.code !== code) {
        return res.status(400).json({ error: "Código de recuperação inválido ou incorreto." });
      }

      // Verify expiration
      if (new Date() > new Date(recoveryData?.expiresAt)) {
        return res.status(400).json({ error: "O código de recuperação expirou (máximo de 15 minutos). Solicite um novo." });
      }

      // Update password hash inside users collection
      const usersRef = db.collection("users");
      const userSnapshot = await usersRef.where("email", "==", email).get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: "E-mail de usuário correspondente não encontrado." });
      }

      const newPasswordHash = await bcrypt.hash(password, 10);
      
      // Update all associated user records for this email
      const batch = db.batch();
      userSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { passwordHash: newPasswordHash });
      });
      await batch.commit();

      // Clean up the recovery doc
      await recoveryDoc.ref.delete();

      res.json({
        success: true,
        message: "Sua senha foi atualizada com sucesso! Você já pode entrar com as novas credenciais."
      });
    } catch (err: any) {
      console.error("Reset password API error:", err);
      res.status(500).json({ error: "Ocorreu um erro ao processar a redefinição de senha." });
    }
  });
}

