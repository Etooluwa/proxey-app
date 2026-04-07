import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import PDFDocument from "pdfkit";
import https from "node:https";
import { pathToFileURL } from "node:url";
import * as XLSX from "xlsx";
import {
  getVerifiedProviderId,
  getVerifiedUserId,
  isAdminUser,
  resolveVerifiedUser,
} from "./lib/auth.js";
import {
  assertBookingLeadTime,
  normalizeProviderBookingRules,
} from "./lib/bookingRules.js";
import { createAcceptBookingHandler } from "./lib/acceptBookingHandler.js";
import { createBookingHandler } from "./lib/createBookingHandler.js";
import { createCancelBookingHandler } from "./lib/cancelBookingHandler.js";
import { createChargedBookingHandler } from "./lib/createChargedBookingHandler.js";
import { createCompleteBookingHandler } from "./lib/completeBookingHandler.js";
import { createRequestTimeBookingHandler } from "./lib/createRequestTimeBookingHandler.js";
import { createRescheduleBookingHandler } from "./lib/rescheduleBookingHandler.js";
import { isAllowedImageContentType, sanitizeFilename } from "./lib/uploads.js";

dotenv.config();

const IS_DIRECT_RUN =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY. Add it to server/.env before starting the server."
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-09-30.acacia",
});

const PLATFORM_CURRENCY = "cad";
const PLATFORM_FEE_RATE = 0.10;
const WEB_PUSH_ENABLED = process.env.ENABLE_WEB_PUSH === "true";
const WEB_PUSH_PUBLIC_KEY = process.env.WEB_PUSH_PUBLIC_KEY || "";
const WEB_PUSH_PRIVATE_KEY = process.env.WEB_PUSH_PRIVATE_KEY || "";
const WEB_PUSH_SUBJECT = process.env.WEB_PUSH_SUBJECT || "mailto:info@mykliques.com";

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    : null;

const app = express();

// Trust Render's proxy so rate limiting uses real client IPs
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow media assets cross-origin
  contentSecurityPolicy: false, // CSP handled by frontend (React)
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const LOADTEST_BYPASS_HEADER = "x-loadtest-bypass";
const RATE_LIMIT_BYPASS_ENABLED =
  process.env.NODE_ENV !== "production" &&
  process.env.ENABLE_LOADTEST_RATE_LIMIT_BYPASS === "true" &&
  Boolean(process.env.LOADTEST_BYPASS_KEY);

function shouldBypassRateLimit(req) {
  if (!RATE_LIMIT_BYPASS_ENABLED) return false;

  const providedKey = req.get(LOADTEST_BYPASS_HEADER);
  return providedKey === process.env.LOADTEST_BYPASS_KEY;
}

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 300,                   // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: shouldBypassRateLimit,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
  skip: shouldBypassRateLimit,
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 60,                    // 60 messages per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Sending too fast, please slow down.' },
  skip: shouldBypassRateLimit,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/messages/', messageLimiter);

// Stricter limiter for sensitive auth endpoints (check-email, send-password-setup)
const sensitiveAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
  skip: shouldBypassRateLimit,
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://mykliques.com',
  'https://www.mykliques.com',
  'https://proxey-app-git-feature-prototype-migration-eto-seguns-projects.vercel.app',
  'https://proxey-app.vercel.app',
  /\.vercel\.app$/,      // Allow all Vercel preview deployments
  /\.onrender\.com$/,    // Allow all Render deployments
  /\.mykliques\.com$/,   // Allow all mykliques subdomains
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or matches regex
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const jsonMiddleware = express.json();
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    jsonMiddleware(req, res, next);
  }
});

app.get("/", (req, res) => {
  res.send("Booking App Backend Running 🚀");
});

// Health check — used by frontend to warm up the server on cold start
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/push/public-key", (req, res) => {
  res.status(200).json({ publicKey: WEB_PUSH_PUBLIC_KEY || null });
});

app.post("/api/client/push-subscriptions", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const userId = getUserId(req);
  const { subscription } = req.body || {};

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: "Valid push subscription is required." });
  }

  try {
    const record = await saveClientPushSubscription(
      userId,
      subscription,
      req.headers["user-agent"] || null,
    );

    return res.status(201).json({ subscription: record });
  } catch (error) {
    console.error("[push-subscriptions] Failed to save subscription:", error);
    return res.status(500).json({ error: "Failed to save push subscription." });
  }
});

// ============================================
// NOTIFICATION HELPERS
// ============================================

/**
 * Create a notification for a provider
 * @param {string} providerId - Provider's user ID
 * @param {object} notification - { type, title, body, data, request_id, booking_id }
 */
async function createProviderNotification(providerId, notification) {
  if (!supabase || !providerId) return null;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        provider_id: providerId,
        type: notification.type || 'general',
        title: notification.title,
        body: notification.body || null,
        data: notification.data || {},
        request_id: notification.request_id || null,
        booking_id: notification.booking_id || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[notifications] Failed to create provider notification:", error);
      return null;
    }

    console.log("[notifications] Created provider notification:", data.id);
    return data;
  } catch (error) {
    console.error("[notifications] Error creating provider notification:", error);
    return null;
  }
}

async function getProviderNotifPrefs(providerId) {
  if (!supabase || !providerId) return { prefs: {} };

  const { data } = await supabase
    .from("provider_profiles")
    .select("notification_preferences, email, business_name, name")
    .eq("provider_id", providerId)
    .maybeSingle();

  return {
    prefs: data?.notification_preferences || {},
    email: data?.email || null,
    name: data?.business_name || data?.name || null,
  };
}

async function getProviderBookingSettings(providerId) {
  if (!supabase || !providerId) return {};

  const { data } = await supabase
    .from("provider_profiles")
    .select("booking_settings")
    .eq("provider_id", providerId)
    .maybeSingle();

  return data?.booking_settings || {};
}

function getProviderPushPrefKey(type) {
  const normalized = String(type || "").toLowerCase();

  if (["booking_request", "new_booking", "time_request", "booking_cancelled"].includes(normalized)) {
    return "push_new_bookings";
  }

  if (["booking_accepted", "booking_declined", "time_request_accepted", "time_request_declined"].includes(normalized)) {
    return "push_confirmations";
  }

  if (["new_message"].includes(normalized)) {
    return "push_messages";
  }

  if (["session_reminder"].includes(normalized)) {
    return "push_reminders";
  }

  if (["bank", "payout", "payout_update"].includes(normalized)) {
    return "push_payouts";
  }

  return null;
}

function getClientPushPrefKey(type) {
  const normalized = String(type || "").toLowerCase();

  if ([
    "accepted",
    "rejected",
    "booking_accepted",
    "booking_declined",
    "time_request_accepted",
    "time_request_declined",
  ].includes(normalized)) {
    return "push_booking_confirmations";
  }

  if (["session_reminder"].includes(normalized)) {
    return "push_reminders";
  }

  if (["session_complete", "booking_completed"].includes(normalized)) {
    return "push_review_requests";
  }

  return null;
}

/**
 * Create a notification for a client
 * @param {string} userId - Client's user ID
 * @param {object} notification - { type, title, body, data, request_id, booking_id }
 */
async function createClientNotification(userId, notification) {
  if (!supabase || !userId) return null;
  // v2: booking_id/request_id stored in data JSONB (no dedicated columns)

  try {
    // Merge booking_id / request_id into the data JSONB field
    // (client_notifications table has no booking_id or request_id columns)
    const dataPayload = {
      ...(notification.data || {}),
      ...(notification.booking_id ? { booking_id: notification.booking_id } : {}),
      ...(notification.request_id ? { request_id: notification.request_id } : {}),
    };

    const { data, error } = await supabase
      .from("client_notifications")
      .insert({
        user_id: userId,
        type: notification.type || 'general',
        title: notification.title,
        body: notification.body || null,
        data: dataPayload,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[notifications] Failed to create client notification:", error);
      return null;
    }

    console.log("[notifications] Created client notification:", data.id);
    return data;
  } catch (error) {
    console.error("[notifications] Error creating client notification:", error);
    return null;
  }
}

// ─── PDF buffer helper — builds invoice PDF in memory ────────────────────────
function generateInvoicePdfBuffer(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 60 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const INK = '#3D231E', MUTED = '#8C6A64', FADED = '#B0948F', ACCENT = '#C25E4A', LINE = '#D4C0BA';
      const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const fmtM = (cents) => { const v = cents != null ? (cents >= 100 ? cents / 100 : cents) : 0; return `$${(+v).toFixed(2)}`; };
      const RIGHT_X = 540;
      const businessName = invoice.business_name || 'Provider';

      let y = 60;
      doc.font('Helvetica-Bold').fontSize(20).fillColor(INK).text(businessName, 60, y); y += 28;
      if (invoice.business_address) { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.business_address, 60, y); y += 15; }
      if (invoice.business_email)   { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.business_email, 60, y); y += 15; }
      if (invoice.business_phone)   { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.business_phone, 60, y); y += 15; }

      const paidLabel = invoice.status === 'paid' ? 'PAID' : (invoice.status || 'PENDING').toUpperCase();
      const badgeColor = invoice.status === 'paid' ? '#5A8A5E' : ACCENT;
      doc.rect(RIGHT_X - 54, 60, 54, 22).fillAndStroke(badgeColor, badgeColor);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF').text(paidLabel, RIGHT_X - 54, 66, { width: 54, align: 'center' });

      y = Math.max(y + 12, 130);
      doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke(); y += 12;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(`Invoice #${invoice.invoice_number || invoice.id}`, 60, y);
      doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(`Date: ${fmtD(invoice.issued_at)}`, 0, y, { align: 'right' }); y += 24;
      doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

      y += 16;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(FADED).text('BILLED TO', 60, y, { characterSpacing: 1 }); y += 16;
      doc.font('Helvetica-Bold').fontSize(11).fillColor(INK).text(invoice.client_name || 'Client', 60, y); y += 15;
      if (invoice.client_email) { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.client_email, 60, y); y += 14; }
      y += 8;
      doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

      y += 16;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(FADED).text('SERVICE DETAILS', 60, y, { characterSpacing: 1 }); y += 16;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(invoice.service_name || 'Service', 60, y); y += 17;
      if (invoice.service_description) {
        doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(invoice.service_description, 60, y, { width: 380, lineGap: 2 });
        y += doc.heightOfString(invoice.service_description, { width: 380 }) + 8;
      }
      const parts = [];
      if (invoice.date_of_service) parts.push(`Date: ${fmtD(invoice.date_of_service)}`);
      if (invoice.duration) parts.push(`Duration: ${invoice.duration}`);
      if (parts.length) { doc.font('Helvetica').fontSize(10).fillColor(MUTED).text(parts.join('  ·  '), 60, y); y += 16; }
      y += 8;
      doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

      y += 16;
      const li = (label, amount, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor(bold ? INK : MUTED).text(label, 60, y);
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor(bold ? INK : MUTED).text(amount, 0, y, { align: 'right' });
        y += 20;
      };
      li('Subtotal', fmtM(invoice.subtotal));
      if (invoice.deposit_amount > 0) { li('Deposit paid', `−${fmtM(invoice.deposit_amount)}`); li('Remaining charged', fmtM(invoice.remaining_amount)); }
      y += 4;
      doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke(); y += 12;
      li('Total', fmtM(invoice.total), true);

      y += 8;
      doc.font('Helvetica').fontSize(10).fillColor(invoice.status === 'paid' ? '#5A8A5E' : ACCENT)
        .text(invoice.status === 'paid' ? `Payment received via Stripe · ${fmtD(invoice.issued_at)}` : 'Payment pending', 60, y);

      doc.moveTo(60, 720).lineTo(RIGHT_X, 720).strokeColor(LINE).lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(9).fillColor(FADED)
        .text(`Invoice generated by ${businessName} · Powered by Kliques`, 60, 730, { align: 'center', width: RIGHT_X - 60 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Email helper (Resend REST API via built-in https) ───────────────────────
async function sendEmail({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[sendEmail] Skipped "${subject || "email"}" because RESEND_API_KEY is not configured.`);
    return;
  }
  if (!to) {
    console.warn(`[sendEmail] Skipped "${subject || "email"}" because no recipient email was provided.`);
    return;
  }
  return new Promise((resolve) => {
    const payload = {
      from: 'Kliques <noreply@mykliques.com>',
      to: [to],
      subject,
      html,
    };
    if (attachments?.length) payload.attachments = attachments;
    const body = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk.toString();
      });
      res.resume();
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.warn(`[sendEmail] Resend returned ${res.statusCode} for "${subject || "email"}" to ${to}: ${responseBody}`);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.warn(`[sendEmail] Failed to send "${subject || "email"}" to ${to}:`, e.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

// ─── Helper: fetch client notification preferences ────────────────────────────
async function getClientNotifPrefs(userId) {
  if (!supabase || !userId) return {};
  const { data } = await supabase
    .from('client_profiles')
    .select('notification_preferences, email, name')
    .eq('user_id', userId)
    .maybeSingle();
  return {
    prefs: data?.notification_preferences || {},
    email: data?.email || null,
    name: data?.name || null,
  };
}

async function notifyProviderCompletionChargeResult(booking, {
  paymentStatus,
  serviceName,
  clientName,
  chargedAmountCents = 0,
  failureReason = null,
} = {}) {
  if (!booking?.provider_id) return;

  const serviceLabel = serviceName || booking.service_name || "your service";
  const clientLabel = clientName || booking.client_name || "your client";
  const amountLabel = `$${((Math.max(Number(chargedAmountCents) || 0, 0)) / 100).toFixed(2)}`;
  const isFailed = paymentStatus === "payment_failed";
  const title = isFailed ? "Charge failed" : "Charge successful";
  const body = isFailed
    ? `${clientLabel}'s card could not be charged for ${serviceLabel}. ${failureReason || "Ask the client to update their payment method and try again."}`
    : `${clientLabel}'s card was charged ${amountLabel} for ${serviceLabel}.`;

  await createProviderNotification(booking.provider_id, {
    type: isFailed ? "payment_failed" : "payment_succeeded",
    title,
    body,
    booking_id: booking.id,
    data: {
      booking_id: booking.id,
      client_id: booking.client_id,
      client_name: clientLabel,
      service_name: serviceLabel,
      payment_status: paymentStatus,
      charged_amount_cents: chargedAmountCents,
      failure_reason: failureReason,
    },
  }).catch(() => {});

  if (!isFailed) return;

  const { prefs, email: providerEmail, name: providerName } = await getProviderNotifPrefs(booking.provider_id).catch(() => ({}));
  if (prefs?.email_payout_updates === false || !providerEmail) return;

  await sendEmail({
    to: providerEmail,
    subject: `Charge failed — ${serviceLabel}`,
    html: `
      <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;color:#3D231E">
        <div style="background:#FDEDEA;padding:28px 24px;border-radius:16px 16px 0 0;text-align:center">
          <div style="width:56px;height:56px;background:#B04040;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
            <span style="color:white;font-size:24px">!</span>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#8F2E2E">Charge failed</h1>
        </div>
        <div style="background:#FBF7F2;padding:24px;border-radius:0 0 16px 16px">
          <p style="margin:0 0 12px">Hi ${providerName || 'there'},</p>
          <p style="margin:0 0 16px;color:#8C6A64">We couldn't charge <strong>${clientLabel}</strong> for <strong>${serviceLabel}</strong>, so this booking was not marked complete.</p>
          <div style="background:#FDEDEA;border-radius:12px;padding:16px;margin-bottom:20px;border-left:3px solid #B04040">
            <p style="margin:0;font-size:13px;color:#8F2E2E;font-weight:600">Reason: ${failureReason || 'Payment could not be processed.'}</p>
          </div>
          <p style="margin:0 0 20px;color:#8C6A64">Open the booking, ask the client to update their payment method, then try Mark Complete again.</p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="https://mykliques.com/provider/appointments/${booking.id}" style="display:inline-block;background:#3D231E;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:15px">View booking →</a>
          </div>
          <p style="margin:0;font-size:12px;color:#B0948F;text-align:center">Kliques · mykliques.com</p>
        </div>
      </div>`,
  }).catch(() => {});
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = String(input || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(String(input || "").length / 4) * 4, "=");
  return Buffer.from(normalized, "base64");
}

function getWebPushKeyMaterial() {
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY) return null;

  try {
    const publicKeyBytes = base64UrlDecode(WEB_PUSH_PUBLIC_KEY);
    const privateKeyBytes = base64UrlDecode(WEB_PUSH_PRIVATE_KEY);

    if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04 || privateKeyBytes.length !== 32) {
      return null;
    }

    const x = base64UrlEncode(publicKeyBytes.subarray(1, 33));
    const y = base64UrlEncode(publicKeyBytes.subarray(33, 65));
    const d = base64UrlEncode(privateKeyBytes);

    const privateKey = crypto.createPrivateKey({
      key: {
        kty: "EC",
        crv: "P-256",
        x,
        y,
        d,
      },
      format: "jwk",
    });

    return {
      publicKey: WEB_PUSH_PUBLIC_KEY,
      privateKey,
    };
  } catch (error) {
    console.warn("[push] Invalid VAPID key material:", error.message);
    return null;
  }
}

const webPushKeyMaterial = getWebPushKeyMaterial();

function createVapidJwt(audience) {
  if (!webPushKeyMaterial) return null;

  const header = base64UrlEncode(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = base64UrlEncode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60),
    sub: WEB_PUSH_SUBJECT,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.sign("sha256", Buffer.from(unsignedToken), {
    key: webPushKeyMaterial.privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

function sendPushRequest(subscription, notification) {
  if (!subscription?.endpoint || !webPushKeyMaterial) {
    return Promise.resolve({ ok: false, statusCode: 0 });
  }

  const endpointUrl = new URL(subscription.endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const vapidJwt = createVapidJwt(audience);

  return new Promise((resolve) => {
    const req = https.request({
      hostname: endpointUrl.hostname,
      port: endpointUrl.port || 443,
      path: `${endpointUrl.pathname}${endpointUrl.search}`,
      method: "POST",
      headers: {
        TTL: "60",
        Urgency: "high",
        Topic: notification.tag || "booking-confirmed",
        Authorization: `vapid t=${vapidJwt}, k=${webPushKeyMaterial.publicKey}`,
        "Crypto-Key": `p256ecdsa=${webPushKeyMaterial.publicKey}`,
        "Content-Length": 0,
      },
    }, (response) => {
      response.resume();
      response.on("end", () => {
        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode || 0,
        });
      });
    });

    req.on("error", (error) => {
      console.warn("[push] request failed:", error.message);
      resolve({ ok: false, statusCode: 0 });
    });

    req.end();
  });
}

async function saveClientPushSubscription(userId, subscription, userAgent) {
  if (!supabase || !userId || !subscription?.endpoint) return null;

  const keyData = subscription.keys || {};
  if (!keyData.p256dh || !keyData.auth) return null;

  const { data, error } = await supabase
    .from("client_push_subscriptions")
    .upsert({
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: keyData.p256dh,
      auth: keyData.auth,
      user_agent: userAgent || null,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "endpoint" })
    .select()
    .single();

  if (error) {
    console.warn("[push] Failed to save client push subscription:", error.message);
    return null;
  }

  return data;
}

async function deleteClientPushSubscription(endpoint) {
  if (!supabase || !endpoint) return;
  await supabase
    .from("client_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
}

async function sendClientPushNotification(userId, notification) {
  // Browser push is disabled for the web app unless explicitly enabled for a
  // future native/mobile push pipeline.
  if (!WEB_PUSH_ENABLED) return;

  if (!supabase || !userId || !webPushKeyMaterial) return;

  const prefKey = getClientPushPrefKey(notification?.type);
  if (prefKey) {
    const { prefs } = await getClientNotifPrefs(userId);
    if (prefs?.[prefKey] === false) return;
  }

  const { data: subscriptions, error } = await supabase
    .from("client_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subscriptions?.length) return;

  await Promise.all(subscriptions.map(async (subscription) => {
    const result = await sendPushRequest({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }, notification);

    if ([404, 410].includes(result.statusCode)) {
      await deleteClientPushSubscription(subscription.endpoint);
    }
  }));
}

// ─── Helper: fetch provider email + name ─────────────────────────────────────
async function getProviderEmailInfo(providerId) {
  if (!supabase || !providerId) return {};
  const { data: providerRow } = await supabase
    .from('providers')
    .select('email, name, business_name')
    .eq('user_id', providerId)
    .maybeSingle();

  const { data: profileRow } = await supabase
    .from('provider_profiles')
    .select('email, name, business_name')
    .eq('provider_id', providerId)
    .maybeSingle();

  const name = providerRow?.business_name || providerRow?.name || profileRow?.business_name || profileRow?.name || null;
  const profileEmail = providerRow?.email || profileRow?.email || null;

  if (profileEmail) return { email: profileEmail, name };

  // Fall back to auth.users if no email in profile tables
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(providerId);
    return { email: authUser?.user?.email || null, name };
  } catch {
    return { email: null, name };
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
function emailBase(bodyHtml) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FBF7F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(140,106,100,0.15);">
<tr><td style="background:#FDDCC6;padding:28px 32px;">
  <span style="font-size:22px;font-weight:600;color:#3D231E;letter-spacing:-0.02em;">kliques</span>
</td></tr>
<tr><td style="padding:32px;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid rgba(140,106,100,0.15);">
  <p style="margin:0;font-size:12px;color:#B0948F;">You're receiving this because you have an account on <a href="https://mykliques.com" style="color:#C25E4A;text-decoration:none;">mykliques.com</a>.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

async function sendClientBookingConfirmedEmail({ to, providerName, serviceName, scheduledAt, preAppointmentInfo }) {
  if (!to) return;

  const resolvedProvider = providerName || "Your provider";
  const resolvedService = serviceName || "Service";

  const mustKnowsHtml = preAppointmentInfo?.length
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5E6;border-radius:14px;padding:16px 20px;margin-top:20px;border:1px solid rgba(194,94,74,0.15);">
        <tr><td style="font-size:12px;color:#C25E4A;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;padding-bottom:12px;">Before your appointment</td></tr>
        ${preAppointmentInfo.filter(Boolean).map(item => `
        <tr><td style="font-size:14px;color:#3D231E;line-height:1.6;padding-bottom:8px;">• ${item}</td></tr>
        `).join('')}
      </table>`
    : '';

  return sendEmail({
    to,
    subject: `Your booking is confirmed — ${fmtDate(scheduledAt)}`,
    html: emailBase(`
      <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;color:#331D19;">Booking confirmed</h1>
      <p style="margin:0 0 24px;color:#8C6A64;font-size:15px;line-height:1.6;">Your appointment has been confirmed.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3ECE7;border-radius:16px;padding:20px 24px;">
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Provider</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;padding-bottom:16px;">${resolvedProvider}</td></tr>
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Service</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;padding-bottom:16px;">${resolvedService}</td></tr>
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Date &amp; Time</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;">${fmtDate(scheduledAt)}</td></tr>
      </table>
      ${mustKnowsHtml}
      <p style="margin:24px 0 0;color:#8C6A64;font-size:14px;">You can view your appointment details anytime in Kliques.</p>
    `),
  });
}

async function sendProviderNewBookingEmail({ to, clientName, serviceName, scheduledAt, autoAccepted = false }) {
  if (!to) return;

  const resolvedClient = clientName || "A client";
  const resolvedService = serviceName || "a service";

  return sendEmail({
    to,
    subject: autoAccepted
      ? `New booking confirmed — ${fmtDate(scheduledAt)}`
      : `New booking request — ${fmtDate(scheduledAt)}`,
    html: emailBase(`
      <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;color:#331D19;">${autoAccepted ? "New booking confirmed" : "New booking request"}</h1>
      <p style="margin:0 0 24px;color:#8C6A64;font-size:15px;line-height:1.6;">
        ${autoAccepted
          ? `${resolvedClient} booked ${resolvedService} and the appointment was confirmed automatically.`
          : `${resolvedClient} booked ${resolvedService} and is waiting for your confirmation.`}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3ECE7;border-radius:16px;padding:20px 24px;">
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Client</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;padding-bottom:16px;">${resolvedClient}</td></tr>
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Service</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;padding-bottom:16px;">${resolvedService}</td></tr>
        <tr><td style="font-size:12px;color:#B0948F;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:4px;">Date &amp; Time</td></tr>
        <tr><td style="font-size:16px;font-weight:600;color:#331D19;">${fmtDate(scheduledAt)}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#8C6A64;font-size:14px;">Open Kliques to review the appointment.</p>
    `),
  });
}

// ─── Session reminder scheduler (runs every 5 min) ───────────────────────────
// Sends an in-app reminder 3 hours before confirmed appointments.
if (IS_DIRECT_RUN) {
  setInterval(async () => {
    if (!supabase) return;
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() + 2.75 * 60 * 60 * 1000); // 2h45m from now
      const windowEnd   = new Date(now.getTime() + 3.25 * 60 * 60 * 1000); // 3h15m from now

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, client_id, provider_id, scheduled_at, service_name, services(name)')
        .eq('status', 'confirmed')
        .gte('scheduled_at', windowStart.toISOString())
        .lte('scheduled_at', windowEnd.toISOString());

      if (!bookings?.length) return;

      for (const booking of bookings) {
        // Check if reminder already sent for this booking
        const { data: existingReminders } = await supabase
          .from('client_notifications')
          .select('id, data')
          .eq('user_id', booking.client_id)
          .eq('type', 'session_reminder');
        const reminderAlreadySent = (existingReminders || []).some(
          (row) => row?.data?.booking_id === booking.id
        );
        if (reminderAlreadySent) continue;

        const svcName = booking.services?.name || booking.service_name || 'your session';
        const displayTime = new Date(booking.scheduled_at).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
        });
        const displayDate = new Date(booking.scheduled_at).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        });

        await createClientNotification(booking.client_id, {
          type: 'session_reminder',
          title: 'Session in 3 hours',
          body: `Reminder: ${svcName} on ${displayDate} at ${displayTime}`,
          booking_id: booking.id,
          data: { provider_id: booking.provider_id, scheduled_at: booking.scheduled_at },
        });
      }
    } catch (err) {
      console.warn('[session-reminder] error:', err.message);
    }
  }, 5 * 60 * 1000);
}

// ============================================

// Service categories endpoint
const SERVICE_CATEGORIES = [
  { id: "vocal-coaching", label: "Vocal Coaching" },
  { id: "music-lessons", label: "Music Lessons" },
  { id: "dance-instruction", label: "Dance Instruction" },
  { id: "fitness-training", label: "Fitness Training" },
  { id: "yoga-pilates", label: "Yoga & Pilates" },
  { id: "massage-therapy", label: "Massage Therapy" },
  { id: "mental-wellness", label: "Mental Wellness" },
  { id: "nutrition-coaching", label: "Nutrition Coaching" },
  { id: "hair-styling", label: "Hair Styling" },
  { id: "barbering", label: "Barbering" },
  { id: "braiding-locs", label: "Braiding & Locs" },
  { id: "makeup", label: "Makeup" },
  { id: "nails", label: "Nails" },
  { id: "lashes-brows", label: "Lashes & Brows" },
  { id: "skincare-esthetics", label: "Skincare & Esthetics" },
  { id: "spa-body-treatments", label: "Spa & Body Treatments" },
  { id: "tattoo-piercing", label: "Tattoo & Piercing" },
  { id: "photography", label: "Photography" },
  { id: "videography", label: "Videography" },
  { id: "event-planning", label: "Event Planning" },
  { id: "dj-entertainment", label: "DJ & Music Entertainment" },
  { id: "catering-private-chef", label: "Catering & Private Chef" },
  { id: "decor-event-design", label: "Decor & Event Design" },
  { id: "home-cleaning", label: "Home Cleaning" },
  { id: "deep-cleaning", label: "Deep Cleaning" },
  { id: "home-organization", label: "Home Organization" },
  { id: "moving-hauling", label: "Moving & Hauling" },
  { id: "handyman", label: "Handyman" },
  { id: "electrical", label: "Electrical" },
  { id: "plumbing", label: "Plumbing" },
  { id: "painting", label: "Painting" },
  { id: "landscaping", label: "Landscaping" },
  { id: "auto-detailing", label: "Auto Detailing" },
  { id: "auto-repair", label: "Auto Repair" },
  { id: "pet-grooming", label: "Pet Grooming" },
  { id: "pet-care", label: "Pet Care" },
  { id: "childcare", label: "Childcare" },
  { id: "tutoring", label: "Tutoring" },
  { id: "language-coaching", label: "Language Coaching" },
  { id: "business-consulting", label: "Business Consulting" },
  { id: "marketing-branding", label: "Marketing & Branding" },
  { id: "design-creative", label: "Design & Creative" },
  { id: "tech-support", label: "Tech Support" },
  { id: "delivery-errands", label: "Delivery & Errands" },
];

app.get("/api/categories", (req, res) => {
  res.status(200).json({ categories: SERVICE_CATEGORIES });
});

const memoryStore = {
  services: [
    {
      id: "svc-home-clean",
      name: "Home Cleaning",
      description: "Thorough cleaning for condos, apartments, and houses.",
      category: "Home",
      basePrice: 12000,
      unit: "per visit",
      duration: 120,
    },
    {
      id: "svc-personal-training",
      name: "Personal Training",
      description: "One-on-one fitness session tailored to your goals.",
      category: "Wellness",
      basePrice: 9000,
      unit: "per hour",
      duration: 60,
    },
    {
      id: "svc-mobile-barber",
      name: "Mobile Barber",
      description: "Professional haircut and grooming at your location.",
      category: "Grooming",
      basePrice: 6500,
      unit: "per visit",
      duration: 45,
    },
  ],
  providers: [
    {
      id: "prov-ella-hughes",
      name: "Ella Hughes",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      rating: 4.9,
      reviewCount: 184,
      location: "Toronto, ON",
      categories: ["Home", "Cleaning"],
      hourlyRate: 4500,
      headline: "Luxury home cleaning specialist",
      servicesOffered: ["svc-home-clean"],
    },
    {
      id: "prov-malik-thomas",
      name: "Malik Thomas",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      rating: 4.7,
      reviewCount: 96,
      location: "Mississauga, ON",
      categories: ["Wellness"],
      hourlyRate: 5500,
      headline: "Certified personal trainer & nutrition coach",
      servicesOffered: ["svc-personal-training"],
    },
    {
      id: "prov-amelia-chan",
      name: "Amelia Chan",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      rating: 4.8,
      reviewCount: 72,
      location: "Brampton, ON",
      categories: ["Grooming"],
      hourlyRate: 4000,
      headline: "Mobile barber serving the GTA",
      servicesOffered: ["svc-mobile-barber"],
    },
  ],
  bookings: [],
  providerProfiles: [
    {
      providerId: "prov-ella-hughes",
      name: "Ella Hughes",
      phone: "+1 (437) 555-0123",
      categories: ["Home Cleaning", "Organization"],
      hourlyRate: 6500,
      hourly_rate: 6500,
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      bio: "Luxury home cleaning specialist serving downtown Toronto and midtown.",
      schedule: [
        { day: "Monday", startTime: "09:00", endTime: "17:00", available: true },
        { day: "Wednesday", startTime: "10:00", endTime: "18:00", available: true },
        { day: "Friday", startTime: "09:00", endTime: "15:00", available: true },
      ],
    },
  ],
  providerJobs: [
    {
      id: "job-001",
      providerId: "prov-ella-hughes",
      clientName: "Michael Green",
      serviceName: "Deep Clean",
      status: "active",
      scheduledAt: hoursFromNow(2),
      price: 18000,
      location: "92 Wellington St W, Toronto",
      notes: "Focus on kitchen appliances.",
    },
    {
      id: "job-002",
      providerId: "prov-ella-hughes",
      clientName: "Sarah Lee",
      serviceName: "Move-out Clean",
      status: "pending",
      scheduledAt: hoursFromNow(28),
      price: 24000,
      location: "18 York St, Toronto",
      notes: "Client requested eco-friendly products.",
    },
    {
      id: "job-003",
      providerId: "prov-ella-hughes",
      clientName: "Daniel Kim",
      serviceName: "Standard Clean",
      status: "completed",
      scheduledAt: hoursFromNow(-20),
      price: 12000,
      location: "78 King St E, Toronto",
      notes: "Left key with concierge.",
    },
  ],
  providerEarnings: [
    {
      providerId: "prov-ella-hughes",
      totalEarned: 428000,
      pendingPayout: 54000,
      transactions: [
        {
          id: "txn-1001",
          jobId: "job-003",
          date: hoursFromNow(-20),
          amount: 12000,
          clientName: "Daniel Kim",
        },
        {
          id: "txn-1000",
          jobId: "job-099",
          date: hoursFromNow(-70),
          amount: 16000,
          clientName: "Jennifer Brown",
        },
      ],
    },
  ],
};

// ─── Auth middleware ──────────────────────────────────────────────────────────
// Verifies the Supabase JWT from the Authorization header and sets req.verifiedUserId.
async function verifyAuth(req, res, next) {
  const verifiedUser = await resolveVerifiedUser({
    authHeader: req.headers["authorization"],
    supabase,
  });

  if (verifiedUser) {
    req.verifiedUserId = verifiedUser.userId;
    req.verifiedUserEmail = verifiedUser.email;
  }
  next();
}

app.use(verifyAuth);

function getUserId(req) {
  return getVerifiedUserId(req);
}

function getProviderId(req) {
  return getVerifiedProviderId(req);
}

// Require a verified or header-supplied user ID — returns 401 if neither present
function requireAuth(req, res, next) {
  if (!getUserId(req)) {
    return res.status(401).json({ error: "Authentication required." });
  }
  next();
}

// Sanitize error messages before sending to client — prevents leaking internal details
function safeErrorMessage(err) {
  if (err?.type?.startsWith("Stripe") || err?.code) {
    // Stripe errors — return user-friendly message based on decline code
    const code = err.decline_code || err.code || "";
    if (code.includes("card") || code === "insufficient_funds" || code === "card_declined")
      return "Payment failed. Please check your card details and try again.";
    if (code === "expired_card") return "Your card has expired.";
    if (code === "incorrect_cvc") return "Incorrect card security code.";
    return "Payment processing error. Please try again.";
  }
  return "An unexpected error occurred.";
}

async function getProviderStripeConnectStatus(providerId, { requireReady = false } = {}) {
  if (!providerId) {
    const error = new Error("providerId is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    return {
      accountId: null,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("stripe_account_id, business_name, name")
    .or(`id.eq.${providerId},user_id.eq.${providerId}`)
    .maybeSingle();

  if (providerError) {
    throw providerError;
  }

  const accountId = provider?.stripe_account_id || null;
  if (!accountId) {
    const error = new Error("Provider has not connected Stripe yet.");
    error.statusCode = 400;
    throw error;
  }

  const account = await stripe.accounts.retrieve(accountId);
  const status = {
    accountId,
    chargesEnabled: Boolean(account?.charges_enabled),
    payoutsEnabled: Boolean(account?.payouts_enabled),
    detailsSubmitted: Boolean(account?.details_submitted),
  };

  if (requireReady && (!status.chargesEnabled || !status.payoutsEnabled)) {
    const error = new Error("Provider payout account is not ready yet.");
    error.statusCode = 400;
    throw error;
  }

  return status;
}

function buildConnectTransferParams(amountCents, providerStripeAccountId) {
  const applicationFeeAmount = Math.round(amountCents * PLATFORM_FEE_RATE);
  return {
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: providerStripeAccountId,
    },
  };
}

// Resolves the providers.id (PK) from the caller's user_id.
// Needed when inserting rows with a FK to providers.id (e.g. service_groups).
async function resolveProviderId(req) {
  const userId = getUserId(req);
  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Provider record not found for this user.");
  return data.id;
}

async function getProviderIdentity(providerIdentifier) {
  if (!providerIdentifier || !supabase) {
    return {
      authId: providerIdentifier || null,
      recordId: null,
      ids: providerIdentifier ? [providerIdentifier] : [],
    };
  }

  try {
    const { data } = await supabase
      .from("providers")
      .select("id, user_id")
      .or(`user_id.eq.${providerIdentifier},id.eq.${providerIdentifier}`)
      .maybeSingle();

    const authId = data?.user_id || providerIdentifier;
    const recordId = data?.id || null;
    const ids = Array.from(new Set([authId, recordId].filter(Boolean)));

    return { authId, recordId, ids };
  } catch (error) {
    console.warn("[provider identity] Failed to resolve provider identity", error);
    return {
      authId: providerIdentifier,
      recordId: null,
      ids: providerIdentifier ? [providerIdentifier] : [],
    };
  }
}

async function hasProviderBookingConflict({ providerId, scheduledAt, durationMinutes = 60, excludeBookingId = null }) {
  if (!supabase || !providerId || !scheduledAt) return false;

  const providerIdentity = await getProviderIdentity(providerId);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerId];
  const requestedStart = new Date(scheduledAt).getTime();
  const requestedEnd = requestedStart + (parseInt(durationMinutes, 10) || 60) * 60000;

  if (!Number.isFinite(requestedStart) || !Number.isFinite(requestedEnd)) return false;

  const windowStart = new Date(requestedStart - 24 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(requestedEnd + 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("bookings")
    .select("id, scheduled_at, duration")
    .in("provider_id", providerIds)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data: existingBookings, error } = await query;
  if (error) throw error;

  return (existingBookings || []).some((booking) => {
    const existingStart = new Date(booking.scheduled_at).getTime();
    const existingEnd = existingStart + (parseInt(booking.duration, 10) || 60) * 60000;
    if (!Number.isFinite(existingStart) || !Number.isFinite(existingEnd)) return false;
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });
}

async function ensureProviderClientConnection({ providerId, clientId, inviteId = null, source = "booking", connectedAt = new Date().toISOString() }) {
  if (!supabase || !providerId || !clientId) return { created: false, connection: null };

  const { data: existing, error: existingError } = await supabase
    .from("provider_clients")
    .select("id, provider_id, client_id, invite_id, connected_at, source")
    .eq("provider_id", providerId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { created: false, connection: existing };

  const payload = {
    provider_id: providerId,
    client_id: clientId,
    connected_at: connectedAt,
    source,
  };
  if (inviteId) payload.invite_id = inviteId;

  const { data: inserted, error: insertError } = await supabase
    .from("provider_clients")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: duplicate } = await supabase
        .from("provider_clients")
        .select("id, provider_id, client_id, invite_id, connected_at, source")
        .eq("provider_id", providerId)
        .eq("client_id", clientId)
        .maybeSingle();
      return { created: false, connection: duplicate || null };
    }
    throw insertError;
  }

  return { created: true, connection: inserted };
}

async function getOrCreateProviderClientConversation({ providerAuthId, clientId }) {
  if (!supabase || !providerAuthId || !clientId) {
    throw new Error("Missing provider/client identifiers.");
  }

  const providerIdentity = await getProviderIdentity(providerAuthId);
  const providerIds = providerIdentity.ids.length > 0
    ? providerIdentity.ids
    : [providerIdentity.authId].filter(Boolean);

  const { data: connection, error: connectionError } = await supabase
    .from("provider_clients")
    .select("id")
    .in("provider_id", providerIds)
    .eq("client_id", clientId)
    .maybeSingle();

  if (connectionError) throw connectionError;
  if (!connection) {
    const err = new Error("Client connection not found.");
    err.status = 404;
    throw err;
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", clientId)
    .eq("provider_id", providerIdentity.authId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const [{ data: providerProfile }, { data: clientProfile }] = await Promise.all([
    supabase
      .from("providers")
      .select("name, business_name")
      .eq("user_id", providerIdentity.authId)
      .maybeSingle(),
    supabase
      .from("client_profiles")
      .select("name")
      .eq("user_id", clientId)
      .maybeSingle(),
  ]);

  const { data: inserted, error: insertError } = await supabase
    .from("conversations")
    .insert({
      client_id: clientId,
      provider_id: providerIdentity.authId,
      client_name: clientProfile?.name || "Client",
      provider_name: providerProfile?.business_name || providerProfile?.name || "Provider",
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}

// Admin user IDs from environment variable (comma-separated UUIDs)
const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);

function requireAdmin(req, res, next) {
  const userId = getVerifiedUserId(req);
  if (!isAdminUser(userId, ADMIN_USER_IDS)) {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

function hoursFromNow(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

if (memoryStore.bookings.length === 0) {
  memoryStore.bookings.push(
    {
      id: "bk-demo-upcoming",
      userId: "demo-user",
      providerId: "prov-ella-hughes",
      serviceId: "svc-home-clean",
      status: "upcoming",
      scheduledAt: hoursFromNow(48),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: "123 Queen St W, Toronto, ON",
      notes: "Please focus on kitchen and living room.",
      price: 14000,
    },
    {
      id: "bk-demo-past",
      userId: "demo-user",
      providerId: "prov-malik-thomas",
      serviceId: "svc-personal-training",
      status: "completed",
      scheduledAt: hoursFromNow(-72),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: "Condo gym, 54 Adelaide St",
      notes: "Bring resistance bands.",
      price: 9000,
    }
  );
}

app.post("/api/create-checkout-session", async (req, res) => {
  const {
    serviceName,
    amount,
    currency = PLATFORM_CURRENCY,
    bookingId,
    providerId,
    successUrl,
    cancelUrl,
    customerEmail,
  } = req.body;

  if (!serviceName || !amount) {
    return res.status(400).json({
      error: "serviceName and amount are required to create a checkout session.",
    });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({
      error:
        "amount must be a positive integer representing the amount in the smallest currency unit (for USD, cents).",
    });
  }

  try {
    const metadata = {};
    if (bookingId) metadata.bookingId = String(bookingId);
    if (providerId) metadata.providerId = String(providerId);

    let connectParams = {};
    if (providerId) {
      const providerStripe = await getProviderStripeConnectStatus(providerId, { requireReady: true });
      connectParams = buildConnectTransferParams(amount, providerStripe.accountId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: serviceName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata,
      client_reference_id: bookingId ? String(bookingId) : undefined,
      payment_intent_data: Object.keys(connectParams).length ? connectParams : undefined,
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.FRONTEND_URL}/cancel?booking_id=${bookingId}`,
    });

    console.log(
      `[stripe] Created checkout session ${session.id} for booking ${bookingId || "N/A"}`
    );

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("[stripe] Failed to create checkout session", error);
    res.status(500).json({ error: error.message });
  }
});

// Get services for a specific provider (for public profile)
app.get("/api/provider/:providerId/services", async (req, res) => {
  const { providerId } = req.params;

  if (!providerId) {
    return res.status(400).json({ error: "providerId is required." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[supabase] Failed to load provider services, using stub.", error);
      } else {
        // Transform to client-friendly format
        const services = data.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          category: s.category,
          price: s.base_price,
          basePrice: s.base_price,
          base_price: s.base_price,
          unit: s.unit || 'visit',
          duration: s.duration || 60,
          provider_id: s.provider_id,
          payment_type: s.payment_type || 'full',
          deposit_type: s.deposit_type || null,
          deposit_value: s.deposit_value != null ? s.deposit_value : null,
          metadata: s.metadata || null,
        }));
        return res.status(200).json({ services });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider services", error);
    }
  }

  // Fallback to mock data filtered by provider
  const mockServices = memoryStore.services.map(s => ({
    ...s,
    price: s.basePrice,
    base_price: s.basePrice
  }));
  res.status(200).json({ services: mockServices });
});

app.get("/api/services", async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        console.warn("[supabase] Failed to load services, using stub.", error);
      } else {
        return res.status(200).json({ services: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching services", error);
    }
  }

  res.status(200).json({ services: memoryStore.services });
});

// GET /api/provider/services — services + groups for the authenticated provider
app.get("/api/provider/services", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  let providerIdentity;
  try {
    providerIdentity = await getProviderIdentity(getProviderId(req));
  } catch {
    return res.status(200).json({ services: [], groups: [] });
  }

  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerRecordId = providerIdentity.recordId;

  try {
    const [{ data: services, error: svcError }, { data: groups, error: grpError }] = await Promise.all([
      supabase.from("services").select("*").eq("provider_id", providerAuthId).order("created_at", { ascending: false }),
      providerRecordId
        ? supabase.from("service_groups").select("*").eq("provider_id", providerRecordId).order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (svcError) throw svcError;
    if (grpError) throw grpError;

    const svcs = services || [];

    // Booking counts this calendar month per service
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    let countMap = {};
    if (svcs.length > 0) {
      const serviceIds = svcs.map((s) => s.id);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("service_id")
        .eq("provider_id", providerAuthId)
        .in("service_id", serviceIds)
        .neq("status", "cancelled")
        .gte("scheduled_at", monthStart)
        .lt("scheduled_at", monthEnd);
      for (const b of bookings || []) {
        if (b.service_id) countMap[b.service_id] = (countMap[b.service_id] || 0) + 1;
      }
    }

    const result = svcs.map((s) => ({
      ...s,
      bookings_this_month: countMap[s.id] || 0,
    }));

    res.status(200).json({ services: result, groups: groups || [] });
  } catch (err) {
    console.error("[supabase] Failed to load provider services", err);
    res.status(500).json({ error: "Failed to load services." });
  }
});

// POST /api/provider/service-groups — create a new service group
app.post("/api/provider/service-groups", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase client is not configured." });
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Group name is required." });
  try {
    const providerId = await resolveProviderId(req);
    const { data: existing } = await supabase
      .from("service_groups")
      .select("sort_order")
      .eq("provider_id", providerId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
    const { data, error } = await supabase
      .from("service_groups")
      .insert({ provider_id: providerId, name: name.trim(), description: description?.trim() || null, sort_order })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ group: data });
  } catch (err) {
    console.error("[service-groups POST]", err);
    res.status(500).json({ error: "Failed to create group." });
  }
});

// PUT /api/provider/service-groups/:groupId — update group name/description
app.put("/api/provider/service-groups/:groupId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase client is not configured." });
  const { groupId } = req.params;
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Group name is required." });
  try {
    const providerId = await resolveProviderId(req);
    const { data, error } = await supabase
      .from("service_groups")
      .update({ name: name.trim(), description: description?.trim() ?? null, updated_at: new Date().toISOString() })
      .eq("id", groupId)
      .eq("provider_id", providerId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Group not found." });
    res.status(200).json({ group: data });
  } catch (err) {
    console.error("[PUT /provider/service-groups/:groupId]", err);
    res.status(500).json({ error: "Failed to update group." });
  }
});

// DELETE /api/provider/service-groups/:groupId — delete group, reassign services to ungrouped
app.delete("/api/provider/service-groups/:groupId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase client is not configured." });
  const { groupId } = req.params;
  try {
    const providerId = await resolveProviderId(req);
    // Verify group belongs to this provider
    const { data: group, error: findErr } = await supabase
      .from("service_groups").select("id").eq("id", groupId).eq("provider_id", providerId).single();
    if (findErr || !group) return res.status(404).json({ error: "Group not found." });
    // Reassign services to ungrouped
    await supabase.from("services").update({ group_id: null }).eq("group_id", groupId).eq("provider_id", providerId);
    // Delete the group
    const { error: delErr } = await supabase.from("service_groups").delete().eq("id", groupId).eq("provider_id", providerId);
    if (delErr) throw delErr;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[DELETE /provider/service-groups/:groupId]", err);
    res.status(500).json({ error: "Failed to delete group." });
  }
});

// PATCH /api/provider/services/:id/group — assign a service to a group
app.patch("/api/provider/services/:id/group", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase client is not configured." });
  const { id } = req.params;
  const { group_id } = req.body || {};
  try {
    const providerIdentity = await getProviderIdentity(getProviderId(req));
    const providerAuthId = providerIdentity.authId || getProviderId(req);
    const providerRecordId = providerIdentity.recordId;

    if (group_id) {
      if (!providerRecordId) {
        return res.status(400).json({ error: "Provider record not found." });
      }
      const { data: group, error: groupError } = await supabase
        .from("service_groups")
        .select("id")
        .eq("id", group_id)
        .eq("provider_id", providerRecordId)
        .maybeSingle();

      if (groupError) throw groupError;
      if (!group) return res.status(404).json({ error: "Group not found." });
    }

    const { data, error } = await supabase
      .from("services")
      .update({ group_id: group_id || null })
      .eq("id", id)
      .eq("provider_id", providerAuthId)
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ service: data });
  } catch (err) {
    console.error("[services/:id/group PATCH]", err);
    res.status(500).json({ error: "Failed to update service group." });
  }
});

// Create or update a service (provider-owned)
app.post("/api/services", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { id, name, description, category, basePrice, unit, duration } = req.body || {};

  if (!name || !category || !basePrice) {
    return res.status(400).json({ error: "name, category, and basePrice are required." });
  }

  const {
    paymentType, depositType, depositValue, clientNotesEnabled,
    isActive, photos, preAppointmentInfo, pricingType, minHours, maxHours,
  } = req.body || {};

  let providerId;
  try {
    const providerIdentity = await getProviderIdentity(getProviderId(req));
    providerId = providerIdentity.authId || getProviderId(req);
  } catch (err) {
    return res.status(400).json({ error: "Provider record not found for this user." });
  }

  const metadataFields = {};
  if (photos) metadataFields.photos = photos;
  if (preAppointmentInfo) metadataFields.preAppointmentInfo = preAppointmentInfo;
  if (pricingType) metadataFields.pricingType = pricingType;
  if (pricingType === 'per_hour') {
    metadataFields.minHours = minHours ?? 1;
    metadataFields.maxHours = maxHours ?? 8;
  }

  const payload = {
    id: id || crypto.randomUUID(),
    name,
    description: description || "",
    category,
    base_price: Math.round((parseFloat(basePrice) || 0) * 100), // store cents
    unit: pricingType === 'per_hour' ? 'hour' : (unit || "visit"),
    duration: duration || 60,
    provider_id: providerId,
    is_active: isActive !== undefined ? isActive : true,
    payment_type: paymentType || "full",
    deposit_type: depositType || null,
    deposit_value: depositValue != null ? depositValue : null,
    client_notes_enabled: clientNotesEnabled !== undefined ? clientNotesEnabled : true,
    metadata: Object.keys(metadataFields).length > 0 ? metadataFields : undefined,
  };

  try {
    const { data, error } = await supabase
      .from("services")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ service: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert service", err);
    res.status(500).json({ error: "Failed to save service." });
  }
});

// Delete a service (provider-owned)
app.delete("/api/services/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const serviceId = req.params.id;

  try {
    const providerId = await resolveProviderId(req);
    const providerIdentity = await getProviderIdentity(getProviderId(req));
    const providerAuthId = providerIdentity.authId || getProviderId(req);
    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("provider_id", providerAuthId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.status(200).json({ service: data });
  } catch (err) {
    console.error("[supabase] Failed to delete service", err);
    res.status(500).json({ error: "Failed to delete service." });
  }
});

// ─── GET /api/provider/services/:id — single service with intake questions + options
app.get("/api/provider/services/:id", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const { id } = req.params;

  try {
    const providerIdentity = await getProviderIdentity(getProviderId(req));
    const providerAuthId = providerIdentity.authId || getProviderId(req);
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .eq("provider_id", providerAuthId)
      .single();

    if (svcErr || !service) return res.status(404).json({ error: "Service not found." });

    const { data: questions } = await supabase
      .from("service_intake_questions")
      .select("*, service_intake_options(*)")
      .eq("service_id", id)
      .order("sort_order", { ascending: true });

    const enriched = (questions || []).map((q) => ({
      ...q,
      options: (q.service_intake_options || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    res.status(200).json({ service, questions: enriched });
  } catch (err) {
    console.error("[provider/services/:id] Error:", err);
    res.status(500).json({ error: "Failed to load service." });
  }
});

// ─── GET /api/services/:serviceId/intake — public: intake questions for booking flow
app.get("/api/services/:serviceId/intake", async (req, res) => {
  if (!supabase) return res.json({ questions: [], clientNotesEnabled: true });
  const { serviceId } = req.params;

  try {
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, client_notes_enabled")
      .eq("id", serviceId)
      .single();

    if (svcErr || !service) return res.status(404).json({ error: "Service not found." });

    const { data: questions } = await supabase
      .from("service_intake_questions")
      .select("id, question_text, question_type, sort_order, service_intake_options(id, option_text, sort_order)")
      .eq("service_id", serviceId)
      .order("sort_order", { ascending: true });

    const enriched = (questions || []).map((q) => ({
      ...q,
      options: (q.service_intake_options || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    res.json({ questions: enriched, clientNotesEnabled: service.client_notes_enabled !== false });
  } catch (err) {
    console.error("[services/:serviceId/intake] Error:", err);
    res.status(500).json({ error: "Failed to load intake questions." });
  }
});

// ─── PUT /api/provider/services/:id — full update including payment/notes fields
app.put("/api/provider/services/:id", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const { id } = req.params;
  const {
    name, description, category, basePrice, duration, isActive,
    paymentType, depositType, depositValue, clientNotesEnabled, photos, preAppointmentInfo,
    pricingType, minHours, maxHours,
  } = req.body || {};

  try {
    const providerIdentity = await getProviderIdentity(getProviderId(req));
    const providerAuthId = providerIdentity.authId || getProviderId(req);
    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined)                 updates.name = name;
    if (description !== undefined)          updates.description = description;
    if (category !== undefined)             updates.category = category;
    if (basePrice !== undefined)            updates.base_price = Math.round((parseFloat(basePrice) || 0) * 100);
    if (duration !== undefined)             updates.duration = duration;
    if (isActive !== undefined)             updates.is_active = isActive;
    if (paymentType !== undefined)          updates.payment_type = paymentType;
    if (depositType !== undefined)          updates.deposit_type = depositType;
    if (depositValue !== undefined)         updates.deposit_value = depositValue;
    if (clientNotesEnabled !== undefined)   updates.client_notes_enabled = clientNotesEnabled;
    if (pricingType !== undefined)          updates.unit = pricingType === 'per_hour' ? 'hour' : 'visit';
    if (photos !== undefined || preAppointmentInfo !== undefined || pricingType !== undefined) {
      const { data: existing } = await supabase.from("services").select("metadata").eq("id", id).single();
      const existingMeta = existing?.metadata || {};
      updates.metadata = {
        ...existingMeta,
        ...(photos !== undefined ? { photos } : {}),
        ...(preAppointmentInfo !== undefined ? { preAppointmentInfo } : {}),
        ...(pricingType !== undefined ? { pricingType } : {}),
        ...(pricingType === 'per_hour' ? { minHours: minHours ?? existingMeta.minHours ?? 1, maxHours: maxHours ?? existingMeta.maxHours ?? 8 } : { minHours: null, maxHours: null }),
      };
    }

    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("provider_id", providerAuthId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Service not found." });

    res.status(200).json({ service: data });
  } catch (err) {
    console.error("[provider/services/:id PUT] Error:", err);
    res.status(500).json({ error: "Failed to update service." });
  }
});

// ─── Intake questions CRUD ────────────────────────────────────────────────────

// GET /api/provider/services/:serviceId/questions
app.get("/api/provider/services/:serviceId/questions", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const { serviceId } = req.params;

  try {
    const { data, error } = await supabase
      .from("service_intake_questions")
      .select("*, service_intake_options(*)")
      .eq("service_id", serviceId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const questions = (data || []).map((q) => ({
      ...q,
      options: (q.service_intake_options || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

    res.status(200).json({ questions });
  } catch (err) {
    console.error("[intake questions GET] Error:", err);
    res.status(500).json({ error: "Failed to load questions." });
  }
});

const VALID_QUESTION_TYPES = new Set(["select", "text", "checkbox", "multiselect"]);

// Helper: verify the authenticated provider owns a service
async function verifyServiceOwnership(userId, serviceId) {
  const { data } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("provider_id", userId)
    .maybeSingle();
  return !!data;
}

// Helper: verify the authenticated provider owns a question (via its service)
async function verifyQuestionOwnership(userId, questionId) {
  const { data } = await supabase
    .from("service_intake_questions")
    .select("id, services!inner(provider_id)")
    .eq("id", questionId)
    .eq("services.provider_id", userId)
    .maybeSingle();
  return !!data;
}

// Helper: verify the authenticated provider owns an option (via question → service)
async function verifyOptionOwnership(userId, optionId) {
  const { data } = await supabase
    .from("service_intake_options")
    .select("id, service_intake_questions!inner(id, services!inner(provider_id))")
    .eq("id", optionId)
    .eq("service_intake_questions.services.provider_id", userId)
    .maybeSingle();
  return !!data;
}

// POST /api/provider/services/:serviceId/questions
app.post("/api/provider/services/:serviceId/questions", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { serviceId } = req.params;
  const { questionText, questionType = "select", sortOrder = 0 } = req.body || {};

  if (!questionText?.trim() || questionText.length > 500)
    return res.status(400).json({ error: "questionText is required and must be under 500 characters." });
  if (!VALID_QUESTION_TYPES.has(questionType))
    return res.status(400).json({ error: "Invalid question type." });
  if (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0 || Number(sortOrder) > 10000)
    return res.status(400).json({ error: "Invalid sort order." });

  try {
    if (!(await verifyServiceOwnership(userId, serviceId)))
      return res.status(403).json({ error: "Not authorized." });

    const { data, error } = await supabase
      .from("service_intake_questions")
      .insert({
        service_id: serviceId,
        question_text: questionText.trim(),
        question_type: questionType,
        sort_order: Number(sortOrder),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ question: { ...data, options: [] } });
  } catch (err) {
    console.error("[intake questions POST] Error:", err);
    res.status(500).json({ error: "Failed to create question." });
  }
});

// PATCH /api/provider/questions/:questionId
app.patch("/api/provider/questions/:questionId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { questionId } = req.params;
  const { questionText, questionType, sortOrder } = req.body || {};

  const updates = {};
  if (questionText !== undefined) {
    if (!questionText.trim() || questionText.length > 500)
      return res.status(400).json({ error: "Invalid questionText." });
    updates.question_text = questionText.trim();
  }
  if (questionType !== undefined) {
    if (!VALID_QUESTION_TYPES.has(questionType))
      return res.status(400).json({ error: "Invalid question type." });
    updates.question_type = questionType;
  }
  if (sortOrder !== undefined) {
    if (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)
      return res.status(400).json({ error: "Invalid sort order." });
    updates.sort_order = Number(sortOrder);
  }

  try {
    if (!(await verifyQuestionOwnership(userId, questionId)))
      return res.status(403).json({ error: "Not authorized." });

    const { data, error } = await supabase
      .from("service_intake_questions")
      .update(updates)
      .eq("id", questionId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ question: data });
  } catch (err) {
    console.error("[intake questions PATCH] Error:", err);
    res.status(500).json({ error: "Failed to update question." });
  }
});

// DELETE /api/provider/questions/:questionId
app.delete("/api/provider/questions/:questionId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { questionId } = req.params;

  try {
    if (!(await verifyQuestionOwnership(userId, questionId)))
      return res.status(403).json({ error: "Not authorized." });

    const { error } = await supabase
      .from("service_intake_questions")
      .delete()
      .eq("id", questionId);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[intake questions DELETE] Error:", err);
    res.status(500).json({ error: "Failed to delete question." });
  }
});

// ─── Intake options CRUD ──────────────────────────────────────────────────────

// POST /api/provider/questions/:questionId/options
app.post("/api/provider/questions/:questionId/options", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { questionId } = req.params;
  const { optionText, sortOrder = 0 } = req.body || {};

  if (!optionText?.trim() || optionText.length > 200)
    return res.status(400).json({ error: "optionText is required and must be under 200 characters." });

  try {
    if (!(await verifyQuestionOwnership(userId, questionId)))
      return res.status(403).json({ error: "Not authorized." });

    const { data, error } = await supabase
      .from("service_intake_options")
      .insert({ question_id: questionId, option_text: optionText.trim(), sort_order: Number(sortOrder) || 0 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ option: data });
  } catch (err) {
    console.error("[intake options POST] Error:", err);
    res.status(500).json({ error: "Failed to create option." });
  }
});

// DELETE /api/provider/options/:optionId
app.delete("/api/provider/options/:optionId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { optionId } = req.params;

  try {
    if (!(await verifyOptionOwnership(userId, optionId)))
      return res.status(403).json({ error: "Not authorized." });

    const { error } = await supabase
      .from("service_intake_options")
      .delete()
      .eq("id", optionId);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[intake options DELETE] Error:", err);
    res.status(500).json({ error: "Failed to delete option." });
  }
});

// PUT /api/provider/questions/:questionId/options — replace all options for a question
app.put("/api/provider/questions/:questionId/options", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const { questionId } = req.params;
  const { options = [] } = req.body || {};

  try {
    // Delete existing
    await supabase
      .from("service_intake_options")
      .delete()
      .eq("question_id", questionId);

    if (options.length === 0) return res.status(200).json({ options: [] });

    const rows = options.map((opt, idx) => ({
      question_id: questionId,
      option_text: typeof opt === "string" ? opt : opt.option_text,
      sort_order: idx,
    }));

    const { data, error } = await supabase
      .from("service_intake_options")
      .insert(rows)
      .select();

    if (error) throw error;
    res.status(200).json({ options: data });
  } catch (err) {
    console.error("[intake options PUT] Error:", err);
    res.status(500).json({ error: "Failed to replace options." });
  }
});

app.get("/api/providers", async (req, res) => {
  const { category, minPrice, maxPrice, minRating } = req.query;

  if (supabase) {
    try {
      let query = supabase.from("providers").select("*").eq("is_active", true);
      if (category) {
        query = query.contains("categories", [category]);
      }
      if (minRating) {
        query = query.gte("rating", Number(minRating));
      }
      if (minPrice) {
        query = query.gte("hourly_rate", Number(minPrice));
      }
      if (maxPrice) {
        query = query.lte("hourly_rate", Number(maxPrice));
      }
      const { data, error } = await query;
      if (error) {
        console.warn("[supabase] Failed to load providers, using stub.", error);
      } else {
        return res.status(200).json({ providers: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching providers", error);
    }
  }

  const providers = memoryStore.providers.filter((provider) => {
    const matchesCategory = category
      ? provider.categories.includes(String(category))
      : true;
    const matchesRating = minRating ? provider.rating >= Number(minRating) : true;
    const matchesMinPrice = minPrice
      ? provider.hourlyRate >= Number(minPrice)
      : true;
    const matchesMaxPrice = maxPrice
      ? provider.hourlyRate <= Number(maxPrice)
      : true;
    return matchesCategory && matchesRating && matchesMinPrice && matchesMaxPrice;
  });

  res.status(200).json({ providers });
});

// Create or update provider profile
app.post("/api/providers/profile", async (req, res) => {
  const {
    userId,
    name,
    email,
    phone,
    avatar,
    photo,
    bio,
    headline,
    category,
    categories,
    city,
    location,
    hourlyRate,
    services,
    availability,
    stripeAccountId,
    isProfileComplete,
    onboardingCompletedAt
  } = req.body;

  if (!userId || !name) {
    return res.status(400).json({
      error: "userId and name are required to create a provider profile."
    });
  }

  if (!supabase) {
    return res.status(503).json({
      error: "Database connection not available."
    });
  }

  try {
    // Check if provider profile already exists
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", userId)
      .single();

    const providerData = {
      user_id: userId,
      name,
      email,
      phone,
      avatar: avatar || photo,
      photo: photo || avatar,
      bio,
      headline,
      category,
      categories: categories || (category ? [category] : []),
      city,
      location: location || city,
      hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      services: services || [],
      availability: availability || {},
      stripe_account_id: stripeAccountId,
      is_active: true,
      is_profile_complete: isProfileComplete || false,
      onboarding_completed_at: onboardingCompletedAt
    };

    let result;
    if (existing) {
      // Update existing provider
      result = await supabase
        .from("providers")
        .update(providerData)
        .eq("user_id", userId)
        .select()
        .single();
    } else {
      // Insert new provider
      result = await supabase
        .from("providers")
        .insert(providerData)
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    console.log(`[providers] ${existing ? 'Updated' : 'Created'} provider profile for user ${userId}`);
    res.status(200).json({ provider: result.data });
  } catch (error) {
    console.error("[providers] Failed to save provider profile", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bookings/me", requireAuth, async (req, res) => {
  const userId = getUserId(req);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", userId);
      if (error) {
        console.warn("[supabase] Failed to load bookings, using stub.", error);
      } else {
        return res.status(200).json({ bookings: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching bookings", error);
    }
  }

  const bookings = memoryStore.bookings.filter(
    (booking) => booking.userId === userId
  );
  res.status(200).json({ bookings });
});

// GET /api/bookings/:id — single booking for client (used by ReviewPage)
app.get("/api/bookings/:id", async (req, res) => {
  const userId = getUserId(req);
  const bookingId = req.params.id;
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  try {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.client_id !== userId && booking.provider_id !== userId) {
      return res.status(403).json({ error: "Not authorized." });
    }

    let serviceInfo = null;
    if (booking.service_id) {
      const { data } = await supabase
        .from("services")
        .select("name, description, duration_minutes, metadata")
        .eq("id", booking.service_id)
        .maybeSingle();
      serviceInfo = data || null;
    }

    let providerInfo = null;
    if (booking.provider_id) {
      const { data } = await supabase
        .from("providers")
        .select("name, business_name, handle, avatar, photo")
        .eq("user_id", booking.provider_id)
        .maybeSingle();
      providerInfo = data || null;
    }

    // Resolve client name if not stored on booking
    let clientName = booking.client_name || null;
    if (!clientName && booking.client_id) {
      const { data: cp } = await supabase
        .from("client_profiles")
        .select("name")
        .eq("user_id", booking.client_id)
        .maybeSingle();
      clientName = cp?.name || null;
    }

    // Fetch session photos for this booking
    const { data: photosData } = await supabase
      .from("booking_photos")
      .select("id, photo_url, caption, created_at")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });
    const sessionPhotos = photosData || [];

    // Fetch intake responses for this booking
    let intakeResponses = [];
    const { data: intakeRows } = await supabase
      .from("booking_intake_responses")
      .select("question_id, response_text")
      .eq("booking_id", bookingId);
    if (intakeRows?.length) {
      // Look up question text from service_intake_questions table
      const questionIds = intakeRows.map(r => r.question_id).filter(Boolean);
      let questionMap = {};
      if (questionIds.length) {
        const { data: questionRows } = await supabase
          .from("service_intake_questions")
          .select("id, question_text")
          .in("id", questionIds);
        for (const q of questionRows || []) {
          questionMap[q.id] = q.question_text;
        }
      }
      intakeResponses = intakeRows.map(r => ({
        question: questionMap[r.question_id] || r.question_id,
        answer: r.response_text,
      }));
    }

    const enriched = {
      ...booking,
      client_name: clientName,
      provider_name: providerInfo?.business_name || providerInfo?.name || booking.provider_name || "Provider",
      provider_handle: providerInfo?.handle || null,
      provider_avatar: providerInfo?.photo || providerInfo?.avatar || null,
      service_name: serviceInfo?.name || booking.service_name || "Service",
      service_description: serviceInfo?.description || booking.service_description || null,
      duration_minutes: serviceInfo?.duration_minutes || booking.duration_minutes || booking.duration || null,
      pre_appointment_info: serviceInfo?.metadata?.preAppointmentInfo || null,
      intake_responses: intakeResponses,
      client_message: booking.metadata?.client_message || null,
      session_notes: booking.session_notes || null,
      session_recommendation: booking.session_recommendation || null,
      session_photos: sessionPhotos,
    };

    return res.status(200).json({ booking: enriched });
  } catch (err) {
    console.error("[bookings/:id] GET error:", err);
    return res.status(500).json({ error: "Failed to load booking." });
  }
});

// PATCH /api/bookings/:id/notes — provider saves session notes + recommendation
app.patch("/api/bookings/:id/notes", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const bookingId = req.params.id;
  const userId = getUserId(req);
  const { session_notes, session_recommendation } = req.body || {};

  try {
    const { data: booking } = await supabase
      .from("bookings").select("provider_id, client_id, status, session_notes, session_recommendation").eq("id", bookingId).single();
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.provider_id !== userId) return res.status(403).json({ error: "Not authorized." });

    const updates = { updated_at: new Date().toISOString() };
    if (session_notes !== undefined) updates.session_notes = session_notes;
    if (session_recommendation !== undefined) updates.session_recommendation = session_recommendation;

    const { data, error } = await supabase
      .from("bookings").update(updates).eq("id", bookingId).select().single();
    if (error) throw error;

    const previousNotes = String(booking.session_notes || "").trim();
    const previousRecommendation = String(booking.session_recommendation || "").trim();
    const nextNotes = String(data.session_notes || "").trim();
    const nextRecommendation = String(data.session_recommendation || "").trim();
    const addedDetails = [];

    if (nextNotes && nextNotes !== previousNotes) addedDetails.push("notes");
    if (nextRecommendation && nextRecommendation !== previousRecommendation) addedDetails.push("recommendations");

    res.json({ booking: data });
  } catch (err) {
    console.error("[bookings/:id/notes]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/:id/photos — provider uploads a session photo URL
app.post("/api/bookings/:id/photos", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const bookingId = req.params.id;
  const userId = getUserId(req);
  const { photo_url, caption } = req.body || {};

  if (!photo_url) return res.status(400).json({ error: "photo_url is required." });

  try {
    const { data: booking } = await supabase
      .from("bookings").select("provider_id, client_id, status").eq("id", bookingId).single();
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.provider_id !== userId) return res.status(403).json({ error: "Not authorized." });

    const { data, error } = await supabase
      .from("booking_photos")
      .insert({ booking_id: bookingId, provider_id: userId, photo_url, caption: caption || null })
      .select().single();
    if (error) throw error;

    res.status(201).json({ photo: data });
  } catch (err) {
    console.error("[bookings/:id/photos POST]", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookings/:bookingId/photos/:photoId — provider deletes a session photo
app.delete("/api/bookings/:bookingId/photos/:photoId", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const { bookingId, photoId } = req.params;
  const userId = getUserId(req);

  try {
    const { data: photo } = await supabase
      .from("booking_photos").select("provider_id").eq("id", photoId).eq("booking_id", bookingId).single();
    if (!photo) return res.status(404).json({ error: "Photo not found." });
    if (photo.provider_id !== userId) return res.status(403).json({ error: "Not authorized." });

    const { error } = await supabase.from("booking_photos").delete().eq("id", photoId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("[bookings/:id/photos DELETE]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings/:id/photos/upload-url — get a signed Supabase Storage upload URL
app.post("/api/bookings/:id/photos/upload-url", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const bookingId = req.params.id;
  const userId = getUserId(req);
  const { filename, contentType } = req.body || {};

  if (!filename) return res.status(400).json({ error: "filename is required." });

  // Validate content type — only images allowed
  if (!isAllowedImageContentType(contentType)) {
    return res.status(400).json({ error: "Only image files are allowed (jpeg, png, webp, heic)." });
  }

  try {
    const { data: booking } = await supabase
      .from("bookings").select("provider_id").eq("id", bookingId).single();
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.provider_id !== userId) return res.status(403).json({ error: "Not authorized." });

    const safeName = sanitizeFilename(filename);
    const filePath = `booking-photos/${bookingId}/${Date.now()}-${safeName}`;
    const { data, error } = await supabase.storage
      .from("kliques-media")
      .createSignedUploadUrl(filePath);
    if (error) throw error;
    res.json({ uploadUrl: data.signedUrl, filePath, token: data.token });
  } catch (err) {
    console.error("[bookings/:id/photos/upload-url]", err);
    res.status(500).json({ error: err.message });
  }
});


async function createPersistedPublicBooking({ booking, metadata, intakeResponses, now }) {
  if (!supabase) return null;

  try {
    const insertData = {
      id: booking.id,
      client_id: booking.userId,
      service_id: booking.serviceId,
      provider_id: booking.providerId,
      scheduled_at: booking.scheduledAt,
      location: booking.location,
      notes: booking.notes,
      status: booking.status,
      price: booking.price,
    };

    if (Object.keys(metadata).length > 0) {
      insertData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.warn("[supabase] Failed to create booking, using stub.", error);
      return null;
    }

    await ensureProviderClientConnection({
      providerId: data.provider_id,
      clientId: data.client_id,
      source: "booking",
      connectedAt: data.created_at || now,
    }).catch((err) => {
      console.warn("[bookings] provider_clients upsert:", err.message);
    });

    if (Array.isArray(intakeResponses) && intakeResponses.length > 0) {
      const rows = intakeResponses
        .filter((r) => r.questionId && r.responseText !== undefined && r.responseText !== "")
        .map((r) => ({
          booking_id: data.id,
          question_id: r.questionId,
          response_text: String(r.responseText),
        }));
      if (rows.length > 0) {
        await supabase.from("booking_intake_responses").insert(rows);
      }
    }

    if (data.status === "pending" || data.status === "confirmed") {
      const scheduledDate = new Date(data.scheduled_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      await createProviderNotification(data.provider_id, {
        type: data.status === "confirmed" ? "new_booking" : "booking_request",
        title: data.status === "confirmed" ? "New Booking" : "New Booking Request",
        body: data.status === "confirmed"
          ? `A booking was automatically accepted for ${scheduledDate}`
          : `You have a new booking request for ${scheduledDate}`,
        booking_id: data.id,
        data: {
          service_id: data.service_id,
          scheduled_at: data.scheduled_at,
          price: data.price,
        },
      });

      if (data.status === "pending") {
        const provInfo = await getProviderEmailInfo(data.provider_id);
        const { name: clientName } = await getClientNotifPrefs(data.client_id);
        if (provInfo.email) {
          sendEmail({
            to: provInfo.email,
            subject: `New booking request — ${fmtDate(data.scheduled_at)}`,
            html: `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>New Booking Request - Kliques</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Inter', sans-serif; }
        .hero-card { background-color: #FBE4D5 !important; border-radius: 24px !important; }
        .cta-button { background-color: #331D19 !important; color: #ffffff !important; border-radius: 9999px !important; display: inline-block; padding: 16px 40px; text-decoration: none; font-weight: 600; font-size: 15px; }
        .data-table { background-color: #F3ECE7 !important; border-radius: 16px !important; }
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 20px !important; }
            .logo-img { height: 80px !important; }
            .h1-mobile { font-size: 24px !important; }
        }
    </style>
</head>
<body style="background-color: #FAF7F2; margin: 0 !important; padding: 0 !important;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2;">
        <tr>
            <td align="center" style="padding: 40px 10px 40px 10px;" class="mobile-padding">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px;">
                    <tr>
                        <td align="center" class="hero-card" style="padding: 48px 32px 48px 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <img src="https://imgur.com/2aeeOeG.png" alt="Kliques" width="160" style="width: 160px; max-width: 160px; height: auto; display: block;">
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 class="h1-mobile" style="font-size: 28px; font-weight: 600; color: #331D19; margin: 0 0 12px 0; letter-spacing: -0.02em;">New booking request</h1>
                                        <p style="color: #8E7A75; font-size: 15px; line-height: 1.6; margin: 0;">You have a new booking request waiting for your approval.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr><td height="40"></td></tr>
                    <tr>
                        <td align="left" class="data-table" style="padding: 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Client</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19; padding-bottom: 20px;">${clientName || 'A client'}</td></tr>
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Service</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19; padding-bottom: 20px;">${data.service_name || 'Service'}</td></tr>
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Date &amp; Time</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19;">${fmtDate(data.scheduled_at)}</td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 0 24px 0;">
                            <a href="https://mykliques.com/provider/appointments" class="cta-button">Review request →</a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 40px;">
                            <p style="color: #331D19; font-weight: 500; font-size: 15px; margin: 0;">- The Kliques Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
          }).catch(() => {});
        }
      }

      if (data.status === "confirmed") {
        const provInfo = await getProviderEmailInfo(data.provider_id);
        const { name: clientName } = await getClientNotifPrefs(data.client_id);
        await sendProviderNewBookingEmail({
          to: provInfo.email,
          clientName,
          serviceName: data.service_name,
          scheduledAt: data.scheduled_at,
          autoAccepted: true,
        }).catch(() => {});
      }
    }

    if (data.status === "confirmed" && data.client_id) {
      await createClientNotification(data.client_id, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your booking was automatically confirmed.",
        booking_id: data.id,
        data: {
          provider_id: data.provider_id,
          booking_id: data.id,
          scheduled_at: data.scheduled_at,
          status: "confirmed",
        },
      }).catch(() => {});
      await sendClientPushNotification(data.client_id, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your appointment has been confirmed in Kliques.",
        url: "/app/bookings",
        tag: `booking-confirmed-${data.id}`,
      }).catch(() => {});
      const provInfo = await getProviderEmailInfo(data.provider_id);
      const { email: clientEmail } = await getClientNotifPrefs(data.client_id);
      let autoAcceptSvcMeta = null;
      if (data.service_id) {
        const { data: svcRow } = await supabase
          .from("services")
          .select("metadata")
          .eq("id", data.service_id)
          .maybeSingle();
        autoAcceptSvcMeta = svcRow?.metadata || null;
      }
      await sendClientBookingConfirmedEmail({
        to: clientEmail,
        providerName: provInfo.name || data.provider_name,
        serviceName: data.service_name,
        scheduledAt: data.scheduled_at,
        preAppointmentInfo: autoAcceptSvcMeta?.preAppointmentInfo || null,
      }).catch(() => {});
    }

    return data;
  } catch (error) {
    console.warn("[supabase] Unexpected error creating booking", error);
    return null;
  }
}

app.post("/api/bookings", createBookingHandler({
  getUserId,
  getProviderBookingRules: async (providerId) => {
    if (!supabase) return normalizeProviderBookingRules();
    return normalizeProviderBookingRules(await getProviderBookingSettings(providerId));
  },
  createPersistedBooking: createPersistedPublicBooking,
  appendMemoryBooking: (booking) => {
    memoryStore.bookings.push(booking);
    return booking;
  },
}));

app.patch("/api/bookings/:id/cancel", createCancelBookingHandler({
  getBookingId: (req) => req.params.id,
  getUserId,
  fetchBooking: async (bookingId) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (error) {
      console.warn("[supabase] Failed to cancel booking, using stub.", error);
      return null;
    }
    return data || null;
  },
  fetchProviderOwnerUserId: async (providerId) => {
    if (!supabase) return null;
    const { data: provRow } = await supabase.from("providers").select("user_id").eq("id", providerId).single();
    return provRow?.user_id || null;
  },
  getProviderBookingRules: async (providerId) =>
    normalizeProviderBookingRules(await getProviderBookingSettings(providerId)),
  cancelBookingRecord: async ({ bookingId, cancelledAt }) => {
    const { data: cancelledBooking, error: cancelErr } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: cancelledAt })
      .eq("id", bookingId)
      .select()
      .single();
    if (cancelErr) throw cancelErr;
    return cancelledBooking;
  },
  afterCancel: async ({ booking: cancelledBooking, initiatedBy, reason }) => {
    const scheduledDate = new Date(cancelledBooking.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const reasonText = reason ? ` Reason: ${reason}` : '';

    if (initiatedBy === "client") {
      if (cancelledBooking.provider_id) {
        const clientName = cancelledBooking.client_name || 'A client';
        await createProviderNotification(cancelledBooking.provider_id, {
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          body: `${clientName} cancelled their booking for ${scheduledDate}.${reasonText}`,
          booking_id: cancelledBooking.id,
          data: { client_id: cancelledBooking.client_id, scheduled_at: cancelledBooking.scheduled_at, status: 'cancelled' }
        }).catch(() => {});
        const provInfo = await getProviderEmailInfo(cancelledBooking.provider_id);
        if (provInfo?.email) {
          await sendEmail({
            to: provInfo.email,
            subject: 'Booking Cancelled',
            html: `<p>Hi ${provInfo.name || 'there'},</p>
<p>${clientName} has cancelled their booking scheduled for <strong>${scheduledDate}</strong>.</p>
${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
<p>Log in to <a href="https://mykliques.com">Kliques</a> to view your updated schedule.</p>`
          }).catch(() => {});
        }
      }
      return;
    }

    if (cancelledBooking.client_id) {
      const provInfo = await getProviderEmailInfo(cancelledBooking.provider_id);
      const providerName = provInfo?.name || 'Your provider';
      await createClientNotification(cancelledBooking.client_id, {
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        body: `${providerName} has cancelled your booking for ${scheduledDate}.${reasonText}`,
        booking_id: cancelledBooking.id,
        data: { provider_id: cancelledBooking.provider_id, scheduled_at: cancelledBooking.scheduled_at, status: 'cancelled' }
      }).catch(() => {});
      const { email: clientEmail, name: clientName } = await getClientNotifPrefs(cancelledBooking.client_id);
      if (clientEmail) {
        await sendEmail({
          to: clientEmail,
          subject: 'Booking Cancelled',
          html: `<p>Hi ${clientName || 'there'},</p>
<p>${providerName} has cancelled your booking scheduled for <strong>${scheduledDate}</strong>.</p>
${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
<p>Log in to <a href="https://mykliques.com">Kliques</a> to book another time.</p>`
        }).catch(() => {});
      }
    }
  },
  findMemoryBooking: (bookingId, userId) =>
    memoryStore.bookings.find((item) => item.id === bookingId && item.userId === userId) || null,
}));

app.patch("/api/bookings/:id/reschedule", createRescheduleBookingHandler({
  getBookingId: (req) => req.params.id,
  getUserId,
  fetchBooking: async (bookingId) => {
    if (!supabase) return null;
    const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (error || !data) return null;
    return data;
  },
  fetchProviderOwnerUserId: async (providerId) => {
    if (!supabase) return null;
    const { data: provRow } = await supabase.from("providers").select("user_id").eq("id", providerId).single();
    return provRow?.user_id || null;
  },
  hasConflict: hasProviderBookingConflict,
  updateBookingSchedule: async ({ bookingId, scheduledAt }) => {
    const { data: rescheduled, error: reschedErr } = await supabase
      .from("bookings")
      .update({ scheduled_at: scheduledAt, status: 'confirmed' })
      .eq("id", bookingId)
      .select()
      .single();
    if (reschedErr) throw reschedErr;
    return rescheduled;
  },
  afterReschedule: async ({ previousBooking, booking: rescheduled, initiatedBy, reason, scheduledAt }) => {
    const oldDate = new Date(previousBooking.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const newDateLabel = new Date(scheduledAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    const reasonText = reason ? ` Reason: ${reason}` : '';

    if (initiatedBy === "client") {
      if (rescheduled.provider_id) {
        const clientName = rescheduled.client_name || 'A client';
        await createProviderNotification(rescheduled.provider_id, {
          type: 'booking_rescheduled',
          title: 'Booking Rescheduled',
          body: `${clientName} rescheduled from ${oldDate} to ${newDateLabel}.${reasonText}`,
          booking_id: rescheduled.id,
          data: { client_id: rescheduled.client_id, scheduled_at: scheduledAt, status: 'confirmed' }
        }).catch(() => {});
        const provInfo = await getProviderEmailInfo(rescheduled.provider_id);
        if (provInfo?.email) {
          await sendEmail({
            to: provInfo.email,
            subject: 'Booking Rescheduled',
            html: `<p>Hi ${provInfo.name || 'there'},</p>
<p>${clientName} has rescheduled their booking.</p>
<p><strong>From:</strong> ${oldDate}<br/><strong>To:</strong> ${newDateLabel}</p>
${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
<p>Log in to <a href="https://mykliques.com">Kliques</a> to view your updated schedule.</p>`
          }).catch(() => {});
        }
      }
      return;
    }

    if (rescheduled.client_id) {
      const provInfo = await getProviderEmailInfo(rescheduled.provider_id);
      const providerName = provInfo?.name || 'Your provider';
      await createClientNotification(rescheduled.client_id, {
        type: 'booking_rescheduled',
        title: 'Booking Rescheduled',
        body: `${providerName} rescheduled your booking from ${oldDate} to ${newDateLabel}.${reasonText}`,
        booking_id: rescheduled.id,
        data: { provider_id: rescheduled.provider_id, scheduled_at: scheduledAt, status: 'confirmed' }
      }).catch(() => {});
      const { email: clientEmail, name: clientName } = await getClientNotifPrefs(rescheduled.client_id);
      if (clientEmail) {
        await sendEmail({
          to: clientEmail,
          subject: 'Booking Rescheduled',
          html: `<p>Hi ${clientName || 'there'},</p>
<p>${providerName} has rescheduled your booking.</p>
<p><strong>From:</strong> ${oldDate}<br/><strong>To:</strong> ${newDateLabel}</p>
${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
<p>Log in to <a href="https://mykliques.com">Kliques</a> to view your updated booking.</p>`
        }).catch(() => {});
      }
    }
  },
}));

app.post("/api/payments/create-checkout", async (req, res) => {
  const { bookingId, successUrl, cancelUrl } = req.body || {};
  if (!bookingId) {
    return res.status(400).json({ error: "bookingId is required." });
  }

  const booking =
    memoryStore.bookings.find((item) => item.id === bookingId) || null;

  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }

  const service =
    memoryStore.services.find((item) => item.id === booking.serviceId) || {};

  try {
    let connectParams = {};
    if (booking.providerId) {
      const providerStripe = await getProviderStripeConnectStatus(booking.providerId, { requireReady: true });
      connectParams = buildConnectTransferParams(booking.price || 1000, providerStripe.accountId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PLATFORM_CURRENCY,
            product_data: {
              name: service?.name || "Booking Payment",
              description: service?.description,
            },
            unit_amount: booking.price || 1000,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        providerId: booking.providerId,
      },
      client_reference_id: bookingId,
      payment_intent_data: Object.keys(connectParams).length ? connectParams : undefined,
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.FRONTEND_URL}/cancel?booking_id=${bookingId}`,
    });

    res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[stripe] Failed to create checkout session", error);
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/provider/jobs", async (req, res) => {
  const providerId = getProviderId(req);
  const { status } = req.query;

  if (supabase) {
    try {
      let query = supabase
        .from("provider_jobs")
        .select("*")
        .eq("provider_id", providerId)
        .order("scheduled_at", { ascending: true });
      if (status && status !== "today") {
        query = query.eq("status", status);
      }
      if (status === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query = query
          .gte("scheduled_at", start.toISOString())
          .lt("scheduled_at", end.toISOString());
      }
      const { data, error } = await query;
      if (error) {
        console.warn("[supabase] Failed to load provider jobs, using stub.", error);
      } else {
        return res.status(200).json({ jobs: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider jobs", error);
    }
  }

  const jobs = memoryStore.providerJobs.filter((job) => {
    const matchesProvider = job.providerId === providerId;
    let matchesStatus = true;
    if (status && status !== "today") {
      matchesStatus = job.status === status;
    }
    if (status === "today") {
      const scheduled = new Date(job.scheduledAt);
      const now = new Date();
      matchesStatus =
        scheduled.getDate() === now.getDate() &&
        scheduled.getMonth() === now.getMonth() &&
        scheduled.getFullYear() === now.getFullYear();
    }
    return matchesProvider && matchesStatus;
  });
  res.status(200).json({ jobs });
});

// GET /api/provider/jobs/:id — single job enriched with client stats + previous notes
app.get("/api/provider/jobs/:id", async (req, res) => {
  const providerId = getProviderId(req);
  const jobId = req.params.id;

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from("provider_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("provider_id", providerId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found." });
    }

    // Try to get client profile via booking_id → bookings.client_id
    let clientProfile = null;
    let clientId = null;
    if (job.booking_id) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("client_id")
        .eq("id", job.booking_id)
        .single();
      if (booking?.client_id) {
        clientId = booking.client_id;
        const { data: profile } = await supabase
          .from("client_profiles")
          .select("name, city, updated_at")
          .eq("user_id", clientId)
          .single();
        clientProfile = profile || null;
      }
    }

    // Count all completed visits from this client to this provider
    let visitCount = 0;
    let clientSince = null;
    if (clientId) {
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("id, created_at, status")
        .eq("provider_id", providerId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (allBookings) {
        visitCount = allBookings.filter(b => b.status === "completed").length;
        clientSince = allBookings[0]?.created_at || null;
      }
    }

    // Get previous session notes: last completed job for this client before this one
    let previousNotes = null;
    if (clientId) {
      const { data: prevJobs } = await supabase
        .from("provider_jobs")
        .select("notes, scheduled_at")
        .eq("provider_id", providerId)
        .eq("status", "completed")
        .neq("id", jobId)
        .order("scheduled_at", { ascending: false })
        .limit(1);
      // Match by client_name as fallback (provider_jobs has no client_id)
      if (!prevJobs || prevJobs.length === 0) {
        const { data: prevByName } = await supabase
          .from("provider_jobs")
          .select("notes, scheduled_at")
          .eq("provider_id", providerId)
          .eq("client_name", job.client_name)
          .eq("status", "completed")
          .neq("id", jobId)
          .order("scheduled_at", { ascending: false })
          .limit(1);
        previousNotes = prevByName?.[0]?.notes || null;
      } else {
        previousNotes = prevJobs[0]?.notes || null;
      }
    }

    // Format client since date
    const clientSinceLabel = clientSince
      ? new Date(clientSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : null;

    return res.status(200).json({
      job: {
        ...job,
        price_dollars: (job.price || 0) / 100,
        client_id: clientId,
        client_city: clientProfile?.city || null,
        visit_count: visitCount,
        client_since: clientSinceLabel,
        previous_notes: previousNotes,
      },
    });
  } catch (err) {
    console.error("[provider/jobs/:id] Unexpected error:", err);
    return res.status(500).json({ error: "Failed to load appointment." });
  }
});

// PATCH /api/provider/jobs/:id/notes — save session notes
app.patch("/api/provider/jobs/:id/notes", async (req, res) => {
  const providerId = getProviderId(req);
  const jobId = req.params.id;
  const { notes } = req.body || {};

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    const { data, error } = await supabase
      .from("provider_jobs")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", jobId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to save notes." });
    }

    return res.status(200).json({ job: data });
  } catch (err) {
    console.error("[provider/jobs/:id/notes] Unexpected error:", err);
    return res.status(500).json({ error: "Failed to save notes." });
  }
});

// POST /api/provider/jobs/:id/complete — mark complete + return payout breakdown
// Sets completed_at, updates linked booking, upserts provider_earnings record
app.post("/api/provider/jobs/:id/complete", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerId = getProviderId(req);
  const jobId = req.params.id;
  const { sessionNotes } = req.body || {};

  try {
    // Load the job
    const { data: job, error: jobErr } = await supabase
      .from("provider_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("provider_id", providerId)
      .single();
    if (jobErr || !job) return res.status(404).json({ error: "Job not found." });
    if (job.status === "completed") return res.status(409).json({ error: "Already completed." });

    const now = new Date().toISOString();

    // Mark job complete
    const updatePayload = { status: "completed", completed_at: now, updated_at: now };
    if (sessionNotes) updatePayload.notes = sessionNotes;

    const { data: updatedJob, error: updateErr } = await supabase
      .from("provider_jobs")
      .update(updatePayload)
      .eq("id", jobId)
      .eq("provider_id", providerId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    // Also mark the linked booking complete
    let bookingPrice = job.price || 0; // cents
    let depositPaid = 0;
    let bookingPaymentType = "full";
    if (job.booking_id) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("price, payment_status, metadata, payment_type, deposit_value, deposit_type")
        .eq("id", job.booking_id)
        .single();
      if (booking) {
        bookingPrice = booking.price || bookingPrice;
        bookingPaymentType = booking.payment_type || "full";
        const meta = booking.metadata || {};
        depositPaid = meta.deposit_paid || 0;
        await supabase
          .from("bookings")
          .update({ status: "completed", completed_at: now, payment_status: "paid", updated_at: now })
          .eq("id", job.booking_id);
      }
    }

    // Payout calculation
    const totalPrice = bookingPrice > 1000 ? bookingPrice / 100 : bookingPrice; // normalise to dollars
    const depositDollars = depositPaid > 1000 ? depositPaid / 100 : depositPaid;
    const remainingDollars = Math.max(totalPrice - depositDollars, 0);
    const platformFee = +(totalPrice * PLATFORM_FEE_RATE).toFixed(2);
    const providerPayout = +(totalPrice - platformFee).toFixed(2);

    // Upsert provider_earnings (single-row per provider model)
    const { data: existing } = await supabase
      .from("provider_earnings")
      .select("total_earned, pending_payout, transactions")
      .eq("provider_id", providerId)
      .single();
    const newTransaction = {
      id: jobId,
      booking_id: job.booking_id,
      client_name: job.client_name,
      service_name: job.service_name,
      amount: providerPayout,
      fee: platformFee,
      completed_at: now,
    };
    const prevTransactions = existing?.transactions || [];
    const totalEarned = (existing?.total_earned || 0) + Math.round(providerPayout * 100);
    const pendingPayout = (existing?.pending_payout || 0) + Math.round(providerPayout * 100);
    await supabase.from("provider_earnings").upsert({
      provider_id: providerId,
      total_earned: totalEarned,
      pending_payout: pendingPayout,
      transactions: [newTransaction, ...prevTransactions].slice(0, 100),
    }, { onConflict: "provider_id" });

    // Notify client
    const clientId = updatedJob.client_id;
    if (clientId) {
      // Check for session notes, recommendation, and photos on the linked booking
      let hasNotes = !!sessionNotes;
      let hasRecommendation = false;
      let hasPhotos = false;
      if (job.booking_id) {
        const { data: bookingDetail } = await supabase
          .from("bookings")
          .select("session_notes, session_recommendation")
          .eq("id", job.booking_id)
          .single();
        if (bookingDetail) {
          if (bookingDetail.session_notes) hasNotes = true;
          if (bookingDetail.session_recommendation) hasRecommendation = true;
        }
        const { count: photoCount } = await supabase
          .from("booking_photos")
          .select("id", { count: "exact", head: true })
          .eq("booking_id", job.booking_id);
        if (photoCount > 0) hasPhotos = true;
      }

      const extras = [
        hasNotes && "session notes",
        hasRecommendation && "recommendations",
        hasPhotos && "photos",
      ].filter(Boolean);

      const extraText = extras.length > 0
        ? ` Your provider also left ${extras.join(" and ")} — view them in your booking details.`
        : "";

      await createClientNotification(clientId, {
        type: "booking_completed",
        title: "Session Complete!",
        body: `Your session for ${job.service_name || "your service"} is complete. Your invoice is now available in the Invoices page.${extraText}`,
        booking_id: job.booking_id || jobId,
        data: { provider_id: providerId, status: "completed" },
      }).catch(() => {});
    }

    return res.status(200).json({
      job: updatedJob,
      payout: {
        totalPrice,
        depositCollected: depositDollars,
        remainingCharged: remainingDollars,
        platformFee,
        providerPayout,
        paymentType: bookingPaymentType,
      },
    });
  } catch (err) {
    console.error("[jobs/:id/complete]", err);
    return res.status(500).json({ error: "Failed to mark complete." });
  }
});

app.patch("/api/provider/jobs/:id", async (req, res) => {
  const providerId = getProviderId(req);
  const jobId = req.params.id;
  const { status, declineReason } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: "status is required." });
  }

  if (supabase) {
    try {
      const updatePayload = { status, updated_at: new Date().toISOString() };
      if (status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      }
      // Store decline reason in metadata when declining
      if ((status === 'declined' || status === 'cancelled') && declineReason) {
        updatePayload.metadata = { decline_reason: declineReason };
      }

      const { data, error } = await supabase
        .from("provider_jobs")
        .update(updatePayload)
        .eq("id", jobId)
        .eq("provider_id", providerId)
        .select()
        .single();
      if (error) {
        console.warn("[supabase] Failed to update provider job, using stub.", error);
      } else {
        // Send notification to client about booking status change
        // Handle both client_id (bookings table) and user_id (if used)
        const clientId = data.client_id || data.user_id;
        if (clientId && (status === 'accepted' || status === 'confirmed')) {
          const scheduledDate = new Date(data.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          await createClientNotification(clientId, {
            type: 'booking_accepted',
            title: 'Booking Confirmed!',
            body: `Your booking for ${scheduledDate} has been confirmed`,
            booking_id: data.id,
            data: {
              provider_id: data.provider_id,
              scheduled_at: data.scheduled_at,
              status: 'accepted'
            }
          });
          await sendClientPushNotification(clientId, {
            type: "booking_accepted",
            title: "Booking confirmed",
            body: "Your appointment has been confirmed in Kliques.",
            url: "/app/bookings",
            tag: `booking-confirmed-${data.id}`,
          }).catch(() => {});

          // Email client: booking confirmed
          const { email: clientEmail, name: clientName } = await getClientNotifPrefs(clientId);
          const provInfo = await getProviderEmailInfo(data.provider_id);
          if (clientEmail) {
            sendEmail({
              to: clientEmail,
              subject: `Your booking is confirmed — ${fmtDate(data.scheduled_at)}`,
              html: `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Booking Confirmed - Kliques</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Inter', sans-serif; }
        .hero-card { background-color: #FBE4D5 !important; border-radius: 24px !important; }
        .cta-button { background-color: #331D19 !important; color: #ffffff !important; border-radius: 9999px !important; display: inline-block; padding: 16px 40px; text-decoration: none; font-weight: 600; font-size: 15px; }
        .data-table { background-color: #F3ECE7 !important; border-radius: 16px !important; }
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 20px !important; }
            .logo-img { height: 80px !important; }
            .h1-mobile { font-size: 24px !important; }
        }
    </style>
</head>
<body style="background-color: #FAF7F2; margin: 0 !important; padding: 0 !important;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2;">
        <tr>
            <td align="center" style="padding: 40px 10px 40px 10px;" class="mobile-padding">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px;">
                    <tr>
                        <td align="center" class="hero-card" style="padding: 48px 32px 48px 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <img src="https://imgur.com/2aeeOeG.png" alt="Kliques" width="160" style="width: 160px; max-width: 160px; height: auto; display: block;">
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 class="h1-mobile" style="font-size: 28px; font-weight: 600; color: #331D19; margin: 0 0 12px 0; letter-spacing: -0.02em;">Booking confirmed</h1>
                                        <p style="color: #8E7A75; font-size: 15px; line-height: 1.6; margin: 0;">Your booking has been confirmed. We'll see you there!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr><td height="40"></td></tr>
                    <tr>
                        <td align="left" class="data-table" style="padding: 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Provider</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19; padding-bottom: 20px;">${provInfo.name || 'Your provider'}</td></tr>
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Service</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19; padding-bottom: 20px;">${data.service_name || 'Service'}</td></tr>
                                <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Date &amp; Time</td></tr>
                                <tr><td style="font-size: 16px; font-weight: 600; color: #331D19;">${fmtDate(data.scheduled_at)}</td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 0 24px 0;">
                            <a href="https://mykliques.com/app" class="cta-button">View my kliques →</a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 40px;">
                            <p style="color: #331D19; font-weight: 500; font-size: 15px; margin: 0;">- The Kliques Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            }).catch(() => {});
          }
        } else if (clientId && (status === 'declined' || status === 'cancelled')) {
          await createClientNotification(clientId, {
            type: 'booking_declined',
            title: 'Request Declined',
            body: declineReason
              ? `Your booking request was declined.`
              : `Your booking request was not accepted. Please try another time or provider.`,
            booking_id: data.id,
            data: {
              provider_id: data.provider_id,
              status: 'declined',
              reason: declineReason || null,
            }
          });

          // Email client: booking declined/cancelled by provider
          const { email: clientEmail } = await getClientNotifPrefs(clientId);
          const provInfo = await getProviderEmailInfo(data.provider_id);
          if (clientEmail) {
            sendEmail({
              to: clientEmail,
              subject: `Your booking request was not accepted`,
              html: `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Booking Declined - Kliques</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Inter', sans-serif; }
        .hero-card { background-color: #FBE4D5 !important; border-radius: 24px !important; }
        .cta-button { background-color: #331D19 !important; color: #ffffff !important; border-radius: 9999px !important; display: inline-block; padding: 16px 40px; text-decoration: none; font-weight: 600; font-size: 15px; }
        .data-table { background-color: #F3ECE7 !important; border-radius: 16px !important; }
        .reason-box { background-color: #FDEDEA !important; border-radius: 16px !important; }
        @media screen and (max-width: 480px) {
            .mobile-padding { padding: 20px !important; }
            .logo-img { height: 80px !important; }
            .h1-mobile { font-size: 24px !important; }
        }
    </style>
</head>
<body style="background-color: #FAF7F2; margin: 0 !important; padding: 0 !important;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F2;">
        <tr>
            <td align="center" style="padding: 40px 10px 40px 10px;" class="mobile-padding">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px;">
                    <tr>
                        <td align="center" class="hero-card" style="padding: 48px 32px 48px 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <img src="https://imgur.com/2aeeOeG.png" alt="Kliques" width="160" style="width: 160px; max-width: 160px; height: auto; display: block;">
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 class="h1-mobile" style="font-size: 28px; font-weight: 600; color: #331D19; margin: 0 0 12px 0; letter-spacing: -0.02em;">Booking request declined</h1>
                                        <p style="color: #8E7A75; font-size: 15px; line-height: 1.6; margin: 0;">Unfortunately, your booking request with ${provInfo.name || 'your provider'} was not accepted.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                ${declineReason ? `
                                <tr><td height="32"></td></tr>
                                <tr>
                                    <td align="left" class="reason-box" style="padding: 24px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Reason</td></tr>
                                            <tr><td style="font-size: 14px; color: #331D19; line-height: 1.6;">${declineReason}</td></tr>
                                        </table>
                                    </td>
                                </tr>
                                ` : ''}
                                <tr><td height="32"></td></tr>
                                <tr>
                                    <td align="left" class="data-table" style="padding: 32px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Service</td></tr>
                                            <tr><td style="font-size: 16px; font-weight: 600; color: #331D19; padding-bottom: 20px;">${data.service_name || 'Service'}</td></tr>
                                            <tr><td style="font-size: 12px; color: #B0948F; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Requested time</td></tr>
                                            <tr><td style="font-size: 16px; font-weight: 600; color: #331D19;">${fmtDate(data.scheduled_at)}</td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px 0 24px 0;">
                            <a href="https://mykliques.com/app" class="cta-button">View my kliques →</a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 40px;">
                            <p style="color: #331D19; font-weight: 500; font-size: 15px; margin: 0;">- The Kliques Team</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            }).catch(() => {});
          }
        } else if (clientId && status === 'completed') {
          // Check for session notes, recommendation, and photos on the linked booking
          let hasNotes2 = false;
          let hasRecommendation2 = false;
          let hasPhotos2 = false;
          if (data.booking_id) {
            const { data: bookingDetail2 } = await supabase
              .from("bookings")
              .select("session_notes, session_recommendation")
              .eq("id", data.booking_id)
              .single();
            if (bookingDetail2) {
              if (bookingDetail2.session_notes) hasNotes2 = true;
              if (bookingDetail2.session_recommendation) hasRecommendation2 = true;
            }
            const { count: photoCount2 } = await supabase
              .from("booking_photos")
              .select("id", { count: "exact", head: true })
              .eq("booking_id", data.booking_id);
            if (photoCount2 > 0) hasPhotos2 = true;
          }
          const extras2 = [
            hasNotes2 && "session notes",
            hasRecommendation2 && "recommendations",
            hasPhotos2 && "photos",
          ].filter(Boolean);
          const extraText2 = extras2.length > 0
            ? ` Your provider also left ${extras2.join(" and ")} — view them in your booking details.`
            : "";

          await createClientNotification(clientId, {
            type: 'booking_completed',
            title: 'Service Completed!',
            body: `Your booking for ${data.service_name || 'your service'} has been marked as completed. Your invoice is now available in the Invoices page.${extraText2}`,
            booking_id: data.id,
            data: {
              provider_id: data.provider_id,
              status: 'completed'
            }
          });
        }
        return res.status(200).json({ job: data });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider job", error);
    }
  }

  const job = memoryStore.providerJobs.find(
    (item) => item.id === jobId && item.providerId === providerId
  );
  if (!job) {
    return res.status(404).json({ error: "Job not found." });
  }
  job.status = status;
  job.updatedAt = new Date().toISOString();
  res.status(200).json({ job });
});

app.get("/api/provider/earnings", async (req, res) => {
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerAuthId];

  // Default response structure
  const defaultEarnings = {
    availableBalance: 0,
    pendingClearance: 0,
    totalEarningsThisMonth: 0,
    totalEarningsLastMonth: 0,
    monthlyTrend: 0, // percentage change from last month
    weeklyData: [], // for weekly chart
    monthlyData: [], // for yearly chart
    transactions: [], // recent transactions
    payoutMethod: {
      type: 'bank',
      name: 'Bank Account',
      last4: '••••',
      status: 'inactive'
    },
    nextPayoutDate: null
  };

  if (!supabase) {
    return res.status(200).json({ earnings: defaultEarnings });
  }

  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYear = now.getFullYear();

    // Fetch all completed bookings for this provider
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .in("provider_id", providerIds)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.warn("[supabase] Failed to fetch bookings for earnings:", error);
      return res.status(200).json({ earnings: defaultEarnings });
    }

    const allBookings = bookings || [];
    const completedBookings = allBookings.filter((booking) => booking.status === "completed");
    const completedPaidBookings = completedBookings.filter((booking) => booking.payment_status === "paid");

    // Calculate available balance (completed + paid) as provider net earnings
    const availableBalance = completedPaidBookings.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0);

    // Calculate pending clearance (completed but payout/payment not cleared) as provider net earnings
    const completedPendingPayment = completedBookings.filter((b) => b.payment_status !== "paid");
    const pendingClearance = completedPendingPayment.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0);

    // Calculate this month's earnings by completion date
    const thisMonthBookings = completedPaidBookings.filter((b) => {
      const bookingDate = getBookingEarningDate(b);
      return bookingDate && bookingDate >= currentMonthStart && bookingDate < nextMonthStart;
    });
    const totalEarningsThisMonth = thisMonthBookings.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0);

    // Calculate last month's earnings for trend by completion date
    const lastMonthBookings = completedPaidBookings.filter((b) => {
      const bookingDate = getBookingEarningDate(b);
      return bookingDate && bookingDate >= lastMonthStart && bookingDate < currentMonthStart;
    });
    const totalEarningsLastMonth = lastMonthBookings.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0);

    // Calculate monthly trend percentage
    const monthlyTrend = totalEarningsLastMonth > 0
      ? Math.round(((totalEarningsThisMonth - totalEarningsLastMonth) / totalEarningsLastMonth) * 100)
      : (totalEarningsThisMonth > 0 ? 100 : 0);

    // Generate weekly data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayBookings = completedPaidBookings.filter((b) => {
        const bookingDate = getBookingEarningDate(b);
        return bookingDate && bookingDate >= dayStart && bookingDate < dayEnd;
      });

      weeklyData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayBookings.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0) / 100
      });
    }

    // Generate monthly data (current year)
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(now.getFullYear(), m, 1);
      const monthEndExclusive = new Date(now.getFullYear(), m + 1, 1);

      const monthBookings = completedPaidBookings.filter((b) => {
        const bookingDate = getBookingEarningDate(b);
        return bookingDate && bookingDate >= monthStart && bookingDate < monthEndExclusive;
      });

      const income = monthBookings.reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0) / 100;
      const jobCount = monthBookings.length;
      const grossIncome = monthBookings.reduce((sum, b) => sum + (b.price || 0), 0) / 100;
      const expense = Math.max(Math.round(grossIncome - income), 0);

      monthlyData.push({
        name: months[m],
        income: Math.round(income),
        expense,
        jobs: jobCount
      });
    }

    // Build service breakdown for current month
    const breakdownMap = {};
    thisMonthBookings.forEach((b) => {
      const key = b.service_name || "Other";
      if (!breakdownMap[key]) breakdownMap[key] = { name: key, sessions: 0, revenue: 0 };
      breakdownMap[key].sessions += 1;
      breakdownMap[key].revenue += getProviderNetBookingAmountCents(b);
    });
    const breakdown = Object.values(breakdownMap)
      .map(item => ({ ...item, revenue: item.revenue / 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    // Generate transactions list from completed bookings only, sorted by earning date.
    const transactions = [...completedBookings]
      .sort((a, b) => {
        const aDate = getBookingEarningDate(a)?.getTime() || 0;
        const bDate = getBookingEarningDate(b)?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, 20)
      .map(b => {
      const bookingDate = getBookingEarningDate(b);
      const isCompleted = b.status === 'completed';
      const isPaid = b.payment_status === 'paid';

      return {
        id: b.id,
        date: (bookingDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: `Payment from ${b.client_name || 'Client'} - ${b.service_name || 'Service'}`,
        amount: getProviderNetBookingAmountCents(b) / 100,
        type: 'INCOME',
        status: isPaid ? 'COMPLETED' : (isCompleted ? 'PENDING' : b.status.toUpperCase())
      };
    });

    // Calculate next payout (next Monday)
    const nextMonday = new Date(now);
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));

    const earnings = {
      availableBalance: availableBalance / 100, // Convert cents to dollars
      pendingClearance: pendingClearance / 100,
      totalEarningsThisMonth: totalEarningsThisMonth / 100,
      totalEarningsLastMonth: totalEarningsLastMonth / 100,
      monthlyTrend,
      weeklyData,
      monthlyData,
      breakdown,
      transactions,
      payoutMethod: {
        type: 'bank',
        name: 'Bank Account',
        last4: '••••',
        status: 'pending_setup' // Will be updated when Stripe Connect is fully integrated
      },
      nextPayoutDate: nextMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      stats: {
        totalJobs: completedBookings.length,
        thisMonthJobs: thisMonthBookings.length,
        averageJobValue: thisMonthBookings.length > 0
          ? Math.round(totalEarningsThisMonth / thisMonthBookings.length / 100)
          : 0
      },
      year: currentYear,
    };

    return res.status(200).json({ earnings });
  } catch (error) {
    console.error("[earnings] Unexpected error:", error);
    return res.status(200).json({ earnings: defaultEarnings });
  }
});

app.get("/api/provider/me", async (req, res) => {
  const providerId = getProviderId(req);

  if (supabase) {
    try {
      const [
        { data: providerProfile, error: profileError },
        { data: initialProviderRecord, error: providerError },
      ] = await Promise.all([
        supabase
          .from("provider_profiles")
          .select("*")
          .eq("provider_id", providerId)
          .maybeSingle(),
        supabase
          .from("providers")
          .select("id, user_id, name, business_name, category, categories, city, bio, handle, photo, avatar, stripe_account_id")
          .eq("user_id", providerId)
          .maybeSingle(),
      ]);
      let providerRecord = initialProviderRecord;

      if (providerProfile?.handle && !providerRecord?.handle) {
        const { data: backfilledProvider } = await supabase
          .from("providers")
          .upsert(
            {
              user_id: providerId,
              handle: providerProfile.handle,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .select("id, user_id, name, business_name, category, categories, city, bio, handle, photo, avatar, stripe_account_id")
          .maybeSingle();

        if (backfilledProvider) {
          providerRecord = backfilledProvider;
        }
      }

      if (profileError || providerError) {
        console.warn("[supabase] Failed to load provider profile, using stub.", profileError || providerError);
      } else {
        const mergedCategories = Array.isArray(providerProfile?.categories) && providerProfile.categories.length
          ? providerProfile.categories
          : Array.isArray(providerRecord?.categories) && providerRecord.categories.length
            ? providerRecord.categories
            : providerRecord?.category
              ? [providerRecord.category]
              : [];

        return res.status(200).json({
          profile: {
            ...(providerRecord || {}),
            ...(providerProfile || {}),
            business_name: providerProfile?.business_name || providerRecord?.business_name || "",
            bio: providerProfile?.bio || providerRecord?.bio || "",
            city: providerProfile?.city || providerRecord?.city || "",
            stripe_account_id: providerRecord?.stripe_account_id || providerProfile?.stripe_account_id || null,
            stripe_last4: providerProfile?.stripe_last4 || "",
            category: providerRecord?.category || providerProfile?.category || mergedCategories[0] || "",
            categories: mergedCategories,
          },
        });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error fetching provider profile", error);
    }
  }

  const profile =
    memoryStore.providerProfiles.find((item) => item.providerId === providerId) || null;
  if (!profile) {
    return res.status(404).json({ error: "Provider profile not found." });
  }
  const normalized = {
    ...profile,
    hourly_rate: profile.hourly_rate ?? profile.hourlyRate ?? 0,
    hourlyRate: profile.hourlyRate ?? profile.hourly_rate ?? 0,
    categories: profile.categories || [],
    schedule: profile.schedule || [],
  };
  res.status(200).json({ profile: normalized });
});

// GET /api/provider/dashboard — today's schedule + weekly earnings + new clients this week
app.get("/api/provider/dashboard", async (req, res) => {
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerAuthId];

  if (!supabase) {
    return res.status(200).json({ schedule: [], weeklyEarnings: 0, newClientsThisWeek: 0 });
  }

  try {
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    // Today window in local wall-clock strings to match how scheduled_at is stored.
    const todayStart = `${todayKey}T00:00:00`;
    const todayEnd = `${todayKey}T23:59:59`;

    // This-week window (Mon-Sun), also as local wall-clock strings.
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0,0,0,0);
    const weekStartKey = getLocalDateKey(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const weekEndKey = getLocalDateKey(weekEnd);

    const [todayRes, weekEarningsRes, weekClientsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, client_id, client_name, service_name, scheduled_at, duration, status")
        .in("provider_id", providerIds)
        .gte("scheduled_at", todayStart)
        .lte("scheduled_at", todayEnd)
        .not("status", "eq", "cancelled")
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("bookings")
        .select("client_id, price, status, payment_status, scheduled_at, completed_at")
        .in("provider_id", providerIds)
        .eq("status", "completed")
        .eq("payment_status", "paid"),
      supabase
        .from("bookings")
        .select("client_id, scheduled_at")
        .in("provider_id", providerIds)
        .gte("scheduled_at", `${weekStartKey}T00:00:00`)
        .lt("scheduled_at", `${weekEndKey}T00:00:00`),
    ]);

    const todayBookings = (todayRes.data || [])
      .filter((b) => getLocalDateKey(b.scheduled_at) === todayKey)
      .map((b) => ({
        id: b.id,
        clientName: b.client_name || "Client",
        serviceName: b.service_name || "Session",
        scheduledAt: b.scheduled_at,
        duration: b.duration,
        status: b.status,
      }));

    const weekEarningBookings = weekEarningsRes.data || [];
    const weekClientBookings = weekClientsRes.data || [];

    const weeklyEarnings = weekEarningBookings
      .filter((b) => {
        const earningDateKey = getLocalDateKey(b.completed_at || b.scheduled_at);
        return earningDateKey >= weekStartKey && earningDateKey < weekEndKey;
      })
      .reduce((sum, b) => sum + getProviderNetBookingAmountCents(b), 0);

    // New clients = client_ids that appear for the first time this week
    const weekClientIds = new Set(weekClientBookings.map((b) => b.client_id).filter(Boolean));
    let newClientsThisWeek = 0;
    if (weekClientIds.size > 0) {
      const { data: priorBookings } = await supabase
        .from("bookings")
        .select("client_id")
        .in("provider_id", providerIds)
        .lt("scheduled_at", `${weekStartKey}T00:00:00`)
        .in("client_id", [...weekClientIds]);

      const priorIds = new Set((priorBookings || []).map((b) => b.client_id));
      newClientsThisWeek = [...weekClientIds].filter((id) => !priorIds.has(id)).length;
    }

    return res.status(200).json({ schedule: todayBookings, weeklyEarnings, newClientsThisWeek });
  } catch (err) {
    console.error("[provider/dashboard]", err);
    return res.status(200).json({ schedule: [], weeklyEarnings: 0, newClientsThisWeek: 0 });
  }
});

// GET /api/provider/stats — rating, review count, distinct client count
app.get("/api/provider/stats", async (req, res) => {
  const providerId = getProviderId(req);

  if (!supabase) {
    return res.status(200).json({ stats: { rating: null, reviews: 0, clients: 0 } });
  }

  try {
    const [reviewsResult, clientsResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", providerId)
        .eq("is_visible", true),
      supabase
        .from("bookings")
        .select("client_id")
        .eq("provider_id", providerId)
        .eq("status", "completed"),
    ]);

    const reviewRows = reviewsResult.data || [];
    const reviewCount = reviewRows.length;
    const avgRating =
      reviewCount > 0
        ? (reviewRows.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount).toFixed(1)
        : null;

    const distinctClients = new Set(
      (clientsResult.data || []).map((b) => b.client_id)
    ).size;

    return res.status(200).json({
      stats: { rating: avgRating, reviews: reviewCount, clients: distinctClients },
    });
  } catch (err) {
    console.error("[provider/stats] Unexpected error:", err);
    return res.status(200).json({ stats: { rating: null, reviews: 0, clients: 0 } });
  }
});

app.patch("/api/provider/me", async (req, res) => {
  const providerId = getProviderId(req);
  const updates = req.body || {};

  if (supabase) {
    try {
      const now = new Date().toISOString();
      const normalizedCategory = updates.category ?? (Array.isArray(updates.categories) ? updates.categories[0] : undefined);
      const normalizedCategories = Array.isArray(updates.categories)
        ? updates.categories
        : normalizedCategory
          ? [normalizedCategory]
          : updates.categories;

      const profilePayload = {
        provider_id: providerId,
        updated_at: now,
      };

      const providerProfileFields = [
        "name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "bio",
        "avatar",
        "business_name",
        "city",
        "address_line1",
        "address_line2",
        "categories",
        "languages",
        "hourly_rate",
        "schedule",
        "notification_preferences",
        "booking_settings",
        "stripe_account_id",
        "stripe_last4",
        "account_status",
        "photo",
      ];

      for (const field of providerProfileFields) {
        if (typeof updates[field] !== "undefined") {
          profilePayload[field] = updates[field];
        }
      }

      if (normalizedCategories !== undefined) profilePayload.categories = normalizedCategories;

      const { data: profileData, error: profileError } = await supabase
        .from("provider_profiles")
        .upsert(profilePayload, { onConflict: "provider_id" })
        .select()
        .single();
      if (profileError) {
        console.warn("[supabase] Failed to update provider profile fields", profileError);
      }

      let providerData = null;
      const providerPayload = {
        user_id: providerId,
        updated_at: now,
      };

      const fallbackProviderName =
        updates.name ||
        updates.business_name ||
        profileData?.business_name ||
        profileData?.name ||
        updates.handle ||
        "Provider";

      providerPayload.name = fallbackProviderName;
      if (typeof updates.handle !== "undefined") providerPayload.handle = updates.handle || null;
      if (typeof updates.email !== "undefined") providerPayload.email = updates.email || null;
      if (typeof updates.business_name !== "undefined") providerPayload.business_name = updates.business_name;
      if (typeof updates.bio !== "undefined") providerPayload.bio = updates.bio;
      if (typeof updates.city !== "undefined") providerPayload.city = updates.city;
      if (typeof updates.photo !== "undefined") providerPayload.photo = updates.photo;
      if (typeof updates.avatar !== "undefined") providerPayload.avatar = updates.avatar;
      if (typeof updates.is_profile_complete !== "undefined") providerPayload.is_profile_complete = Boolean(updates.is_profile_complete);
      if (normalizedCategory !== undefined) providerPayload.category = normalizedCategory || null;
      if (normalizedCategories !== undefined) providerPayload.categories = normalizedCategories || [];

      if (Object.keys(providerPayload).length > 2) {
        const { data, error } = await supabase
          .from("providers")
          .upsert(providerPayload, { onConflict: "user_id" })
          .select("id, user_id, email, name, business_name, category, categories, city, bio, handle, photo, avatar, stripe_account_id")
          .single();
        if (error) {
          console.warn("[supabase] Failed to update providers row for profile changes", error);
        } else {
          providerData = data;
        }
      } else {
        const { data } = await supabase
          .from("providers")
          .select("id, user_id, email, name, business_name, category, categories, city, bio, handle, photo, avatar, stripe_account_id")
          .eq("user_id", providerId)
          .maybeSingle();
        providerData = data || null;
      }

      const mergedCategories = Array.isArray(profileData?.categories) && profileData.categories.length
        ? profileData.categories
        : Array.isArray(providerData?.categories) && providerData.categories.length
          ? providerData.categories
          : providerData?.category
            ? [providerData.category]
            : [];

      return res.status(200).json({
        profile: {
          ...(providerData || {}),
          ...(profileData || {}),
          business_name: profileData?.business_name || providerData?.business_name || "",
          bio: profileData?.bio || providerData?.bio || "",
          city: profileData?.city || providerData?.city || "",
          stripe_account_id: providerData?.stripe_account_id || profileData?.stripe_account_id || null,
          stripe_last4: profileData?.stripe_last4 || "",
          category: providerData?.category || mergedCategories[0] || "",
          categories: mergedCategories,
        },
      });
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider profile", error);
    }
  }

  let profile = memoryStore.providerProfiles.find(
    (item) => item.providerId === providerId
  );
  if (!profile) {
    profile = { providerId };
    memoryStore.providerProfiles.push(profile);
  }
  Object.assign(profile, updates, {
    updatedAt: new Date().toISOString(),
  });
  if (typeof updates.hourly_rate !== "undefined") {
    profile.hourlyRate = updates.hourly_rate;
  }
  if (typeof updates.hourlyRate !== "undefined") {
    profile.hourly_rate = updates.hourlyRate;
  }
  const normalized = {
    ...profile,
    hourly_rate: profile.hourly_rate ?? profile.hourlyRate ?? 0,
    hourlyRate: profile.hourlyRate ?? profile.hourly_rate ?? 0,
    categories: profile.categories || [],
    schedule: profile.schedule || [],
  };
  res.status(200).json({ profile: normalized });
});

app.patch("/api/provider/schedule", async (req, res) => {
  const providerId = getProviderId(req);
  const { schedule = [] } = req.body || {};

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: "schedule must be an array." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .upsert(
          {
            provider_id: providerId,
            schedule,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider_id" }
        )
        .select()
        .single();
      if (error) {
        console.warn("[supabase] Failed to update provider schedule, using stub.", error);
      } else {
        return res.status(200).json({ schedule: data.schedule || schedule });
      }
    } catch (error) {
      console.warn("[supabase] Unexpected error updating provider schedule", error);
    }
  }

  const profile =
    memoryStore.providerProfiles.find((item) => item.providerId === providerId) ||
    (() => {
      const newProfile = { providerId, schedule: [] };
      memoryStore.providerProfiles.push(newProfile);
      return newProfile;
    })();

  profile.schedule = schedule;
  if (profile.schedule && !profile.categories) {
    profile.categories = [];
  }
  profile.updatedAt = new Date().toISOString();

  res.status(200).json({ schedule });
});

// ============================================================================
// SUPABASE-ONLY ENDPOINTS: Notifications, Messages, Reviews, Promotions, Portfolio
// ============================================================================

app.get("/api/provider/notifications", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ notifications: data });
  } catch (err) {
    console.error("[supabase] Failed to load notifications", err);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.status(200).json({ notification: data });
  } catch (err) {
    console.error("[supabase] Failed to mark notification read", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

app.post("/api/conversations/:id/message-notification", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const conversationId = req.params.id;
  const senderId = getUserId(req);
  const { messageId = null, content = "", imageUrl = null } = req.body || {};

  if (!senderId) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, client_id, client_name, provider_id, provider_name")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const isClientSender = conversation.client_id === senderId;
    const isProviderSender = conversation.provider_id === senderId;

    if (!isClientSender && !isProviderSender) {
      return res.status(403).json({ error: "Not authorized for this conversation." });
    }

    const receiverId = isClientSender ? conversation.provider_id : conversation.client_id;
    const bodyPreview = content?.trim()
      ? (content.trim().length > 80 ? `${content.trim().slice(0, 80)}...` : content.trim())
      : "[Image]";

    const senderName = isClientSender
      ? conversation.client_name || "Client"
      : conversation.provider_name || "Provider";

    const notification = {
      type: "new_message",
      title: "New message",
      body: `${senderName}: ${bodyPreview}`,
      data: {
        conversation_id: conversation.id,
        message_id: messageId,
        sender_id: senderId,
        sender_name: senderName,
        client_id: conversation.client_id,
        provider_id: conversation.provider_id,
        client_name: conversation.client_name || null,
        provider_name: conversation.provider_name || null,
      },
    };

    if (isClientSender) {
      await createProviderNotification(receiverId, notification);
    } else {
      await createClientNotification(receiverId, notification);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[conversations/:id/message-notification POST]", err);
    return res.status(500).json({ error: "Failed to create message notification." });
  }
});

// Mark all provider notifications as read
app.patch("/api/provider/notifications/read-all", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("provider_id", providerId)
      .eq("is_read", false)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({ updated: data?.length || 0 });
  } catch (err) {
    console.error("[supabase] Failed to mark all provider notifications read", err);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// Delete a provider notification
app.delete("/api/provider/notifications/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const providerId = getProviderId(req);

  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("provider_id", providerId);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to delete provider notification", err);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

app.get("/api/messages/:threadId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const threadId = req.params.threadId;

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("sent_at", { ascending: true });

    if (error) {
      throw error;
    }

    const enriched = await attachProfilesToMessages(data);
    res.status(200).json({ messages: enriched });
  } catch (err) {
    console.error("[supabase] Failed to load messages", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

app.post("/api/messages", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  const { threadId, receiverId, body } = req.body || {};

  if (!receiverId || !body) {
    return res.status(400).json({
      error: "receiverId and body are required.",
    });
  }

  if (typeof body !== "string" || body.trim().length === 0 || body.length > 5000)
    return res.status(400).json({ error: "Invalid message body." });

  // sender_id is always the authenticated user — never trust client-supplied senderId
  const payload = {
    thread_id: threadId || crypto.randomUUID(),
    sender_id: userId,
    receiver_id: receiverId,
    body: body.trim(),
  };

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send notification to the receiver about the new message
    // Try to determine if receiver is a provider or client
    const { data: providerCheck } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", receiverId)
      .single();

    if (providerCheck) {
      // Receiver is a provider
      await createProviderNotification(receiverId, {
        type: 'new_message',
        title: 'New Message',
        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
        data: {
          thread_id: data.thread_id,
          sender_id: senderId,
          message_id: data.id
        }
      });
    } else {
      // Receiver is a client
      await createClientNotification(receiverId, {
        type: 'new_message',
        title: 'New Message',
        body: body.length > 50 ? body.substring(0, 50) + '...' : body,
        data: {
          thread_id: data.thread_id,
          sender_id: senderId,
          message_id: data.id
        }
      });
    }

    const enriched = (await attachProfilesToMessages([data]))?.[0] || data;
    res.status(201).json({ message: enriched });
  } catch (err) {
    console.error("[supabase] Failed to send message", err);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// Public provider stats (jobs completed, rating, review count)
app.get("/api/provider/:id/stats", async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ stats: { jobs_completed: 0, rating: 0, review_count: 0, repeat_percentage: 0 } });
  }

  const providerId = req.params.id;

  try {
    // Get completed bookings count
    const { count: jobsCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("status", "completed");

    // Get reviews stats
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("provider_id", providerId);

    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : 0;

    // Get repeat client percentage
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("client_id")
      .eq("provider_id", providerId)
      .eq("status", "completed");

    let repeatPercentage = 0;
    if (allBookings && allBookings.length > 1) {
      const clientCounts = {};
      allBookings.forEach(b => { clientCounts[b.client_id] = (clientCounts[b.client_id] || 0) + 1; });
      const repeatClients = Object.values(clientCounts).filter(c => c > 1).length;
      const totalClients = Object.keys(clientCounts).length;
      repeatPercentage = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;
    }

    res.status(200).json({
      stats: {
        jobs_completed: jobsCount || 0,
        rating: Number(avgRating),
        review_count: reviewCount,
        repeat_percentage: repeatPercentage,
      }
    });
  } catch (err) {
    console.error("[supabase] Failed to load provider stats", err);
    res.status(200).json({ stats: { jobs_completed: 0, rating: 0, review_count: 0, repeat_percentage: 0 } });
  }
});

app.get("/api/provider/:id/reviews", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ reviews: data });
  } catch (err) {
    console.error("[supabase] Failed to load reviews", err);
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

// GET /api/reviews/booking/:bookingId — fetch existing review for a booking
app.get("/api/reviews/booking/:bookingId", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  const { bookingId } = req.params;

  try {
    const { data: review, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error) throw error;
    if (!review) return res.status(404).json({ error: "No review found." });

    // Only the reviewer or the reviewed provider can see it
    if (review.client_id !== userId && review.provider_id !== userId) {
      return res.status(403).json({ error: "Not authorized." });
    }

    return res.status(200).json({ review });
  } catch (err) {
    console.error("[reviews/booking/:id] GET error:", err);
    return res.status(500).json({ error: "Failed to load review." });
  }
});


app.post("/api/reviews", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { bookingId, providerId, userId, rating, comment, tip_amount } = req.body || {};

  if (!bookingId || !providerId || !userId || typeof rating !== "number") {
    return res.status(400).json({
      error: "bookingId, providerId, userId, and numeric rating are required.",
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5." });
  }

  // Verify booking belongs to client and is completed
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .select("id, client_id, provider_id, status, service_name, scheduled_at, payment_intent_id, metadata")
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return res.status(404).json({ error: "Booking not found." });
  }
  if (booking.client_id !== userId) {
    return res.status(403).json({ error: "Not authorized to review this booking." });
  }
  if (booking.status !== "completed") {
    return res.status(400).json({ error: "Booking is not completed yet." });
  }

  const now = new Date().toISOString();
  const payload = {
    booking_id: bookingId,
    provider_id: providerId,
    client_id: userId,
    rating,
    comment: comment || "",
    service_id: booking.service_id || null,
    service_name: booking.service_name || null,
    created_at: now,
  };

  try {
    const { data: review, error } = await supabase
      .from("reviews")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Mark booking as reviewed
    await supabase
      .from("bookings")
      .update({ reviewed_at: now, updated_at: now })
      .eq("id", bookingId)
      .catch((err) => console.warn("[reviews] reviewed_at update failed:", err.message));

    // Handle tip if provided
    let tipError = null;
    const tipAmountCents = tip_amount ? Math.round(tip_amount) : 0;

    if (tipAmountCents > 0) {
      try {
        // Charge tip via Stripe — look up customer + payment method from original payment intent
        let stripeCharged = false;
        const originalPiId = booking.metadata?.stripe_payment_intent_id || booking.payment_intent_id;
        if (stripe && originalPiId) {
          const originalPi = await stripe.paymentIntents.retrieve(originalPiId);
          const customerId = originalPi?.customer;
          const paymentMethodId = originalPi?.payment_method;

          if (customerId && paymentMethodId) {
            await stripe.paymentIntents.create({
              amount: tipAmountCents,
              currency: PLATFORM_CURRENCY,
              customer: customerId,
              payment_method: paymentMethodId,
              confirm: true,
              off_session: true,
              description: `Tip for booking ${bookingId}`,
              metadata: { booking_id: bookingId, provider_id: providerId, type: "tip" },
            });
            stripeCharged = true;
          }
        }

        // Record tip in provider_earnings — increment totals
        const { data: existing } = await supabase
          .from("provider_earnings")
          .select("provider_id, total_earned, pending_payout, transactions")
          .eq("provider_id", providerId)
          .maybeSingle();

        const tipTransaction = {
          type: "tip",
          booking_id: bookingId,
          amount: tipAmountCents,
          stripe_charged: stripeCharged,
          created_at: now,
        };

        if (existing) {
          await supabase
            .from("provider_earnings")
            .update({
              total_earned: (existing.total_earned || 0) + tipAmountCents,
              pending_payout: (existing.pending_payout || 0) + tipAmountCents,
              transactions: [...(existing.transactions || []), tipTransaction],
            })
            .eq("provider_id", providerId);
        } else {
          await supabase
            .from("provider_earnings")
            .insert({
              provider_id: providerId,
              total_earned: tipAmountCents,
              pending_payout: tipAmountCents,
              transactions: [tipTransaction],
            });
        }
      } catch (tipErr) {
        console.error("[reviews] Tip failed:", tipErr);
        tipError = tipErr.message || "Tip payment failed.";
      }
    }

    // Notify provider about new review
    try {
      const clientName = booking.metadata?.client_name || "A client";
      const tipNote = tipAmountCents > 0 && !tipError
        ? ` and left a $${(tipAmountCents / 100).toFixed(0)} tip`
        : "";
      await createProviderNotification(providerId, {
        type: "new_review",
        title: "New review",
        body: `${clientName} left you a ${rating}-star review${tipNote}.`,
        booking_id: bookingId,
        data: { client_id: userId, rating, tip_amount: tipAmountCents },
      });
    } catch (notifErr) {
      console.warn("[reviews] Provider notification failed:", notifErr.message);
    }

    const response = { review };
    if (tipError) {
      response.tip_error = "Your review was submitted but the tip couldn't be processed. Try again from your booking history.";
    } else if (tipAmountCents > 0) {
      response.tip_amount = tipAmountCents;
    }

    res.status(201).json(response);
  } catch (err) {
    const isUniqueViolation = err?.code === "23505";
    if (isUniqueViolation) {
      // Return existing review so client can display it
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .single();
      return res.status(409).json({
        error: "A review already exists for this booking.",
        existing_review: existingReview || null,
      });
    }
    console.error("[supabase] Failed to create review", err);
    res.status(500).json({ error: "Failed to create review." });
  }
});

// POST /api/tips — standalone tip charge (retry after failed tip on review submit)
app.post("/api/tips", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });

  const { bookingId, providerId, amountCents, paymentMethodId, customerId } = req.body || {};
  if (!bookingId || !providerId || !amountCents) {
    return res.status(400).json({ error: "bookingId, providerId, and amountCents are required." });
  }

  try {
    const now = new Date().toISOString();
    const { data: tipRecord } = await supabase
      .from("provider_earnings")
      .insert({
        provider_id: providerId,
        booking_id: bookingId,
        type: "tip",
        gross_amount: Math.round(amountCents),
        platform_fee: 0,
        net_amount: Math.round(amountCents),
        payout_status: "pending",
        created_at: now,
      })
      .select()
      .single();

    let stripeIntentId = null;
    if (stripe && paymentMethodId && customerId) {
      const tipIntent = await stripe.paymentIntents.create({
        amount: Math.round(amountCents),
        currency: PLATFORM_CURRENCY,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: `Tip for booking ${bookingId}`,
        metadata: { booking_id: bookingId, provider_id: providerId, type: "tip" },
      });
      stripeIntentId = tipIntent.id;
      if (tipRecord) {
        await supabase
          .from("provider_earnings")
          .update({ stripe_payment_intent_id: stripeIntentId })
          .eq("id", tipRecord.id)
          .catch(() => {});
      }
    }

    res.status(201).json({ tip: tipRecord, stripe_intent_id: stripeIntentId });
  } catch (err) {
    console.error("[tips] Failed to process tip:", err);
    res.status(500).json({ error: err.message || "Failed to process tip." });
  }
});

app.get("/api/provider/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("provider_id", providerId)
      .order("start_at", { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({ promotions: data });
  } catch (err) {
    console.error("[supabase] Failed to load promotions", err);
    res.status(500).json({ error: "Failed to load promotions." });
  }
});

app.post("/api/provider/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const {
    promoCode,
    discountType,
    discountValue,
    startAt,
    endAt,
    isActive = true,
    applicableServices = [],
  } = req.body || {};

  if (!promoCode || !discountType || typeof discountValue !== "number") {
    return res.status(400).json({
      error: "promoCode, discountType, and numeric discountValue are required.",
    });
  }

  const normalizedType = String(discountType).toLowerCase();
  if (!["percentage", "fixed"].includes(normalizedType)) {
    return res.status(400).json({ error: "discountType must be 'percentage' or 'fixed'." });
  }

  const payload = {
    provider_id: providerId,
    promo_code: promoCode,
    discount_type: normalizedType,
    discount_value: discountValue,
    is_active: Boolean(isActive),
    start_at: startAt || null,
    end_at: endAt || null,
    applicable_services: Array.isArray(applicableServices)
      ? applicableServices
      : [],
  };

  try {
    const { data, error } = await supabase
      .from("promotions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ promotion: data });
  } catch (err) {
    const isConflict = err?.code === "23505";
    if (isConflict) {
      return res.status(409).json({ error: "Promo code already exists for this provider." });
    }
    console.error("[supabase] Failed to create promotion", err);
    res.status(500).json({ error: "Failed to create promotion." });
  }
});

app.patch("/api/provider/promotions/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const promotionId = req.params.id;
  const {
    promoCode,
    discountType,
    discountValue,
    startAt,
    endAt,
    isActive,
    applicableServices,
  } = req.body || {};

  const updates = {};
  if (typeof promoCode !== "undefined") updates.promo_code = promoCode;
  if (typeof discountType !== "undefined") {
    const normalizedType = String(discountType).toLowerCase();
    if (!["percentage", "fixed"].includes(normalizedType)) {
      return res.status(400).json({ error: "discountType must be 'percentage' or 'fixed'." });
    }
    updates.discount_type = normalizedType;
  }
  if (typeof discountValue !== "undefined") {
    if (typeof discountValue !== "number") {
      return res.status(400).json({ error: "discountValue must be numeric." });
    }
    updates.discount_value = discountValue;
  }
  if (typeof startAt !== "undefined") updates.start_at = startAt || null;
  if (typeof endAt !== "undefined") updates.end_at = endAt || null;
  if (typeof isActive !== "undefined") updates.is_active = Boolean(isActive);
  if (typeof applicableServices !== "undefined") {
    updates.applicable_services = Array.isArray(applicableServices)
      ? applicableServices
      : [];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided to update." });
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .update(updates)
      .eq("id", promotionId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Promotion not found." });
    }

    res.status(200).json({ promotion: data });
  } catch (err) {
    console.error("[supabase] Failed to update promotion", err);
    res.status(500).json({ error: "Failed to update promotion." });
  }
});

// Validate and apply a promo code for a provider
app.post("/api/promotions/validate", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { promoCode, providerId, serviceName } = req.body || {};

  if (!promoCode || !providerId) {
    return res.status(400).json({ error: "promoCode and providerId are required." });
  }

  if (typeof promoCode !== "string" || promoCode.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(promoCode.trim())) {
    return res.status(400).json({ error: "Invalid promo code format." });
  }

  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("provider_id", providerId)
      .ilike("promo_code", promoCode)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Invalid promo code." });
    }

    // Check date validity
    const now = new Date();
    if (data.start_at && new Date(data.start_at) > now) {
      return res.status(400).json({ error: "This promotion has not started yet." });
    }
    if (data.end_at && new Date(data.end_at) < now) {
      return res.status(400).json({ error: "This promotion has expired." });
    }

    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return res.status(400).json({ error: "This promotion has reached its usage limit." });
    }

    // Check if service is applicable
    const applicableServices = data.applicable_services || [];
    if (applicableServices.length > 0 && serviceName) {
      const isApplicable = applicableServices.some(
        (s) => s.toLowerCase() === serviceName.toLowerCase() || s.toLowerCase() === 'all services'
      );
      if (!isApplicable) {
        return res.status(400).json({ error: "This promo code does not apply to the selected service." });
      }
    }

    res.status(200).json({
      valid: true,
      promotion: {
        id: data.id,
        promoCode: data.promo_code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        applicableServices: data.applicable_services,
      }
    });
  } catch (err) {
    console.error("[supabase] Failed to validate promo code", err);
    res.status(500).json({ error: "Failed to validate promo code." });
  }
});

// Get active promotions for a specific provider (public)
app.get("/api/provider/:providerId/promotions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.providerId;

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("promotions")
      .select("id, promo_code, discount_type, discount_value, applicable_services, start_at, end_at")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ promotions: data || [] });
  } catch (err) {
    console.error("[supabase] Failed to load provider promotions", err);
    res.status(500).json({ error: "Failed to load promotions." });
  }
});

// Increment promo code usage after successful booking
app.patch("/api/promotions/:id/increment-usage", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const promotionId = req.params.id;

  try {
    const { error } = await supabase.rpc('increment_promotion_usage', { promo_id: promotionId });
    if (error) {
      // Fallback: manual increment
      const { data: promo } = await supabase
        .from("promotions")
        .select("usage_count")
        .eq("id", promotionId)
        .single();

      if (promo) {
        await supabase
          .from("promotions")
          .update({ usage_count: (promo.usage_count || 0) + 1 })
          .eq("id", promotionId);
      }
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to increment promotion usage", err);
    res.status(200).json({ success: false });
  }
});

// Get own portfolio (authenticated provider)
app.get("/api/provider/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      media: (data || []).map((item) => ({
        ...item,
        url: item.media_url || null,
      })),
    });
  } catch (err) {
    console.error("[supabase] Failed to load portfolio media", err);
    res.status(500).json({ error: "Failed to load portfolio media." });
  }
});

// Get portfolio for a specific provider (public)
app.get("/api/provider/:providerId/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = req.params.providerId;

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .select("*")
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      media: (data || []).map((item) => ({
        ...item,
        url: item.media_url || null,
      })),
    });
  } catch (err) {
    console.error("[supabase] Failed to load provider portfolio", err);
    res.status(500).json({ error: "Failed to load portfolio." });
  }
});

app.post("/api/provider/portfolio", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { title, description, mediaUrl, mediaType = "image" } = req.body || {};

  if (!mediaUrl) {
    return res.status(400).json({ error: "mediaUrl is required." });
  }

  const payload = {
    provider_id: providerId,
    title: title || null,
    description: description || null,
    media_url: mediaUrl,
    media_type: mediaType || "image",
  };

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ media: { ...data, url: data.media_url || null } });
  } catch (err) {
    console.error("[supabase] Failed to add portfolio media", err);
    res.status(500).json({ error: "Failed to add portfolio media." });
  }
});

app.delete("/api/provider/portfolio/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const mediaId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("portfolio_media")
      .delete()
      .eq("id", mediaId)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Portfolio media not found." });
    }

    res.status(200).json({ media: { ...data, url: data.media_url || null } });
  } catch (err) {
    console.error("[supabase] Failed to delete portfolio media", err);
    res.status(500).json({ error: "Failed to delete portfolio media." });
  }
});

// ============================================================================
// SUPABASE-ONLY ENDPOINTS: Client profile, notifications, transaction ledger
// ============================================================================

app.get("/api/client/profile", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return res.status(200).json({ profile: null });
    }

    res.status(200).json({ profile: data });
  } catch (err) {
    console.error("[supabase] Failed to load client profile", err);
    res.status(500).json({ error: "Failed to load client profile." });
  }
});

app.put("/api/client/profile", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const updates = req.body || {};

  const payload = {
    user_id: userId,
    name: updates.name || null,
    email: updates.email || null,
    phone: updates.phone || null,
    city: updates.city || null,
    bio: updates.bio || null,
    avatar: updates.avatar || null,
    is_profile_complete: updates.is_profile_complete ?? false,
    updated_at: new Date().toISOString(),
    ...(updates.notification_preferences !== undefined && {
      notification_preferences: updates.notification_preferences,
    }),
  };

  try {
    const { data, error } = await supabase
      .from("client_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json({ profile: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert client profile", err);
    res.status(500).json({ error: "Failed to save client profile." });
  }
});

// PATCH /api/client/notification-preferences
app.patch("/api/client/notification-preferences", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  const { notification_preferences } = req.body || {};
  if (!notification_preferences) return res.status(400).json({ error: "notification_preferences required." });
  try {
    const { error } = await supabase
      .from("client_profiles")
      .upsert(
        { user_id: userId, notification_preferences, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[client/notification-preferences]", err);
    res.status(500).json({ error: "Failed to save preferences." });
  }
});

// GET /api/client/kliques — all providers this client is connected to
// Source of truth: provider_clients table (includes invite-only connections)
// Booking data merged in for visit count + last visit.
app.get("/api/client/kliques", requireAuth, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    // 1. All connections for this client
    const { data: connections, error: connErr } = await supabase
      .from("provider_clients")
      .select("provider_id, connected_at, source")
      .eq("client_id", userId);

    if (connErr) throw connErr;
    if (!connections || connections.length === 0) {
      return res.status(200).json({ kliques: [] });
    }

    const providerIds = connections.map((c) => c.provider_id);

    // 2. Booking aggregates (completed visits + last visit) — optional, providers with no bookings still show
    const { data: bookings } = await supabase
      .from("bookings")
      .select("provider_id, scheduled_at, status")
      .eq("client_id", userId)
      .in("provider_id", providerIds)
      .in("status", ["pending", "confirmed", "completed"]);

    const bookingMap = {};
    for (const b of bookings || []) {
      if (!bookingMap[b.provider_id]) bookingMap[b.provider_id] = { visits: 0, last_visit: null };
      const bDate = b.scheduled_at ? new Date(b.scheduled_at) : null;
      if (b.status === "completed") {
        bookingMap[b.provider_id].visits += 1;
        if (bDate && (!bookingMap[b.provider_id].last_visit || bDate > new Date(bookingMap[b.provider_id].last_visit))) {
          bookingMap[b.provider_id].last_visit = b.scheduled_at;
        }
      }
    }

    // 3. Provider profiles (try providers table first, fall back to provider_profiles)
    const { data: providers } = await supabase
      .from("providers")
      .select("user_id, handle, name, business_name, avatar, photo, category, categories, city")
      .in("user_id", providerIds);

    const providerMap = {};
    for (const p of providers || []) {
      providerMap[p.user_id] = p;
    }

    // 4. Avg ratings
    const { data: reviews } = await supabase
      .from("reviews")
      .select("provider_id, rating")
      .in("provider_id", providerIds)
      .eq("is_visible", true);

    const ratingMap = {};
    for (const r of reviews || []) {
      if (!ratingMap[r.provider_id]) ratingMap[r.provider_id] = { sum: 0, count: 0 };
      ratingMap[r.provider_id].sum += r.rating;
      ratingMap[r.provider_id].count += 1;
    }

    // 5. Build response
    const connMap = {};
    for (const c of connections) connMap[c.provider_id] = c;

    const kliques = providerIds.map((pid) => {
      const conn = connMap[pid];
      const p = providerMap[pid] || {};
      const bk = bookingMap[pid] || { visits: 0, last_visit: null };
      const rd = ratingMap[pid];
      const avgRating = rd && rd.count > 0 ? (rd.sum / rd.count).toFixed(1) : null;
      const category = p.category || (p.categories && p.categories[0]) || null;

      return {
        provider_id: pid,
        handle: p.handle || null,
        name: p.business_name || p.name || "Provider",
        avatar: p.avatar || p.photo || null,
        role: category,
        city: p.city || null,
        rating: avgRating,
        visits: bk.visits,
        last_visit: bk.last_visit,
        connected_at: conn.connected_at,
        source: conn.source,
      };
    });

    // Sort: most recent connection first, then most visits
    kliques.sort((a, b) =>
      new Date(b.connected_at) - new Date(a.connected_at) ||
      b.visits - a.visits
    );

    res.status(200).json({ kliques });
  } catch (err) {
    console.error("[client/kliques]", err);
    res.status(500).json({ error: "Failed to load kliques." });
  }
});

// GET /api/client/relationship/:providerId — full relationship data for one provider
app.get("/api/client/relationship/:providerId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const { providerId } = req.params;

  try {
    const [{ data: connection, error: connectionError }, { data: providerRow, error: providerError }, { data: profile, error: profileError }] = await Promise.all([
      supabase
        .from("provider_clients")
        .select("id, provider_id, client_id, connected_at, source")
        .eq("provider_id", providerId)
        .eq("client_id", userId)
        .maybeSingle(),
      supabase
        .from("providers")
        .select("user_id, handle, name, business_name, avatar, photo, bio, category, categories, city")
        .eq("user_id", providerId)
        .maybeSingle(),
      supabase
        .from("provider_profiles")
        .select("provider_id, name, avatar, bio, categories")
        .eq("provider_id", providerId)
        .maybeSingle(),
    ]);

    if (connectionError) throw connectionError;
    if (providerError) throw providerError;
    if (profileError && profileError.code !== "PGRST116") throw profileError;
    if (!connection) {
      return res.status(404).json({ error: "Relationship not found." });
    }

    // Fetch all bookings between this client and provider
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, service_id, service_name, scheduled_at, duration, price, currency, status, notes, session_notes, session_recommendation, created_at, reviewed_at")
      .eq("client_id", userId)
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false });

    if (bookingsError) throw bookingsError;

    const allBookings = bookings || [];

    // Aggregate stats
    const completedBookings = allBookings.filter((b) => b.status === "completed");
    const totalSessions = completedBookings.length;
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const togetherSince = connection.connected_at || null;

    const mergedCategories =
      Array.isArray(providerRow?.categories) && providerRow.categories.length > 0
        ? providerRow.categories
        : Array.isArray(profile?.categories) && profile.categories.length > 0
          ? profile.categories
          : providerRow?.category
            ? [providerRow.category]
            : [];

    res.status(200).json({
      provider: {
        provider_id: providerId,
        handle: providerRow?.handle || null,
        name: providerRow?.business_name || providerRow?.name || profile?.name || "Provider",
        avatar: providerRow?.avatar || providerRow?.photo || profile?.avatar || null,
        photo: providerRow?.photo || providerRow?.avatar || null,
        bio: providerRow?.bio || profile?.bio || null,
        categories: mergedCategories,
        city: providerRow?.city || null,
        source: connection.source || "booking",
        connected_at: connection.connected_at,
      },
      stats: {
        together_since: togetherSince,
        sessions: totalSessions,
        total_spent: totalSpent,
      },
      bookings: allBookings,
      connection,
    });
  } catch (err) {
    console.error("[supabase] Failed to load relationship data", err);
    res.status(500).json({ error: "Failed to load relationship data." });
  }
});

// GET /api/provider/bookings/pending-count — count of pending bookings for this provider
app.get("/api/provider/bookings/pending-count", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase client is not configured." });
  const providerId = getProviderId(req);
  try {
    const { count, error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", providerId)
      .eq("status", "pending");
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    console.error("[supabase] Failed to load pending count", err);
    res.status(500).json({ error: "Failed to load pending count." });
  }
});

function getLocalDateKey(value = new Date()) {
  if (typeof value === "string") {
    const rawDate = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (rawDate) return rawDate[1];
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalBookingDate(value) {
  if (!value) return null;
  const localValue = String(value)
    .trim()
    .replace(" ", "T")
    .replace(/(Z|[+-]\d{2}:\d{2})$/, "");
  const parsed = new Date(localValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getBookingEarningDate(booking) {
  return parseLocalBookingDate(booking?.completed_at || booking?.scheduled_at || booking?.created_at);
}

function getProviderNetBookingAmountCents(booking) {
  // booking.price stores the provider's service price in cents. The platform
  // fee is charged to the client on top, so provider earnings use price as-is.
  return Math.round(Number(booking?.price) || 0);
}

function getProviderBookingTab(booking, todayKey = getLocalDateKey()) {
  const status = String(booking?.status || "").toLowerCase();
  const bookingDateKey = getLocalDateKey(booking?.scheduled_at);

  if (status === "pending") return "pending";
  if (status === "completed" || status === "cancelled") return "past";
  if (status === "confirmed") {
    if (!bookingDateKey || !todayKey) return "upcoming";
    return bookingDateKey < todayKey ? "past" : "upcoming";
  }

  return null;
}

function sortProviderBookings(bookings, tab) {
  const items = [...(bookings || [])];

  if (tab === "pending") {
    return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  if (tab === "upcoming") {
    return items.sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""));
  }

  if (tab === "past") {
    return items.sort((a, b) => (b.scheduled_at || "").localeCompare(a.scheduled_at || ""));
  }

  return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

function getClientBookingTab(booking, todayKey = getLocalDateKey()) {
  const status = String(booking?.status || "").toLowerCase();
  const bookingDateKey = getLocalDateKey(booking?.scheduled_at);

  if (status === "pending") return "pending";
  if (status === "completed" || status === "cancelled") return "past";
  if (status === "confirmed") {
    if (!bookingDateKey || !todayKey) return "upcoming";
    return bookingDateKey < todayKey ? "past" : "upcoming";
  }

  return null;
}

function sortClientBookings(bookings, tab) {
  const items = [...(bookings || [])];

  if (tab === "pending") {
    return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  if (tab === "upcoming") {
    return items.sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""));
  }

  if (tab === "past") {
    return items.sort((a, b) => (b.scheduled_at || "").localeCompare(a.scheduled_at || ""));
  }

  return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

// GET /api/provider/calendar?year=YYYY&month=M(0-based) — bookings for this provider
// grouped by YYYY-MM-DD for the given month, used by the calendar view.
app.get("/api/provider/calendar", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerAuthId];
  const year  = parseInt(req.query.year,  10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10);        // 0-based
  const m = isNaN(month) ? new Date().getMonth() : month;

  const start = new Date(year, m, 1).toISOString();
  const end   = new Date(year, m + 1, 1).toISOString();

  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, client_name, service_name, scheduled_at, duration, status")
      .eq("provider_id", providerAuthId)
      .neq("status", "cancelled")
      .gte("scheduled_at", start)
      .lt("scheduled_at", end)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    // Group by local date string "YYYY-MM-DD"
    const byDate = {};
    for (const b of bookings || []) {
      if (!b.scheduled_at) continue;
      const key = b.scheduled_at.slice(0, 10); // "2026-03-19"
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(b);
    }

    // Also fetch blocked dates for this month
    const startDate = new Date(year, m, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, m + 1, 1).toISOString().slice(0, 10);
    const { data: blockedRows } = await supabase
      .from("provider_blocked_dates")
      .select("id, date, block_type, start_time, end_time, reason")
      .in("provider_id", providerIds)
      .gte("date", startDate)
      .lt("date", endDate);

    const blockedDates = {};
    for (const row of blockedRows || []) {
      if (!blockedDates[row.date]) blockedDates[row.date] = [];
      blockedDates[row.date].push(row);
    }

    res.status(200).json({ byDate, blockedDates });
  } catch (err) {
    console.error("[supabase] Failed to load provider calendar", err);
    res.status(500).json({ error: "Failed to load calendar." });
  }
});

async function buildProviderClientsResponse(providerIdentifier) {
  const identity = await getProviderIdentity(providerIdentifier);
  const providerIds = identity.ids;
  if (providerIds.length === 0) return { clients: [] };

  const { data: connections, error: connErr } = await supabase
    .from("provider_clients")
    .select("id, provider_id, client_id, invite_id, connected_at, source")
    .in("provider_id", providerIds)
    .order("connected_at", { ascending: false });

  if (connErr) throw connErr;

  const connectionMap = {};
  for (const row of connections || []) {
    if (!row?.client_id) continue;
    if (!connectionMap[row.client_id] || new Date(row.connected_at) > new Date(connectionMap[row.client_id].connected_at)) {
      connectionMap[row.client_id] = row;
    }
  }

  const clientIds = Object.keys(connectionMap);
  if (clientIds.length === 0) return { clients: [] };

  const [{ data: profiles, error: profileErr }, { data: bookings, error: bookingsErr }] = await Promise.all([
    supabase
      .from("client_profiles")
      .select("user_id, name, email, phone, city, avatar")
      .in("user_id", clientIds),
    supabase
      .from("bookings")
      .select("client_id, client_name, scheduled_at, price, status")
      .eq("provider_id", identity.authId)
      .in("client_id", clientIds),
  ]);

  if (profileErr) throw profileErr;
  if (bookingsErr) throw bookingsErr;

  const profileMap = {};
  for (const profile of profiles || []) profileMap[profile.user_id] = profile;

  const bookingMap = {};
  for (const booking of bookings || []) {
    if (!booking?.client_id) continue;
    if (!bookingMap[booking.client_id]) {
      bookingMap[booking.client_id] = {
        visit_count: 0,
        last_visit: null,
        last_booking_at: null,
        client_name: booking.client_name || null,
      };
    }

    const entry = bookingMap[booking.client_id];
    const scheduledAt = booking.scheduled_at || null;

    if (scheduledAt && (!entry.last_booking_at || new Date(scheduledAt) > new Date(entry.last_booking_at))) {
      entry.last_booking_at = scheduledAt;
    }

    if (booking.status === "completed") {
      entry.visit_count += 1;
      if (scheduledAt && (!entry.last_visit || new Date(scheduledAt) > new Date(entry.last_visit))) {
        entry.last_visit = scheduledAt;
      }
    }
  }

  const now = new Date();
  const newCutoff = new Date(now);
  newCutoff.setDate(newCutoff.getDate() - 14);
  const activeCutoff = new Date(now);
  activeCutoff.setDate(activeCutoff.getDate() - 30);

  const clients = clientIds
    .map((clientId) => {
      const connection = connectionMap[clientId];
      const profile = profileMap[clientId] || {};
      const aggregate = bookingMap[clientId] || { visit_count: 0, last_visit: null, last_booking_at: null, client_name: null };
      const connectedAt = connection?.connected_at || null;
      const lastVisit = aggregate.last_visit;
      const lastBookingAt = aggregate.last_booking_at;

      let status = "active";
      if (aggregate.visit_count === 0 && connectedAt && new Date(connectedAt) >= newCutoff) {
        status = "new";
      } else if (aggregate.visit_count > 0 && lastVisit && new Date(lastVisit) < activeCutoff) {
        status = "at-risk";
      } else if ((lastBookingAt && new Date(lastBookingAt) >= activeCutoff) || (lastVisit && new Date(lastVisit) >= activeCutoff)) {
        status = "active";
      } else if (aggregate.visit_count > 0) {
        status = "at-risk";
      } else {
        status = "active";
      }

      return {
        id: connection?.id || `${identity.authId}:${clientId}`,
        provider_id: connection?.provider_id || identity.authId,
        client_id: clientId,
        invite_id: connection?.invite_id || null,
        connected_at: connectedAt,
        source: connection?.source || "booking",
        full_name: profile.name || aggregate.client_name || "Client",
        name: profile.name || aggregate.client_name || "Client",
        email: profile.email || null,
        phone: profile.phone || null,
        city: profile.city || null,
        avatar: profile.avatar || null,
        visit_count: aggregate.visit_count,
        visits: aggregate.visit_count,
        last_visit: lastVisit,
        last_booking_at: lastBookingAt,
        status,
      };
    })
    .sort((a, b) => new Date(b.connected_at || 0) - new Date(a.connected_at || 0));

  return { clients };
}

async function buildProviderClientTimeline(providerIdentifier, clientId) {
  const identity = await getProviderIdentity(providerIdentifier);
  const providerIds = identity.ids;
  if (providerIds.length === 0) throw new Error("Provider not found.");

  const [{ data: connection, error: connectionErr }, { data: profile, error: profileErr }, { data: bookings, error: bookingsErr }] = await Promise.all([
    supabase
      .from("provider_clients")
      .select("id, provider_id, client_id, invite_id, connected_at, source")
      .in("provider_id", providerIds)
      .eq("client_id", clientId)
      .order("connected_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("client_profiles")
      .select("user_id, name, email, phone, city, avatar")
      .eq("user_id", clientId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id, service_id, service_name, scheduled_at, duration, price, status, notes, session_notes, session_recommendation, completed_at, created_at, client_name")
      .eq("provider_id", identity.authId)
      .eq("client_id", clientId)
      .order("scheduled_at", { ascending: false }),
  ]);

  if (connectionErr) throw connectionErr;
  if (profileErr) throw profileErr;
  if (bookingsErr) throw bookingsErr;
  if (!connection) {
    const error = new Error("Client connection not found.");
    error.status = 404;
    throw error;
  }

  const allBookings = bookings || [];
  const completedBookings = allBookings.filter((booking) => booking.status === "completed");
  const lastVisit = completedBookings.length > 0
    ? completedBookings.reduce((latest, booking) => {
        if (!latest) return booking.scheduled_at;
        return new Date(booking.scheduled_at) > new Date(latest) ? booking.scheduled_at : latest;
      }, null)
    : null;

  const events = [
    {
      id: `connected-${connection.id || clientId}`,
      type: "connected",
      status: "connected",
      service_name: connection.source,
      scheduled_at: connection.connected_at,
      completed_at: null,
      source: connection.source,
      connected_at: connection.connected_at,
    },
    ...allBookings.map((booking) => ({
      ...booking,
      type: "booking",
      source: booking.status === "cancelled" ? "booking_cancelled" : "booking",
    })),
  ].sort((a, b) => new Date(b.scheduled_at || b.connected_at || 0) - new Date(a.scheduled_at || a.connected_at || 0));

  return {
    client: {
      user_id: clientId,
      name: profile?.name || allBookings[0]?.client_name || "Client",
      full_name: profile?.name || allBookings[0]?.client_name || "Client",
      email: profile?.email || null,
      phone: profile?.phone || null,
      city: profile?.city || null,
      avatar: profile?.avatar || null,
    },
    connection,
    stats: {
      visits: completedBookings.length,
      session_count: completedBookings.length,
      last_visit: lastVisit,
      connected_at: connection.connected_at,
    },
    timeline: events,
    bookings: allBookings,
  };
}

async function handleProviderClients(req, res, providerIdentifier) {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    const callerIdentity = await getProviderIdentity(getUserId(req));
    const requestedIdentity = await getProviderIdentity(providerIdentifier);

    if (callerIdentity.authId !== requestedIdentity.authId) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const payload = await buildProviderClientsResponse(requestedIdentity.authId);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("[provider/clients]", err);
    return res.status(500).json({ error: "Failed to load provider clients." });
  }
}

async function handleProviderClientTimeline(req, res, providerIdentifier, clientId) {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    const callerIdentity = await getProviderIdentity(getUserId(req));
    const requestedIdentity = await getProviderIdentity(providerIdentifier);

    if (callerIdentity.authId !== requestedIdentity.authId) {
      return res.status(403).json({ error: "Forbidden." });
    }

    const payload = await buildProviderClientTimeline(requestedIdentity.authId, clientId);
    return res.status(200).json(payload);
  } catch (err) {
    if (err?.status === 404) {
      return res.status(404).json({ error: "Client connection not found." });
    }
    console.error("[provider/client timeline]", err);
    return res.status(500).json({ error: "Failed to load client timeline." });
  }
}

app.get("/api/provider/clients", async (req, res) => {
  return handleProviderClients(req, res, getUserId(req));
});

app.get("/api/providers/:id/clients", async (req, res) => {
  return handleProviderClients(req, res, req.params.id);
});

// insights routes MUST be before :clientId to avoid param shadowing
app.get("/api/provider/clients/insights", async (req, res) => {
  const providerId = getUserId(req);
  if (!providerId) return res.status(401).json({ error: "Not authenticated." });
  try {
    const result = await buildClientInsights(providerId, req.query);
    return res.status(200).json(result);
  } catch (err) {
    if (err?.status === 404) return res.status(404).json({ error: "Provider not found." });
    console.error("[provider/clients/insights]", err);
    return res.status(500).json({ error: "Failed to load client insights." });
  }
});

app.get("/api/provider/clients/insights/export", async (req, res) => {
  const providerId = getUserId(req);
  if (!providerId) return res.status(401).json({ error: "Not authenticated." });
  try {
    const { clients } = await buildClientInsights(providerId, { ...req.query, page: 1, limit: 10000 });
    const rows = clients.map((c) => ({
      Name: c.name,
      Email: c.email || "",
      Status: c.status,
      Visits: c.visits,
      "Total Spent ($)": (c.total_spent / 100).toFixed(2),
      "Last Visit": c.last_visit ? new Date(c.last_visit).toLocaleDateString() : "—",
      "Top Service": c.top_service || "—",
      "Connected Since": c.connected_at ? new Date(c.connected_at).toLocaleDateString() : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Client Insights");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", "attachment; filename=client-insights.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.status(200).send(buf);
  } catch (err) {
    if (err?.status === 404) return res.status(404).json({ error: "Provider not found." });
    console.error("[provider/clients/insights/export]", err);
    return res.status(500).json({ error: "Failed to export." });
  }
});

app.get("/api/provider/clients/:clientId", async (req, res) => {
  return handleProviderClientTimeline(req, res, getUserId(req), req.params.clientId);
});

app.get("/api/providers/:id/clients/:clientId/timeline", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  // Verify the authenticated user matches the provider ID in the URL
  if (userId !== req.params.id) return res.status(403).json({ error: "Not authorized." });
  return handleProviderClientTimeline(req, res, req.params.id, req.params.clientId);
});

// ─── Client Insights ─────────────────────────────────────────────────────────

async function buildClientInsights(providerAuthId, { status, service, period, search, sort, order, page, limit }) {
  if (!supabase) throw new Error("Supabase not configured.");

  // bookings.provider_id and provider_clients.provider_id both store the auth user UUID directly
  const now = new Date();
  const nowMs = now.getTime();
  let periodCutoff = null;
  if (period === "7d") periodCutoff = new Date(now - 7 * 86400000).toISOString();
  else if (period === "30d") periodCutoff = new Date(now - 30 * 86400000).toISOString();
  else if (period === "90d") periodCutoff = new Date(now - 90 * 86400000).toISOString();

  // Fetch all non-cancelled bookings for this provider. Period filtering is applied
  // after aggregation so lifecycle status and last-visit stay based on full history.
  const { data: bookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, client_id, service_id, price, status, scheduled_at, services(name)")
    .eq("provider_id", providerAuthId)
    .in("status", ["completed", "confirmed", "pending", "accepted"]);
  if (bErr) throw bErr;

  // Fetch all connected clients for this provider
  const { data: pcRows, error: pcErr } = await supabase
    .from("provider_clients")
    .select("client_id, connected_at")
    .eq("provider_id", providerAuthId);
  if (pcErr) throw pcErr;

  // Union: clients from bookings + clients from provider_clients
  const bookingClientIds = [...new Set((bookings || []).map((b) => b.client_id).filter(Boolean))];
  const connectedClientIds = [...new Set((pcRows || []).map((r) => r.client_id).filter(Boolean))];
  const allClientIds = [...new Set([...bookingClientIds, ...connectedClientIds])];

  if (allClientIds.length === 0) {
    return { stats: buildStats([], []), clients: [], total: 0 };
  }

  // client_profiles.user_id is text — cast client UUIDs to text for the IN filter
  const { data: profiles, error: prErr } = await supabase
    .from("client_profiles")
    .select("user_id, name, email, avatar")
    .in("user_id", allClientIds.map(String));
  if (prErr) throw prErr;

  const profileMap = Object.fromEntries((profiles || []).map((p) => [String(p.user_id), p]));
  const connectedMap = Object.fromEntries((pcRows || []).map((r) => [String(r.client_id), r.connected_at]));

  const clientMap = {};
  for (const b of (bookings || [])) {
    if (!b.client_id) continue;
    const key = String(b.client_id);
    if (!clientMap[key]) {
      clientMap[key] = {
        client_id: key,
        visits: 0,
        total_spent: 0,
        last_visit: null,
        last_booking_at: null,
        service_counts: {},
        period_visits: 0,
        period_total_spent: 0,
        period_service_counts: {},
        _matches_service: !service,
        _period_activity: !periodCutoff,
      };
    }
    const c = clientMap[key];
    const bDate = b.scheduled_at;
    const svcName = b.services?.name || "Unknown";
    const bookingIsInPeriod = !periodCutoff || (bDate && bDate >= periodCutoff);

    if (!c.last_booking_at || (bDate && bDate > c.last_booking_at)) c.last_booking_at = bDate;
    if (service && String(b.service_id) === String(service)) c._matches_service = true;
    if (bookingIsInPeriod) c._period_activity = true;

    if (String(b.status || "").toLowerCase() !== "completed") continue;

    c.visits += 1;
    c.total_spent += Number(b.price) || 0;
    if (bDate && (!c.last_visit || bDate > c.last_visit)) c.last_visit = bDate;
    c.service_counts[svcName] = (c.service_counts[svcName] || 0) + 1;

    if (bookingIsInPeriod) {
      c.period_visits += 1;
      c.period_total_spent += Number(b.price) || 0;
      c.period_service_counts[svcName] = (c.period_service_counts[svcName] || 0) + 1;
    }
  }

  // Ensure all connected clients appear even if no bookings in the period
  for (const cid of allClientIds) {
    const key = String(cid);
    if (!clientMap[key]) {
      const connectedAt = connectedMap[key] || null;
      clientMap[key] = {
        client_id: key,
        visits: 0,
        total_spent: 0,
        last_visit: null,
        last_booking_at: null,
        service_counts: {},
        period_visits: 0,
        period_total_spent: 0,
        period_service_counts: {},
        _matches_service: !service,
        _period_activity: !periodCutoff || (connectedAt && connectedAt >= periodCutoff),
      };
    } else if (periodCutoff && !clientMap[key]._period_activity) {
      const connectedAt = connectedMap[key] || null;
      if (connectedAt && connectedAt >= periodCutoff) clientMap[key]._period_activity = true;
    }
  }

  // Build client rows
  let rows = Object.values(clientMap).map((c) => {
    const profile = profileMap[String(c.client_id)] || {};
    const connected = connectedMap[String(c.client_id)];
    const connectedMs = connected ? new Date(connected).getTime() : nowMs;
    const lastVisitMs = c.last_visit ? new Date(c.last_visit).getTime() : null;
    const lastBookingMs = c.last_booking_at ? new Date(c.last_booking_at).getTime() : null;
    const daysSinceVisit = lastVisitMs ? (nowMs - lastVisitMs) / 86400000 : null;
    const daysSinceConnected = (nowMs - connectedMs) / 86400000;

    // Status logic
    let clientStatus;
    if (daysSinceConnected <= 14 && c.visits === 0) clientStatus = "new";
    else if (lastBookingMs && (nowMs - lastBookingMs) / 86400000 <= 30) clientStatus = "active";
    else if (daysSinceVisit === null || daysSinceVisit > 90) clientStatus = "inactive";
    else if (daysSinceVisit > 30) clientStatus = "at-risk";
    else clientStatus = "active";

    const serviceCounts = periodCutoff ? c.period_service_counts : c.service_counts;
    const top_service = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
      || Object.entries(c.service_counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      || null;

    return {
      client_id: c.client_id,
      name: profile.name || "Unknown",
      email: profile.email || null,
      avatar: profile.avatar || null,
      visits: periodCutoff ? c.period_visits : c.visits,
      total_spent: periodCutoff ? c.period_total_spent : c.total_spent,
      last_visit: c.last_visit,
      top_service,
      connected_at: connected || null,
      status: clientStatus,
      _matches_service: c._matches_service,
      _period_activity: c._period_activity,
    };
  });

  // Compute stats before filtering
  const stats = buildStats(rows, bookings);

  // Apply filters
  if (status && status !== "all") rows = rows.filter((r) => r.status === status);
  if (service) rows = rows.filter((r) => r._matches_service);
  if (periodCutoff) rows = rows.filter((r) => r._period_activity);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || (r.email && r.email.toLowerCase().includes(q)));
  }

  // Sort
  const sortKey = sort || "visits";
  const dir = order === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sortKey === "name") return dir * a.name.localeCompare(b.name);
    if (sortKey === "last_visit") {
      const aMs = a.last_visit ? new Date(a.last_visit).getTime() : 0;
      const bMs = b.last_visit ? new Date(b.last_visit).getTime() : 0;
      return dir * (aMs - bMs);
    }
    if (sortKey === "total_spent") return dir * (a.total_spent - b.total_spent);
    if (sortKey === "connected_at") {
      const aMs = a.connected_at ? new Date(a.connected_at).getTime() : 0;
      const bMs = b.connected_at ? new Date(b.connected_at).getTime() : 0;
      return dir * (aMs - bMs);
    }
    return dir * (a.visits - b.visits);
  });

  const total = rows.length;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const paginated = rows.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  // Strip internal fields
  const clean = paginated.map(({ _matches_service, _period_activity, ...r }) => r);
  return { stats, clients: clean, total, page: pageNum, limit: pageSize };
}

function buildStats(rows, bookings) {
  const now = Date.now();
  const totalClients = rows.length;
  const activeClients = rows.filter((r) => r.status === "active").length;
  const newThisMonth = rows.filter((r) => {
    if (!r.connected_at) return false;
    return now - new Date(r.connected_at).getTime() < 30 * 86400000;
  }).length;
  const avgVisits = totalClients > 0 ? (rows.reduce((s, r) => s + r.visits, 0) / totalClients).toFixed(1) : "0.0";
  // Retention: clients with >1 booking / clients with any booking
  const withBookings = rows.filter((r) => r.visits > 0).length;
  const returning = rows.filter((r) => r.visits > 1).length;
  const retentionRate = withBookings > 0 ? Math.round((returning / withBookings) * 100) : 0;

  return { total_clients: totalClients, active_clients: activeClients, new_this_month: newThisMonth, avg_visits: parseFloat(avgVisits), retention_rate: retentionRate };
}

// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/provider/clients/:clientId/conversation", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getUserId(req);
  const { clientId } = req.params;

  if (!providerId) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const conversation = await getOrCreateProviderClientConversation({
      providerAuthId: providerId,
      clientId,
    });

    return res.status(200).json({ conversation });
  } catch (err) {
    if (err?.status === 404) {
      return res.status(404).json({ error: "Client connection not found." });
    }
    console.error("[provider/client conversation]", err);
    return res.status(500).json({ error: "Failed to start conversation." });
  }
});

app.get("/api/client/notifications", requireAuth, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ notifications: data });
  } catch (err) {
    console.error("[supabase] Failed to load client notifications", err);
    res.status(500).json({ error: "Failed to load notifications." });
  }
});

app.post("/api/client/notifications", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const { type, title, body, data = {}, is_read = false } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "title is required." });
  }

  const payload = {
    user_id: userId,
    type: type || null,
    title,
    body: body || "",
    data,
    is_read: Boolean(is_read),
  };

  try {
    const { data: inserted, error } = await supabase
      .from("client_notifications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ notification: inserted });
  } catch (err) {
    console.error("[supabase] Failed to create client notification", err);
    res.status(500).json({ error: "Failed to create notification." });
  }
});

app.patch("/api/client/notifications/:id/read", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.status(200).json({ notification: data });
  } catch (err) {
    console.error("[supabase] Failed to mark client notification read", err);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// Mark all client notifications as read
app.patch("/api/client/notifications/read-all", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({ updated: data?.length || 0 });
  } catch (err) {
    console.error("[supabase] Failed to mark all client notifications read", err);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

// Delete a client notification
app.delete("/api/client/notifications/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const notificationId = req.params.id;
  const userId = getUserId(req);

  try {
    const { error } = await supabase
      .from("client_notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[supabase] Failed to delete client notification", err);
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

app.get("/api/client/transactions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("client_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({ transactions: data });
  } catch (err) {
    console.error("[supabase] Failed to load client transactions", err);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

app.post("/api/client/transactions", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);
  const {
    bookingId,
    amount,
    currency = PLATFORM_CURRENCY,
    status = "pending",
    description = "",
  } = req.body || {};

  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return res.status(400).json({ error: "amount (number) is required." });
  }

  const payload = {
    user_id: userId,
    booking_id: bookingId || null,
    amount,
    currency,
    status,
    description,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("client_transactions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ transaction: data });
  } catch (err) {
    console.error("[supabase] Failed to create client transaction", err);
    res.status(500).json({ error: "Failed to create transaction." });
  }
});

// Messages list for current user (sender or receiver)
app.get("/api/messages", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const userId = getUserId(req);

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("sent_at", { ascending: true });

    if (error) {
      throw error;
    }

    const enriched = await attachProfilesToMessages(data);
    res.status(200).json({ messages: enriched });
  } catch (err) {
    console.error("[supabase] Failed to load user messages", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
});

// Provider time blocks (availability)
app.get("/api/provider/time-blocks", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerIds = providerIdentity.ids;
  try {
    const { data, error } = await supabase
      .from("provider_time_blocks")
      .select("*")
      .in("provider_id", providerIds)
      .order("day_index", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.status(200).json({ blocks: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider time blocks", err);
    res.status(500).json({ error: "Failed to load time blocks." });
  }
});

app.post("/api/provider/time-blocks", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerAuthId];
  const { blocks = [] } = req.body || {};

  if (!Array.isArray(blocks)) {
    return res.status(400).json({ error: "blocks must be an array." });
  }

  const payload = blocks.map((block) => ({
    provider_id: providerAuthId,
    day_index: block.dayIndex ?? block.day_index ?? 0,
    start_time: block.startTime ?? block.start_time,
    end_time: block.endTime ?? block.end_time,
    is_available: block.isAvailable ?? block.is_available ?? true,
  }));

  try {
    await supabase.from("provider_time_blocks").delete().in("provider_id", providerIds);

    const { data, error } = await supabase
      .from("provider_time_blocks")
      .insert(payload)
      .select();

    if (error) throw error;

    res.status(201).json({ blocks: data });
  } catch (err) {
    console.error("[supabase] Failed to upsert provider time blocks", err);
    res.status(500).json({ error: "Failed to save time blocks." });
  }
});

// ─── Provider weekly hours (provider_time_blocks) ────────────────────────────
// These are the 7-day recurring availability blocks used by AvailabilityPage

// GET /api/provider/weekly-hours — returns day_index 0-6 (0=Mon) with start/end
app.get("/api/provider/weekly-hours", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerIds = providerIdentity.ids;
  try {
    const [{ data, error }, { data: profileData, error: profileError }] = await Promise.all([
      supabase
        .from("provider_time_blocks")
        .select("*")
        .in("provider_id", providerIds)
        .order("day_index", { ascending: true }),
      supabase
        .from("provider_profiles")
        .select("booking_settings")
        .eq("provider_id", providerIdentity.authId || getProviderId(req))
        .maybeSingle(),
    ]);

    if (error) throw error;
    if (profileError) throw profileError;

    res.status(200).json({
      hours: data || [],
      bookingWindowDays: profileData?.booking_settings?.bookingWindowDays ?? null,
    });
  } catch (err) {
    console.error("[weekly-hours GET]", err);
    res.status(500).json({ error: "Failed to load weekly hours." });
  }
});

// POST /api/provider/weekly-hours — replace all with new schedule
// body: { hours: [{ dayIndex, isAvailable, timeSlots: ["09:00","13:30",...] }], bookingWindowDays }
app.post("/api/provider/weekly-hours", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerAuthId = providerIdentity.authId || getProviderId(req);
  const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerAuthId];
  const { hours = [], bookingWindowDays } = req.body || {};
  if (!Array.isArray(hours)) return res.status(400).json({ error: "hours must be an array." });
  try {
    await supabase.from("provider_time_blocks").delete().in("provider_id", providerIds);
    const payload = hours.map((h) => ({
      provider_id: providerAuthId,
      day_index: h.dayIndex ?? h.day_index ?? 0,
      is_available: h.isAvailable ?? h.is_available ?? true,
      time_slots: Array.isArray(h.timeSlots) ? h.timeSlots : null,
      start_time: null,
      end_time: null,
    }));
    const { data, error } = await supabase.from("provider_time_blocks").insert(payload).select();
    if (error) throw error;

    // Persist booking window in provider_profiles.booking_settings
    if (bookingWindowDays !== undefined) {
      const { data: prof, error: profileError } = await supabase
        .from("provider_profiles")
        .select("booking_settings")
        .eq("provider_id", providerAuthId)
        .maybeSingle();
      if (profileError) throw profileError;

      const bookingSettings = prof?.booking_settings || {};
      bookingSettings.bookingWindowDays = bookingWindowDays;

      const { error: bookingSettingsError } = await supabase
        .from("provider_profiles")
        .upsert(
          {
            provider_id: providerAuthId,
            booking_settings: bookingSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "provider_id" }
        );

      if (bookingSettingsError) throw bookingSettingsError;
    }
    res.status(201).json({ hours: data });
  } catch (err) {
    console.error("[weekly-hours POST]", err);
    res.status(500).json({ error: "Failed to save weekly hours." });
  }
});

// ─── Provider blocked dates ───────────────────────────────────────────────────

// GET /api/provider/blocked-dates — returns upcoming blocked dates
app.get("/api/provider/blocked-dates", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerIds = providerIdentity.ids;
  try {
    const { data, error } = await supabase
      .from("provider_blocked_dates")
      .select("*")
      .in("provider_id", providerIds)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true });
    if (error) throw error;
    res.status(200).json({ blocks: data || [] });
  } catch (err) {
    console.error("[blocked-dates GET]", err);
    res.status(500).json({ error: "Failed to load blocked dates." });
  }
});

// POST /api/provider/blocked-dates — add a blocked date or custom hours
// body: { date, blockType, startTime, endTime, reason }
app.post("/api/provider/blocked-dates", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerId = providerIdentity.recordId || providerIdentity.authId;
  const providerIds = providerIdentity.ids;
  if (!providerId) return res.status(400).json({ error: "Provider record not found." });
  const body = req.body || {};
  const date = body.date;
  const blockType = body.blockType || body.block_type || "full_day";
  const startTime = body.startTime || body.start_time || null;
  const endTime = body.endTime || body.end_time || null;
  const reason = body.reason || null;
  if (!date) return res.status(400).json({ error: "date is required." });

  // Validation for custom hours
  if ((blockType === "hours" || blockType === "custom_hours" || blockType === "partial" || blockType === "availability_override") && (!startTime || !endTime)) {
    return res.status(400).json({ error: "startTime and endTime are required for hour-level blocks." });
  }
  if ((blockType === "hours" || blockType === "custom_hours" || blockType === "partial" || blockType === "availability_override") && startTime >= endTime) {
    return res.status(400).json({ error: "endTime must be later than startTime." });
  }
  try {
    let data;
    let error;

    if (blockType === "availability_override") {
      const { data: existingOverride, error: existingError } = await supabase
        .from("provider_blocked_dates")
        .select("id")
        .in("provider_id", providerIds)
        .eq("date", date)
        .eq("block_type", "availability_override")
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingOverride?.id) {
        ({ data, error } = await supabase
          .from("provider_blocked_dates")
          .update({ start_time: startTime, end_time: endTime, reason })
          .eq("id", existingOverride.id)
          .eq("provider_id", providerId)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from("provider_blocked_dates")
          .insert({
            provider_id: providerId,
            date,
            block_type: "availability_override",
            start_time: startTime,
            end_time: endTime,
            reason,
          })
          .select()
          .single());
      }
    } else {
      ({ data, error } = await supabase
        .from("provider_blocked_dates")
        .insert({ provider_id: providerId, date, block_type: blockType, start_time: startTime, end_time: endTime, reason })
        .select()
        .single());
    }

    if (error) throw error;
    res.status(201).json({ block: data });
  } catch (err) {
    console.error("[blocked-dates POST]", err);
    res.status(500).json({ error: "Failed to block date." });
  }
});

// DELETE /api/provider/blocked-dates/:id
app.delete("/api/provider/blocked-dates/:id", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase not configured." });
  const providerIdentity = await getProviderIdentity(getProviderId(req));
  const providerIds = providerIdentity.ids;
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from("provider_blocked_dates")
      .delete()
      .eq("id", id)
      .in("provider_id", providerIds);
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[blocked-dates DELETE]", err);
    res.status(500).json({ error: "Failed to delete blocked date." });
  }
});

// ============================================
// Client Invoices
// ============================================

// GET /api/client/invoices - Fetch all invoices for the current client
app.get("/api/client/invoices", async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ invoices: [] });
  }

  const clientId = getUserId(req);

  if (!clientId) {
    return res.status(401).json({ error: "Client not authenticated" });
  }

  try {
    // Fetch the actual generated provider invoices for this client
    const { data: invoices, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("client_id", clientId)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error("[supabase] Failed to fetch client invoices:", error);
      return res.status(500).json({ error: "Failed to fetch invoices" });
    }

    const normalized = (invoices || []).map((invoice) => ({
      ...invoice,
      provider_name: invoice.business_name || invoice.provider_name || "Provider",
      service_name: invoice.service_name || invoice.service || "Service",
      service_description: invoice.service_description || invoice.description || null,
      total_amount: invoice.total_amount ?? invoice.total ?? invoice.subtotal ?? 0,
      issued_at: invoice.issued_at || invoice.created_at,
      created_at: invoice.created_at || invoice.issued_at,
      payment_status: invoice.payment_status || invoice.status || "paid",
    }));

    res.status(200).json({ invoices: normalized });
  } catch (err) {
    console.error("[client invoices] Unexpected error:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Provider invoices
app.get("/api/provider/invoices", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  try {
    const { data, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("provider_id", providerId)
      .order("issued_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ invoices: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider invoices", err);
    res.status(500).json({ error: "Failed to load invoices." });
  }
});

app.post("/api/provider/invoices", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const invoice = req.body || {};

  if (!invoice?.invoiceNumber && !invoice?.bookingId) {
    return res.status(400).json({
      error: "invoiceNumber or bookingId is required to create an invoice.",
    });
  }

  const payload = {
    provider_id: providerId,
    booking_id: invoice.bookingId || null,
    invoice_number: invoice.invoiceNumber || null,
    client_name: invoice.clientName || null,
    client_email: invoice.clientEmail || null,
    client_phone: invoice.clientPhone || null,
    service: invoice.service || null,
    description: invoice.description || null,
    total_amount: invoice.totalAmount ?? null,
    deposit_amount: invoice.depositAmount ?? null,
    final_amount: invoice.finalAmount ?? null,
    status: invoice.status || "pending",
    issued_at: invoice.issuedAt || new Date().toISOString(),
    paid_at: invoice.paidAt || null,
    notes: invoice.notes || null,
    address: invoice.address || null,
  };

  try {
    const { data, error } = await supabase
      .from("provider_invoices")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ invoice: data });
  } catch (err) {
    console.error("[supabase] Failed to create provider invoice", err);
    res.status(500).json({ error: "Failed to create invoice." });
  }
});

// GET /api/provider/invoices/:invoiceId/pdf
// Generate and download PDF for a provider invoice
app.get("/api/provider/invoices/:invoiceId/pdf", async (req, res) => {
  const { invoiceId } = req.params;

  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  try {
    // Get invoice details from database
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Get provider details for the invoice header
    const { data: provider } = await supabase
      .from("providers")
      .select("name, email, phone")
      .eq("user_id", invoice.provider_id)
      .single();

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    const safeInvoiceNumber = (invoice.invoice_number || invoiceId).replace(/[^a-zA-Z0-9-_]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${safeInvoiceNumber}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Format dates
    const invoiceDate = invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

    // Header - Company/Provider Info
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#C25E4A').text('kliques', 50, 50);
    doc.fontSize(10).font('Helvetica').fillColor('#333')
      .text(provider?.name || 'Service Provider', 50, 80)
      .text(provider?.email || '', 50, 95)
      .text(provider?.phone || '', 50, 110);

    // Invoice Title
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#333').text('INVOICE', 400, 50);
    doc.fontSize(10).font('Helvetica')
      .text(`Invoice #: ${invoice.invoice_number || invoiceId.substring(0, 8).toUpperCase()}`, 400, 80)
      .text(`Date: ${invoiceDate}`, 400, 95);

    // Status badge
    const statusColor = invoice.status === 'paid' ? '#16a34a' : '#eab308';
    doc.fontSize(10).font('Helvetica-Bold').fillColor(statusColor)
      .text(invoice.status?.toUpperCase() || 'PENDING', 400, 110);

    // Line separator
    doc.fillColor('#333').moveTo(50, 140).lineTo(550, 140).stroke();

    // Bill To Section
    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 160);
    doc.fontSize(10).font('Helvetica')
      .text(invoice.client_name || 'Client', 50, 180)
      .text(invoice.client_email || '', 50, 195)
      .text(invoice.client_phone || '', 50, 210)
      .text(invoice.address || '', 50, 225);

    // Service Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE DETAILS', 50, 270);

    // Table headers
    const tableTop = 295;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });

    // Line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Service details
    doc.font('Helvetica');
    doc.text(invoice.service || 'Service', 50, tableTop + 25, { width: 350 });

    if (invoice.description) {
      doc.fontSize(9).fillColor('#666')
        .text(invoice.description, 50, tableTop + 40, { width: 350 });
      doc.fillColor('#333').fontSize(10);
    }

    const totalAmount = (invoice.total_amount || 0) / 100;
    doc.text(`$${totalAmount.toFixed(2)}`, 450, tableTop + 25, { align: 'right' });

    // Payment Summary section
    const summaryTop = tableTop + 100;
    doc.moveTo(300, summaryTop).lineTo(550, summaryTop).stroke();

    doc.fontSize(10).font('Helvetica');
    doc.text('Service Amount:', 300, summaryTop + 15);
    doc.text(`$${totalAmount.toFixed(2)}`, 450, summaryTop + 15, { align: 'right' });

    let currentY = summaryTop + 35;

    // Show deposit if applicable
    if (invoice.deposit_amount && invoice.deposit_amount > 0) {
      const depositAmount = invoice.deposit_amount / 100;
      const finalAmount = (invoice.final_amount || invoice.total_amount - invoice.deposit_amount) / 100;

      doc.text('Deposit Paid:', 300, currentY);
      doc.text(`-$${depositAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += 20;

      doc.text('Balance Due:', 300, currentY);
      doc.text(`$${finalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });
      currentY += 20;
    }

    // Total line
    doc.moveTo(300, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL:', 300, currentY);
    doc.text(`$${totalAmount.toFixed(2)}`, 450, currentY, { align: 'right' });

    // Payment status indicator
    currentY += 30;
    if (invoice.status === 'paid') {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a')
        .text('✓ PAID', 300, currentY);
      if (invoice.paid_at) {
        doc.fillColor('#666').font('Helvetica').fontSize(9)
          .text(`Paid on: ${new Date(invoice.paid_at).toLocaleDateString()}`, 300, currentY + 15);
      }
    } else {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#eab308')
        .text('⏳ PAYMENT PENDING', 300, currentY);
    }

    // Notes section
    if (invoice.notes) {
      doc.fillColor('#333').fontSize(10).font('Helvetica-Bold')
        .text('Notes:', 50, summaryTop + 15);
      doc.font('Helvetica').fontSize(9)
        .text(invoice.notes, 50, summaryTop + 30, { width: 200 });
    }

    // Footer
    doc.fontSize(9).fillColor('#666')
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })
      .text('Invoice generated by Kliques', 50, 715, { align: 'center', width: 500 });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Invoice PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  }
});

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send("STRIPE_WEBHOOK_SECRET is not configured.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[stripe] Webhook signature verification failed", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await markBookingPaid(session);
      } else {
        console.log(`[stripe] Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (handlerError) {
      console.error("[stripe] Webhook handler failed", handlerError);
      await reportWebhookError(event, handlerError);
      res.status(500).send("Webhook handler failed.");
    }
  }
);

async function markBookingPaid(session) {
  const bookingId = session.metadata?.bookingId;
  const providerId = session.metadata?.providerId;

  if (!bookingId) {
    console.warn(
      "[stripe] checkout.session.completed missing bookingId metadata; skipping Supabase update."
    );
    return;
  }

  if (!supabase) {
    console.warn(
      "[stripe] Supabase client not configured. Skipping booking update."
    );
    return;
  }

  const updates = {
    status: "paid",
    payment_status: session.payment_status || "paid",
  };

  if (session.payment_intent) {
    updates.payment_intent_id = session.payment_intent;
  }

  if (session.amount_total) {
    updates.amount_paid = session.amount_total;
  }

  if (session.currency) {
    updates.currency = session.currency;
  }

  if (providerId) {
    updates.provider_id = providerId;
  }

  updates.paid_at = new Date().toISOString();

  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );

  const { error } = await supabase
    .from("bookings")
    .update(sanitizedUpdates)
    .eq("id", bookingId);

  if (error) {
    if (error.code === "42703") {
      console.error(
        "[stripe] Supabase is missing one of the columns referenced in the webhook update. Falling back to status-only update.",
        error
      );

      const fallback = {
        status: sanitizedUpdates.status,
        payment_status: sanitizedUpdates.payment_status,
        paid_at: sanitizedUpdates.paid_at,
      };

      const retry = await supabase
        .from("bookings")
        .update(fallback)
        .eq("id", bookingId);

      if (retry.error) {
        throw new Error(
          `Failed to mark booking ${bookingId} as paid in Supabase (missing columns). Latest error: ${retry.error.message}`
        );
      }

      console.log(
        `[stripe] Booking ${bookingId} marked as paid with fallback fields. Add missing columns to store full payment metadata.`
      );
      return;
    }

    throw new Error(
      `Failed to mark booking ${bookingId} as paid in Supabase: ${error.message}`
    );
  }

  console.log(
    `[stripe] Booking ${bookingId} marked as paid (payment_intent: ${session.payment_intent}).`
  );
}

function normalizeBooking(record) {
  const serviceName =
    record.service_name ||
    record.service_title ||
    record.serviceDescription ||
    record.service_description ||
    record.title ||
    `Booking ${record.id}`;

  const amountSources = [
    record.amount_due,
    record.amount_total,
    record.amount,
    record.price,
  ];

  const amountCandidate = amountSources.find(
    (value) => typeof value === "number" && !Number.isNaN(value)
  );

  const numericAmount =
    typeof amountCandidate === "number"
      ? amountCandidate
      : record.amount
        ? Number(record.amount)
        : 0;

  let amountInCents = 0;
  if (numericAmount > 0) {
    if (Number.isInteger(numericAmount) && numericAmount >= 1000) {
      amountInCents = numericAmount;
    } else if (Number.isInteger(numericAmount) && numericAmount < 1000) {
      amountInCents = numericAmount * 100;
    } else {
      amountInCents = Math.round(numericAmount * 100);
    }
  }

  const currency = (record.currency || "usd").toLowerCase();

  const providerId = record.provider_id || record.providerId || null;

  const customerEmail =
    record.customer_email || record.customerEmail || record.client_email || null;

  return {
    bookingId: record.id,
    serviceName,
    amount: amountInCents,
    currency,
    providerId,
    customerEmail,
    status: record.status,
  };
}

async function reportWebhookError(event, error) {
  console.error("[stripe] Reporting webhook failure", {
    eventId: event?.id,
    type: event?.type,
    message: error?.message,
  });

  const target = process.env.WEBHOOK_ALERT_URL;
  if (!target) {
    return;
  }

  try {
    const body = {
      eventId: event?.id,
      type: event?.type,
      message: error?.message,
      timestamp: new Date().toISOString(),
    };

    const fetchFn =
      typeof fetch === "function" ? fetch : (await import("node-fetch")).default;

    await fetchFn(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (notifyError) {
    console.error("[stripe] Failed to send webhook alert", notifyError);
  }
}

async function attachProfilesToMessages(messages = []) {
  if (!supabase || !Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const ids = Array.from(
    new Set(
      messages.flatMap((m) => [m.sender_id, m.receiver_id]).filter(Boolean)
    )
  );

  const profileMap = {};

  if (ids.length > 0) {
    const { data: providerProfiles } = await supabase
      .from("provider_profiles")
      .select("provider_id,name,avatar")
      .in("provider_id", ids);

    (providerProfiles || []).forEach((p) => {
      profileMap[p.provider_id] = {
        name: p.name,
        avatar: p.avatar,
        role: "provider",
      };
    });

    const { data: clientProfiles } = await supabase
      .from("client_profiles")
      .select("user_id,name,avatar")
      .in("user_id", ids);

    (clientProfiles || []).forEach((c) => {
      profileMap[c.user_id] = {
        name: c.name,
        avatar: c.avatar,
        role: "client",
      };
    });

    const missing = ids.filter((id) => !profileMap[id]);
    if (missing.length > 0) {
      const { data: providers } = await supabase
        .from("providers")
        .select("id,name,avatar")
        .in("id", missing);
      (providers || []).forEach((p) => {
        profileMap[p.id] = {
          name: p.name,
          avatar: p.avatar,
          role: "provider",
        };
      });
    }
  }

  return messages.map((m) => {
    const sender = profileMap[m.sender_id] || {};
    const receiver = profileMap[m.receiver_id] || {};
    return {
      ...m,
      sender_name: sender.name || m.sender_name || null,
      sender_avatar: sender.avatar || m.sender_avatar || null,
      receiver_name: receiver.name || m.receiver_name || null,
      receiver_avatar: receiver.avatar || m.receiver_avatar || null,
    };
  });
}

// ============================================================================
// PAYMENT ENDPOINTS - CLIENT PAYMENT METHODS
// ============================================================================

async function getClientStripeCustomerId(userId) {
  if (!userId || !supabase) return null;

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  return clientProfile?.stripe_customer_id || null;
}

async function requireClientStripeCustomerId(userId) {
  const customerId = await getClientStripeCustomerId(userId);
  if (!customerId) {
    const error = new Error("No saved payment methods found for this client.");
    error.statusCode = 400;
    throw error;
  }
  return customerId;
}

async function listCustomerCardPaymentMethods(customerId) {
  const customer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method || null;
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return {
    defaultPaymentMethodId,
    paymentMethods: paymentMethods.data,
  };
}

async function assertPaymentMethodBelongsToCustomer(paymentMethodId, customerId) {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (paymentMethod.customer !== customerId) {
    const error = new Error("Payment method does not belong to the authenticated client.");
    error.statusCode = 403;
    throw error;
  }
  return paymentMethod;
}

// POST /api/client/setup-intent
// Creates a SetupIntent for client to save their card
app.post("/api/client/setup-intent", async (req, res) => {
  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      limit: 100,
    });

    let customerId;
    const existingCustomer = customers.data.find(
      (c) => c.metadata?.userId === userId
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          userType: "client",
        },
      });
      customerId = customer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "on_session",
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });
  } catch (error) {
    console.error("Setup intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/payment-methods
// Retrieve all payment methods for a customer
app.post("/api/client/payment-methods", async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: "customerId required" });
  }

  try {
    // Get customer to find default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        isDefault: pm.id === defaultPaymentMethodId,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        },
      })),
    });
  } catch (error) {
    console.error("Payment methods error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/attach-payment-method
// Attach a payment method to a customer
app.post("/api/client/attach-payment-method", async (req, res) => {
  const { paymentMethodId, customerId, setAsDefault } = req.body;

  if (!paymentMethodId || !customerId) {
    return res.status(400).json({ error: "paymentMethodId and customerId required" });
  }

  try {
    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Check if this is the first payment method or if setAsDefault is true
    const existingMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Set as default if it's the first card or explicitly requested
    if (existingMethods.data.length === 1 || setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        isDefault: existingMethods.data.length === 1 || setAsDefault,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      },
    });
  } catch (error) {
    console.error("Attach payment method error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/set-default-payment-method
// Set a payment method as the default for a customer
app.post("/api/client/set-default-payment-method", async (req, res) => {
  const { paymentMethodId, customerId } = req.body;

  if (!paymentMethodId || !customerId) {
    return res.status(400).json({ error: "paymentMethodId and customerId required" });
  }

  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      success: true,
      message: "Default payment method updated successfully",
    });
  } catch (error) {
    console.error("Set default payment method error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/client/payment-methods/:paymentMethodId
// Remove a saved payment method
app.delete("/api/client/payment-methods/:paymentMethodId", async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ success: true });
  } catch (error) {
    console.error("Payment method deletion error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/charge
// Charge a saved payment method for a booking
app.post("/api/charge", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  const { amount, paymentMethodId, bookingId, providerId } = req.body;

  if (!amount || !paymentMethodId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Look up Stripe customer ID server-side — never trust client-supplied customerId
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    const customerId = clientProfile?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: "No saved payment method on file." });
    }

    await assertPaymentMethodBelongsToCustomer(paymentMethodId, customerId);

    // Resolve provider's stripe_account_id — providerId may be user_id (not providers.id)
    let providerStripeAccountId = null;
    if (providerId) {
      const { data: provRow } = await supabase
        .from("providers")
        .select("stripe_account_id")
        .or(`user_id.eq.${providerId},id.eq.${providerId}`)
        .maybeSingle();
      providerStripeAccountId = provRow?.stripe_account_id || null;
    }
    if (!providerStripeAccountId) {
      return res.status(400).json({ error: "Provider has not connected Stripe yet." });
    }
    const connectParams = buildConnectTransferParams(Math.round(amount), providerStripeAccountId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: PLATFORM_CURRENCY,
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        bookingId: bookingId || "unknown",
        providerId: providerId || "unknown",
      },
      ...connectParams,
    });

    // Update booking payment status
    if (bookingId && supabase) {
      try {
        await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            payment_intent_id: paymentIntent.id,
          })
          .eq("id", bookingId);
      } catch (_) {}
    }

    res.json({
      chargeId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });
  } catch (error) {
    console.error("Charge error:", error);
    res.status(500).json({ error: safeErrorMessage(error) });
  }
});

// POST /api/tips
// Charge a tip for a completed booking via saved payment method
app.post("/api/tips", async (req, res) => {
  const { bookingId, providerId, amountCents, paymentMethodId, customerId } = req.body;

  if (!bookingId || !providerId || !amountCents || !paymentMethodId || !customerId) {
    return res.status(400).json({ error: "Missing required fields: bookingId, providerId, amountCents, paymentMethodId, customerId" });
  }

  if (amountCents < 100) {
    return res.status(400).json({ error: "Tip must be at least $1.00" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountCents),
      currency: "cad",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        type: "tip",
        bookingId: String(bookingId),
        providerId: String(providerId),
      },
    });

    // Record the tip in the database
    if (supabase) {
      await supabase.from("client_transactions").insert({
        booking_id: bookingId,
        provider_id: providerId,
        amount: amountCents,
        type: "tip",
        stripe_payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        created_at: new Date().toISOString(),
      }).catch((err) => {
        console.error("[tip] Failed to record tip transaction:", err);
      });
    }

    res.status(201).json({ paymentIntentId: paymentIntent.id, status: paymentIntent.status });
  } catch (error) {
    console.error("[tip] Charge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/:bookingId/invoice
// Generate and download invoice PDF for a booking
app.get("/api/bookings/:bookingId/invoice", async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Get booking details from database
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Only generate invoice if payment is completed
    if (booking.payment_status !== 'succeeded' && booking.payment_status !== 'completed') {
      return res.status(400).json({ error: "Payment not completed for this booking" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${bookingId}.pdf`);

    // Pipe the PDF to response
    doc.pipe(res);

    // Add content to PDF
    const invoiceNumber = `INV-${booking.id.substring(0, 8).toUpperCase()}`;
    const invoiceDate = new Date(booking.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Header - Company Info
    doc.fontSize(24).font('Helvetica-Bold').text('PROXEY', 50, 50);
    doc.fontSize(10).font('Helvetica').text('Service Booking Platform', 50, 80);
    doc.text('proxey@example.com', 50, 95);

    // Invoice Title
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50);
    doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoiceNumber}`, 400, 80);
    doc.text(`Date: ${invoiceDate}`, 400, 95);

    // Line separator
    doc.moveTo(50, 130).lineTo(550, 130).stroke();

    // Bill To Section
    doc.fontSize(12).font('Helvetica-Bold').text('BILL TO:', 50, 150);
    doc.fontSize(10).font('Helvetica')
      .text(booking.client_name || 'Client', 50, 170)
      .text(booking.client_email || '', 50, 185)
      .text(booking.client_phone || '', 50, 200);

    // Service Provider Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE PROVIDER:', 350, 150);
    doc.fontSize(10).font('Helvetica')
      .text(booking.provider_name || 'Provider', 350, 170);

    // Service Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('SERVICE DETAILS', 50, 250);

    // Table headers
    const tableTop = 280;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Date & Time', 250, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });

    // Line under headers
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Service details
    doc.font('Helvetica');
    const serviceDate = new Date(booking.scheduled_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.text(booking.service_name, 50, tableTop + 25, { width: 190 });
    if (booking.service_description) {
      doc.fontSize(9).fillColor('#666')
        .text(booking.service_description, 50, tableTop + 40, { width: 190 });
      doc.fillColor('#000').fontSize(10);
    }
    doc.text(serviceDate, 250, tableTop + 25);
    doc.text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, tableTop + 25, { align: 'right' });

    // Total section
    const totalTop = tableTop + 80;
    doc.moveTo(350, totalTop).lineTo(550, totalTop).stroke();

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Subtotal:', 350, totalTop + 10);
    doc.text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, totalTop + 10, { align: 'right' });

    doc.text('TOTAL:', 350, totalTop + 35);
    doc.fontSize(14).text(`$${((booking.price || 0) / 100).toFixed(2)}`, 450, totalTop + 35, { align: 'right' });

    // Payment status
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#16a34a')
      .text('PAID', 350, totalTop + 60);
    doc.fillColor('#000').font('Helvetica')
      .text(`Payment Method: Card ending in ****`, 350, totalTop + 75);

    // Footer
    doc.fontSize(9).fillColor('#666')
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })
      .text('This is a computer-generated invoice.', 50, 715, { align: 'center', width: 500 });

    // Additional booking info if available
    if (booking.location) {
      doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')
        .text('Location:', 50, totalTop + 10);
      doc.font('Helvetica').text(booking.location, 50, totalTop + 25, { width: 250 });
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Invoice generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  }
});

// ============================================================================
// PAYMENT ENDPOINTS - PROVIDER STRIPE CONNECT
// ============================================================================

// POST /api/provider/connected-account
// Create a Connected Account for provider
app.post("/api/provider/connected-account", async (req, res) => {
  const { userId, email, businessName } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "userId and email required" });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: email,
      business_type: "individual",
      individual: {
        email: email,
      },
      business_profile: {
        name: businessName || email,
        support_email: email,
        url: "https://proxey.app",
      },
      metadata: {
        userId: userId,
        userType: "provider",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Persist the Stripe account ID to providers table immediately
    if (supabase) {
      await supabase
        .from("providers")
        .update({ stripe_account_id: account.id })
        .eq("user_id", userId);
    }

    res.json({
      accountId: account.id,
    });
  } catch (error) {
    console.error("Connected account error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/provider/onboarding-link
// Generate onboarding link for provider to complete Stripe setup
app.post("/api/provider/onboarding-link", async (req, res) => {
  const { accountId, refreshUrl, returnUrl } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "accountId required" });
  }

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    res.json({
      onboardingLink: link.url,
    });
  } catch (error) {
    console.error("Onboarding link error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/provider/account/:accountId
// Check provider's Stripe account status
app.get("/api/provider/account/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements || {},
    });
  } catch (error) {
    console.error("Account retrieval error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TIME REQUESTS & AVAILABILITY ENDPOINTS
// ============================================================================

// POST /api/time-requests
// Create a new time request from client to provider
app.post("/api/time-requests", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const {
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    providerId,
    requestedDate,
    requestedTime,
    serviceId,
    serviceName,
    durationMinutes = 60,
    notes
  } = req.body;

  if (!clientId || !providerId || !requestedDate || !requestedTime) {
    return res.status(400).json({
      error: "clientId, providerId, requestedDate, and requestedTime are required."
    });
  }

  try {
    // Combine date and time into a timestamp
    const requestedDatetime = new Date(`${requestedDate}T${requestedTime}`).toISOString();

    const payload = {
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      provider_id: providerId,
      requested_date: requestedDate,
      requested_time: requestedTime,
      requested_datetime: requestedDatetime,
      service_id: serviceId,
      service_name: serviceName,
      duration_minutes: durationMinutes,
      notes: notes || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from("time_requests")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Notify provider about the new time request
    const requestDateTime = new Date(`${requestedDate}T${requestedTime}`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    await createProviderNotification(providerId, {
      type: 'time_request',
      title: 'New Time Request',
      body: `A client is requesting an appointment for ${requestDateTime}`,
      request_id: data.id,
      data: {
        client_id: clientId,
        client_name: clientName,
        service_name: serviceName,
        requested_datetime: data.requested_datetime
      }
    });

    res.status(201).json({ timeRequest: data });
  } catch (err) {
    console.error("[supabase] Failed to create time request", err);
    res.status(500).json({ error: "Failed to create time request." });
  }
});

// GET /api/time-requests/client/:clientId
// Get all time requests for a client
app.get("/api/time-requests/client/:clientId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { clientId } = req.params;

  try {
    const { data, error } = await supabase
      .from("time_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("requested_datetime", { ascending: true });

    if (error) throw error;

    res.status(200).json({ timeRequests: data });
  } catch (err) {
    console.error("[supabase] Failed to load client time requests", err);
    res.status(500).json({ error: "Failed to load time requests." });
  }
});

// GET /api/time-requests/provider/:providerId
// Get all time requests for a provider
app.get("/api/time-requests/provider/:providerId", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const { status } = req.query;

  try {
    let query = supabase
      .from("time_requests")
      .select("*")
      .eq("provider_id", providerId);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("requested_datetime", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ timeRequests: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider time requests", err);
    res.status(500).json({ error: "Failed to load time requests." });
  }
});

// PATCH /api/time-requests/:id
// Update a time request (accept/decline/cancel)
app.patch("/api/time-requests/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { id } = req.params;
  const { status, providerResponse } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required." });
  }

  if (!['pending', 'accepted', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({
      error: "status must be one of: pending, accepted, declined, cancelled"
    });
  }

  try {
    const updates = {
      status,
      provider_response: providerResponse || null
    };

    if (status === 'accepted' || status === 'declined') {
      updates.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("time_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Time request not found." });
    }

    // Notify client about the time request status change
    if (data.client_id && (status === 'accepted' || status === 'declined')) {
      const requestDateTime = new Date(data.requested_datetime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      if (status === 'accepted') {
        await createClientNotification(data.client_id, {
          type: 'time_request_accepted',
          title: 'Request Accepted!',
          body: `Your time request for ${requestDateTime} has been accepted`,
          request_id: data.id,
          data: {
            provider_id: data.provider_id,
            requested_datetime: data.requested_datetime,
            service_name: data.service_name,
            status: 'accepted'
          }
        });
      } else if (status === 'declined') {
        await createClientNotification(data.client_id, {
          type: 'time_request_declined',
          title: 'Request Declined',
          body: `Your time request for ${requestDateTime} was not accepted`,
          request_id: data.id,
          data: {
            provider_id: data.provider_id,
            provider_response: data.provider_response,
            status: 'declined'
          }
        });
      }
    }

    res.status(200).json({ timeRequest: data });
  } catch (err) {
    console.error("[supabase] Failed to update time request", err);
    res.status(500).json({ error: "Failed to update time request." });
  }
});

// GET /api/provider/:providerId/availability
// Get provider's availability slots
app.get("/api/provider/:providerId/availability", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const { startDate, endDate, limit = 10 } = req.query;

  try {
    let query = supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_available", true)
      .eq("is_booked", false)
      .gte("datetime", new Date().toISOString());

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    query = query.order("datetime", { ascending: true }).limit(parseInt(limit));

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to load provider availability", err);
    res.status(500).json({ error: "Failed to load availability." });
  }
});

// GET /api/provider/:providerId/availability/closest
// Get the 3 closest available time slots for a provider
app.get("/api/provider/:providerId/availability/closest", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;

  try {
    const { data, error } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_available", true)
      .eq("is_booked", false)
      .gte("datetime", new Date().toISOString())
      .order("datetime", { ascending: true })
      .limit(3);

    if (error) throw error;

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to load closest availability", err);
    res.status(500).json({ error: "Failed to load availability." });
  }
});

// GET /api/public/provider/:providerId/slots?date=YYYY-MM-DD&duration=60
// Returns available time slots for a specific date.
// If the provider has explicit time_slots defined for the day, those are returned directly
// (minus any already booked). Falls back to start/end range generation for legacy rows.
app.get("/api/public/provider/:providerId/slots", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const { providerId } = req.params;
  const { date, duration = 60 } = req.query;
  if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)." });

  try {
    const providerIdentity = await getProviderIdentity(providerId);
    const providerIds = providerIdentity.ids.length > 0 ? providerIdentity.ids : [providerId];
    const dateObj = new Date(date + "T00:00:00");
    const jsDayIndex = dateObj.getDay(); // 0=Sun, 6=Sat
    const mondayFirstDayIndex = (jsDayIndex + 6) % 7; // 0=Mon, 6=Sun

    // 1. Provider's weekly schedule for this day
    const candidateDayIndexes = Array.from(new Set([jsDayIndex, mondayFirstDayIndex]));
    const { data: scheduleRows, error: scheduleError } = await supabase
      .from("provider_time_blocks")
      .select("start_time, end_time, is_available, day_index, time_slots")
      .in("provider_id", providerIds)
      .in("day_index", candidateDayIndexes)
      .eq("is_available", true);

    if (scheduleError) throw scheduleError;

    const mondaySchedules = (scheduleRows || []).filter((row) => Number(row.day_index) === mondayFirstDayIndex);
    const sundaySchedules = (scheduleRows || []).filter((row) => Number(row.day_index) === jsDayIndex);
    const schedules = mondaySchedules.length > 0 ? mondaySchedules : sundaySchedules;

    if (!schedules || schedules.length === 0) {
      return res.json({ slots: [] });
    }

    // 2. Per-day overrides / blocked ranges
    const { data: blockedDateRows } = await supabase
      .from("provider_blocked_dates")
      .select("block_type, start_time, end_time")
      .in("provider_id", providerIds)
      .eq("date", date);

    const fullDayBlock = (blockedDateRows || []).find((row) => row.block_type === "full_day");
    if (fullDayBlock) return res.json({ slots: [] });

    // 3. Existing bookings on this date (pending + confirmed)
    const dayStart = date + "T00:00:00";
    const dayEnd = date + "T23:59:59";
    const { data: bookings } = await supabase
      .from("bookings")
      .select("scheduled_at, duration")
      .in("provider_id", providerIds)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd);

    // Build booked minute-ranges (start inclusive, end exclusive) to block full duration
    const bookedTimes = new Set();
    const bookedBookingRanges = [];
    for (const b of bookings || []) {
      // Parse HH:MM directly from the stored string to avoid timezone shifts
      // Handles both "2026-04-15T14:30:00" and "2026-04-15 14:30:00" formats
      const timePart = (b.scheduled_at || '').replace('T', ' ').split(' ')[1] || '';
      const timeStr = timePart.slice(0, 5); // "HH:MM"
      if (!timeStr || timeStr.length < 5) continue;
      const [bh, bm] = timeStr.split(":").map(Number);
      const startMins = bh * 60 + bm;
      const dur = parseInt(b.duration) || 60;
      const endMins = startMins + dur;
      bookedTimes.add(timeStr);
      bookedBookingRanges.push({ start: startMins, end: endMins });
    }

    // Also build blocked minute-ranges from partial blocks for filtering
    const blockedRanges = [];
    for (const bl of blockedDateRows || []) {
      if (bl.block_type !== "partial" && bl.block_type !== "hours") continue;
      if (!bl.start_time || !bl.end_time) continue;
      const [sh, sm] = bl.start_time.split(":").map(Number);
      const [eh, em] = bl.end_time.split(":").map(Number);
      blockedRanges.push({ start: sh * 60 + sm, end: eh * 60 + em });
    }

    let slots = [];

    // Check if provider uses explicit time_slots
    const hasExplicitSlots = schedules.some((s) => Array.isArray(s.time_slots) && s.time_slots.length > 0);

    if (hasExplicitSlots) {
      // Merge all time_slots from matching day rows, sort, dedupe
      const allSlots = [];
      for (const s of schedules) {
        if (Array.isArray(s.time_slots)) allSlots.push(...s.time_slots);
      }
      // Check availability_override — if set, only include slots within that window
      const availabilityOverride = (blockedDateRows || []).find((row) => row.block_type === "availability_override");
      const overrideStart = availabilityOverride ? availabilityOverride.start_time : null;
      const overrideEnd = availabilityOverride ? availabilityOverride.end_time : null;

      slots = [...new Set(allSlots)]
        .sort()
        .filter((slot) => {
          const [h, m] = slot.split(":").map(Number);
          const mins = h * 60 + m;
          // Block if this slot overlaps any existing booking's duration
          if (bookedBookingRanges.some((r) => mins >= r.start && mins < r.end)) return false;
          // Check partial blocks
          if (blockedRanges.some((r) => mins >= r.start && mins < r.end)) return false;
          // Check override window
          if (overrideStart && overrideEnd) {
            const [oh, om] = overrideStart.split(":").map(Number);
            const [eh, em] = overrideEnd.split(":").map(Number);
            if (mins < oh * 60 + om || mins >= eh * 60 + em) return false;
          }
          return true;
        });
    } else {
      // Legacy: generate from start/end range
      const availabilityOverride = (blockedDateRows || []).find((row) => row.block_type === "availability_override");
      const availableWindows = availabilityOverride
        ? [{ start_time: availabilityOverride.start_time, end_time: availabilityOverride.end_time }]
        : schedules;

      const slotDuration = parseInt(duration);
      for (const window of availableWindows) {
        const [startH, startM] = window.start_time.split(":").map(Number);
        const [endH, endM] = window.end_time.split(":").map(Number);
        const windowStart = startH * 60 + startM;
        const windowEnd = endH * 60 + endM;
        for (let t = windowStart; t + slotDuration <= windowEnd; t += 30) {
          const slotEnd = t + slotDuration;
          const isBlocked = blockedRanges.some((r) => t < r.end && slotEnd > r.start);
          const isBookingConflict = bookedBookingRanges.some((r) => t < r.end && slotEnd > r.start);
          const h = Math.floor(t / 60).toString().padStart(2, "0");
          const mm = (t % 60).toString().padStart(2, "0");
          const slot = `${h}:${mm}`;
          if (!isBlocked && !isBookingConflict) slots.push(slot);
        }
      }
    }

    // Remove past slots if date is today (or in the past).
    // The client sends ?date=YYYY-MM-DD in local time. We compare each slot
    // against the current UTC time expressed as minutes-since-midnight on that
    // same calendar date, so the filter works regardless of server timezone.
    const nowUtc = new Date();
    const todayUtc = nowUtc.toISOString().slice(0, 10); // YYYY-MM-DD in UTC

    // Build a Date representing midnight of the requested date in UTC
    const requestedMidnightUtc = new Date(date + "T00:00:00Z");
    // Current offset from midnight of the requested date, in minutes
    const minutesSinceMidnightUtc = Math.floor((nowUtc - requestedMidnightUtc) / 60000);

    // Filter out slots that have already passed (with a 15-min buffer so clients
    // don't see slots they can't actually book in time)
    const BUFFER_MINS = 15;
    const filtered = (date <= todayUtc)
      ? slots.filter((s) => {
          const [h, m] = s.split(":").map(Number);
          return h * 60 + m > minutesSinceMidnightUtc + BUFFER_MINS;
        })
      : slots;

    res.json({ slots: filtered });
  } catch (err) {
    console.error("[public/provider/slots]", err);
    res.status(500).json({ error: "Failed to load slots." });
  }
});

// POST /api/provider/availability
// Provider creates/updates their availability
app.post("/api/provider/availability", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { slots = [] } = req.body;

  if (!Array.isArray(slots)) {
    return res.status(400).json({ error: "slots must be an array." });
  }

  try {
    const payload = slots.map(slot => ({
      provider_id: providerId,
      date: slot.date,
      time_slot: slot.timeSlot || slot.time_slot,
      datetime: slot.datetime,
      duration_minutes: slot.durationMinutes || slot.duration_minutes || 60,
      is_available: slot.isAvailable !== undefined ? slot.isAvailable : true,
      is_booked: slot.isBooked || false,
      notes: slot.notes || null
    }));

    const { data, error } = await supabase
      .from("provider_availability")
      .upsert(payload, { onConflict: 'provider_id,datetime' })
      .select();

    if (error) throw error;

    res.status(201).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to save provider availability", err);
    res.status(500).json({ error: "Failed to save availability." });
  }
});

// POST /api/provider/:providerId/availability/generate
// Generate availability slots for a provider
app.post("/api/provider/:providerId/availability/generate", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const { providerId } = req.params;
  const {
    startDate,
    endDate,
    startTime = '09:00:00',
    endTime = '17:00:00',
    slotDurationMinutes = 60,
    daysOfWeek = [1, 2, 3, 4, 5] // Monday to Friday
  } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      error: "startDate and endDate are required."
    });
  }

  try {
    const { data, error } = await supabase.rpc('generate_provider_availability', {
      p_provider_id: providerId,
      p_start_date: startDate,
      p_end_date: endDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_slot_duration_minutes: slotDurationMinutes,
      p_days_of_week: daysOfWeek
    });

    if (error) throw error;

    res.status(201).json({
      slotsCreated: data,
      message: `Successfully generated ${data} availability slots.`
    });
  } catch (err) {
    console.error("[supabase] Failed to generate availability", err);
    res.status(500).json({ error: "Failed to generate availability." });
  }
});

// DELETE /api/provider/availability/:id
// Delete an availability slot
app.delete("/api/provider/availability/:id", async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase client is not configured." });
  }

  const providerId = getProviderId(req);
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("provider_availability")
      .delete()
      .eq("id", id)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Availability slot not found." });
    }

    res.status(200).json({ availability: data });
  } catch (err) {
    console.error("[supabase] Failed to delete availability slot", err);
    res.status(500).json({ error: "Failed to delete availability slot." });
  }
});

// ============================================================
// ADMIN API ENDPOINTS
// ============================================================

// Admin: Dashboard stats
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({
      stats: { total_providers: 0, total_clients: 0, total_bookings: 0, total_revenue: 0 }
    });
  }

  try {
    const { count: providerCount } = await supabase
      .from("providers")
      .select("*", { count: "exact", head: true });

    const { count: clientCount } = await supabase
      .from("client_profiles")
      .select("*", { count: "exact", head: true });

    const { count: bookingCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    const { data: transactions } = await supabase
      .from("client_transactions")
      .select("amount")
      .eq("status", "completed");

    const totalRevenue = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    res.status(200).json({
      stats: {
        total_providers: providerCount || 0,
        total_clients: clientCount || 0,
        total_bookings: bookingCount || 0,
        total_revenue: totalRevenue,
      }
    });
  } catch (err) {
    console.error("[admin] Failed to load stats", err);
    res.status(500).json({ error: "Failed to load admin stats." });
  }
});

// Admin: List all users (providers + clients)
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ users: [], total: 0 });
  }

  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let users = [];

    // Fetch providers if role is not 'client'
    if (!role || role === "provider" || role === "all") {
      let providerQuery = supabase
        .from("providers")
        .select("user_id, name, email, phone, city, is_active, created_at", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        providerQuery = providerQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: providers, count: providerTotal } = await providerQuery;
      users = users.concat((providers || []).map(p => ({ ...p, role: "provider" })));
    }

    // Fetch clients if role is not 'provider'
    if (!role || role === "client" || role === "all") {
      let clientQuery = supabase
        .from("client_profiles")
        .select("user_id, name, email, phone, city, is_profile_complete, updated_at", { count: "exact" })
        .order("updated_at", { ascending: false });

      if (search) {
        clientQuery = clientQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: clients } = await clientQuery;
      users = users.concat((clients || []).map(c => ({
        ...c,
        role: "client",
        is_active: c.is_profile_complete !== false,
        created_at: c.updated_at
      })));
    }

    // Sort by created_at descending
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Paginate
    const paginatedUsers = users.slice(offset, offset + parseInt(limit));

    res.status(200).json({ users: paginatedUsers, total: users.length });
  } catch (err) {
    console.error("[admin] Failed to load users", err);
    res.status(500).json({ error: "Failed to load users." });
  }
});

// Admin: Toggle user active status
app.patch("/api/admin/users/:id/toggle-active", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured." });
  }

  const userId = req.params.id;

  try {
    // First get current status
    const { data: provider, error: fetchError } = await supabase
      .from("providers")
      .select("is_active")
      .eq("user_id", userId)
      .single();

    if (fetchError || !provider) {
      return res.status(404).json({ error: "Provider not found." });
    }

    // Toggle the status
    const { data, error } = await supabase
      .from("providers")
      .update({ is_active: !provider.is_active, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ user: data, message: `Provider ${data.is_active ? "activated" : "deactivated"}.` });
  } catch (err) {
    console.error("[admin] Failed to toggle user status", err);
    res.status(500).json({ error: "Failed to update user status." });
  }
});

// Admin: List all bookings
app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ bookings: [], total: 0 });
  }

  const { status, from, to, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("scheduled_at", from);
    }
    if (to) {
      query = query.lte("scheduled_at", to);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({ bookings: data || [], total: count || 0 });
  } catch (err) {
    console.error("[admin] Failed to load bookings", err);
    res.status(500).json({ error: "Failed to load bookings." });
  }
});

// Admin: List all services with category breakdown
app.get("/api/admin/services", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ services: [], categories: {} });
  }

  try {
    const { data: services, error } = await supabase
      .from("services")
      .select("*, providers(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate category breakdown
    const categories = {};
    (services || []).forEach(s => {
      const cat = s.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    res.status(200).json({
      services: (services || []).map(s => ({
        ...s,
        provider_name: s.providers?.name || "Unknown"
      })),
      categories
    });
  } catch (err) {
    console.error("[admin] Failed to load services", err);
    res.status(500).json({ error: "Failed to load services." });
  }
});

// Admin: List all reviews
app.get("/api/admin/reviews", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ reviews: [], total: 0 });
  }

  const { rating, is_visible, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = supabase
      .from("reviews")
      .select("*, providers(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (rating) {
      query = query.eq("rating", parseInt(rating));
    }
    if (is_visible !== undefined && is_visible !== "") {
      query = query.eq("is_visible", is_visible === "true");
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.status(200).json({
      reviews: (data || []).map(r => ({
        ...r,
        provider_name: r.providers?.name || "Unknown"
      })),
      total: count || 0
    });
  } catch (err) {
    console.error("[admin] Failed to load reviews", err);
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

// Admin: Update review (toggle visibility/featured)
app.patch("/api/admin/reviews/:id", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Database not configured." });
  }

  const reviewId = req.params.id;
  const { is_visible, is_featured } = req.body;

  try {
    const updates = { updated_at: new Date().toISOString() };
    if (is_visible !== undefined) updates.is_visible = is_visible;
    if (is_featured !== undefined) updates.is_featured = is_featured;

    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ review: data });
  } catch (err) {
    console.error("[admin] Failed to update review", err);
    res.status(500).json({ error: "Failed to update review." });
  }
});

// Admin: Revenue overview
app.get("/api/admin/revenue", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({
      summary: { total: 0, this_month: 0, avg_per_booking: 0 },
      monthly: [],
      transactions: []
    });
  }

  try {
    // Get all completed transactions
    const { data: transactions } = await supabase
      .from("client_transactions")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    const allTx = transactions || [];
    const total = allTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    // This month's revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const thisMonthTx = allTx.filter(t => t.created_at >= startOfMonth);
    const thisMonth = thisMonthTx.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Average per booking
    const avgPerBooking = allTx.length > 0 ? Math.round(total / allTx.length) : 0;

    // Monthly breakdown (last 6 months)
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date.toISOString();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthTx = allTx.filter(t => t.created_at >= monthStart && t.created_at <= monthEnd);
      const monthTotal = monthTx.reduce((sum, t) => sum + (t.amount || 0), 0);
      monthly.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: monthTotal
      });
    }

    res.status(200).json({
      summary: { total, this_month: thisMonth, avg_per_booking: avgPerBooking },
      monthly,
      transactions: allTx.slice(0, 50) // Latest 50 transactions
    });
  } catch (err) {
    console.error("[admin] Failed to load revenue", err);
    res.status(500).json({ error: "Failed to load revenue data." });
  }
});

// Admin: List all promotions
app.get("/api/admin/promotions", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ promotions: [] });
  }

  try {
    const { data: promotions, error } = await supabase
      .from("promotions")
      .select("*, providers(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      promotions: (promotions || []).map(p => ({
        ...p,
        provider_name: p.providers?.name || "Unknown"
      }))
    });
  } catch (err) {
    console.error("[admin] Failed to load promotions", err);
    res.status(500).json({ error: "Failed to load promotions." });
  }
});

// Admin: Recent activity feed
app.get("/api/admin/activity", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({ activity: [] });
  }

  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, client_name, provider_name, service_name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const activity = (bookings || []).map(b => ({
      id: b.id,
      type: "booking",
      title: `${b.client_name || "Client"} booked ${b.service_name || "a service"}`,
      subtitle: `with ${b.provider_name || "Provider"}`,
      status: b.status,
      timestamp: b.created_at
    }));

    res.status(200).json({ activity });
  } catch (err) {
    console.error("[admin] Failed to load activity", err);
    res.status(500).json({ error: "Failed to load activity." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ANALYTICS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
  if (!supabase) {
    return res.status(200).json({
      userGrowth: [],
      categoryPerformance: [],
      topProviders: [],
      bookingsByStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
      revenueByCategory: []
    });
  }

  const period = req.query.period || "month";
  let startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  try {
    // User growth - count users created per day/week
    const { data: providers } = await supabase
      .from("providers")
      .select("id, created_at")
      .gte("created_at", startDate.toISOString());

    const { data: clients } = await supabase
      .from("client_profiles")
      .select("id, created_at")
      .gte("created_at", startDate.toISOString());

    // Group by date for user growth chart
    const userGrowthMap = {};
    (providers || []).forEach(p => {
      const date = new Date(p.created_at).toISOString().split('T')[0];
      if (!userGrowthMap[date]) userGrowthMap[date] = { date, providers: 0, clients: 0 };
      userGrowthMap[date].providers++;
    });
    (clients || []).forEach(c => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      if (!userGrowthMap[date]) userGrowthMap[date] = { date, providers: 0, clients: 0 };
      userGrowthMap[date].clients++;
    });
    const userGrowth = Object.values(userGrowthMap).sort((a, b) => a.date.localeCompare(b.date));

    // Bookings by status
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id, status, price, service_name, scheduled_at")
      .gte("created_at", startDate.toISOString());

    const bookingsByStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    (allBookings || []).forEach(b => {
      const status = (b.status || "pending").toLowerCase();
      if (bookingsByStatus.hasOwnProperty(status)) {
        bookingsByStatus[status]++;
      }
    });

    // Category performance
    const { data: services } = await supabase
      .from("services")
      .select("id, name, category");

    const serviceMap = {};
    (services || []).forEach(s => {
      serviceMap[s.name] = s.category || "Uncategorized";
    });

    const categoryStats = {};
    (allBookings || []).forEach(b => {
      const category = serviceMap[b.service_name] || "Uncategorized";
      if (!categoryStats[category]) {
        categoryStats[category] = { category, bookings: 0, revenue: 0 };
      }
      categoryStats[category].bookings++;
      categoryStats[category].revenue += b.price || 0;
    });
    const categoryPerformance = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
    const revenueByCategory = categoryPerformance.map(c => ({ category: c.category, revenue: c.revenue }));

    // Top providers
    const { data: providerList } = await supabase
      .from("providers")
      .select("id, name, photo, rating, review_count")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(10);

    const { data: providerBookings } = await supabase
      .from("bookings")
      .select("provider_id, price")
      .gte("created_at", startDate.toISOString());

    const providerStatsMap = {};
    (providerBookings || []).forEach(b => {
      if (!b.provider_id) return;
      if (!providerStatsMap[b.provider_id]) {
        providerStatsMap[b.provider_id] = { bookings: 0, revenue: 0 };
      }
      providerStatsMap[b.provider_id].bookings++;
      providerStatsMap[b.provider_id].revenue += b.price || 0;
    });

    const topProviders = (providerList || []).map(p => ({
      id: p.id,
      name: p.name,
      photo: p.photo,
      rating: p.rating || 0,
      bookings: providerStatsMap[p.id]?.bookings || 0,
      revenue: providerStatsMap[p.id]?.revenue || 0
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    res.status(200).json({
      userGrowth,
      categoryPerformance,
      topProviders,
      bookingsByStatus,
      revenueByCategory
    });
  } catch (err) {
    console.error("[admin] Failed to load analytics", err);
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER ANALYTICS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.get("/api/provider/analytics", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!supabase) {
    return res.status(200).json({
      servicePerformance: [],
      clientInsights: { totalClients: 0, repeatClients: 0, repeatRate: 0, avgSatisfaction: 0 },
      peakTimes: [],
      bookingTrends: [],
      completionRate: { completed: 0, cancelled: 0, total: 0, rate: 0 }
    });
  }

  const period = req.query.period || "month";
  let startDate = new Date();

  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "quarter":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  try {
    // Get provider's bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, client_name, service_id, service_name, price, status, scheduled_at, created_at")
      .eq("provider_id", userId)
      .gte("created_at", startDate.toISOString());

    // Service performance
    const serviceStats = {};
    (bookings || []).forEach(b => {
      const key = b.service_name || "Unknown";
      if (!serviceStats[key]) {
        serviceStats[key] = { serviceId: b.service_id, name: key, bookings: 0, revenue: 0 };
      }
      serviceStats[key].bookings++;
      serviceStats[key].revenue += b.price || 0;
    });
    const servicePerformance = Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue);

    // Client insights
    const clientSet = new Set();
    const clientBookingCount = {};
    (bookings || []).forEach(b => {
      if (b.client_id) {
        clientSet.add(b.client_id);
        clientBookingCount[b.client_id] = (clientBookingCount[b.client_id] || 0) + 1;
      }
    });
    const totalClients = clientSet.size;
    const repeatClients = Object.values(clientBookingCount).filter(c => c > 1).length;
    const repeatRate = totalClients > 0 ? Math.round((repeatClients / totalClients) * 100) : 0;

    // Get average satisfaction from reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("provider_id", userId)
      .gte("created_at", startDate.toISOString());

    const avgSatisfaction = reviews && reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : 0;

    const clientInsights = { totalClients, repeatClients, repeatRate, avgSatisfaction };

    // Peak times (day of week + hour)
    const peakMap = {};
    (bookings || []).forEach(b => {
      if (!b.scheduled_at) return;
      const date = new Date(b.scheduled_at);
      const dayOfWeek = date.getDay(); // 0-6
      const hour = date.getHours(); // 0-23
      const key = `${dayOfWeek}-${hour}`;
      peakMap[key] = (peakMap[key] || 0) + 1;
    });
    const peakTimes = Object.entries(peakMap).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { dayOfWeek: day, hour, bookings: count };
    });

    // Booking trends (by date)
    const trendMap = {};
    (bookings || []).forEach(b => {
      const date = new Date(b.created_at).toISOString().split('T')[0];
      if (!trendMap[date]) trendMap[date] = { date, bookings: 0, revenue: 0 };
      trendMap[date].bookings++;
      trendMap[date].revenue += b.price || 0;
    });
    const bookingTrends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // Completion rate
    const completed = (bookings || []).filter(b => (b.status || "").toLowerCase() === "completed").length;
    const cancelled = (bookings || []).filter(b => (b.status || "").toLowerCase() === "cancelled").length;
    const total = (bookings || []).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const completionRate = { completed, cancelled, total, rate };

    res.status(200).json({
      servicePerformance,
      clientInsights,
      peakTimes,
      bookingTrends,
      completionRate
    });
  } catch (err) {
    console.error("[provider] Failed to load analytics", err);
    res.status(500).json({ error: "Failed to load analytics." });
  }
});

// ============================================
// DISPUTE ENDPOINTS
// ============================================

// Reason labels for display
const DISPUTE_REASON_LABELS = {
  service_not_provided: 'Service Not Provided',
  poor_quality: 'Poor Quality',
  no_show_provider: 'Provider No-Show',
  no_show_client: 'Client No-Show',
  wrong_service: 'Wrong Service',
  billing_issue: 'Billing Issue',
  other: 'Other',
};

// Create a dispute (client or provider)
app.post("/api/disputes", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const userId = getUserId(req);
  const { bookingId, reason, description, evidenceUrls } = req.body;

  if (!bookingId || !reason || !description) {
    return res.status(400).json({ error: "bookingId, reason, and description are required." });
  }

  try {
    // Verify booking exists and user is involved
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, client_id, provider_id, status, payment_intent_id, price")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    // Determine user's role in this booking
    let openedByRole = null;
    if (booking.client_id === userId) {
      openedByRole = 'client';
    } else if (booking.provider_id === userId) {
      openedByRole = 'provider';
    } else {
      return res.status(403).json({ error: "You are not part of this booking." });
    }

    // Check if dispute already exists for this booking
    const { data: existingDispute } = await supabase
      .from("disputes")
      .select("id, status")
      .eq("booking_id", bookingId)
      .in("status", ["open", "under_review"])
      .single();

    if (existingDispute) {
      return res.status(400).json({ error: "An open dispute already exists for this booking." });
    }

    // Create the dispute
    const { data: dispute, error: createError } = await supabase
      .from("disputes")
      .insert({
        booking_id: bookingId,
        opened_by: userId,
        opened_by_role: openedByRole,
        reason,
        description,
        evidence_urls: evidenceUrls || [],
        status: 'open'
      })
      .select()
      .single();

    if (createError) {
      console.error("[disputes] Failed to create dispute", createError);
      return res.status(500).json({ error: "Failed to create dispute." });
    }

    res.status(201).json(dispute);
  } catch (err) {
    console.error("[disputes] Error creating dispute", err);
    res.status(500).json({ error: "Failed to create dispute." });
  }
});

// Respond to a dispute (other party)
app.post("/api/disputes/:id/respond", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const userId = getUserId(req);
  const disputeId = req.params.id;
  const { description, evidenceUrls } = req.body;

  if (!description) {
    return res.status(400).json({ error: "description is required." });
  }

  try {
    // Get the dispute with booking info
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        bookings:booking_id (client_id, provider_id)
      `)
      .eq("id", disputeId)
      .single();

    if (disputeError || !dispute) {
      return res.status(404).json({ error: "Dispute not found." });
    }

    if (dispute.status !== 'open') {
      return res.status(400).json({ error: "Dispute is no longer open for responses." });
    }

    // Check if user is the other party
    const booking = dispute.bookings;
    const isOtherParty =
      (dispute.opened_by_role === 'client' && booking.provider_id === userId) ||
      (dispute.opened_by_role === 'provider' && booking.client_id === userId);

    if (!isOtherParty) {
      return res.status(403).json({ error: "Only the other party can respond to this dispute." });
    }

    // Update with response
    const { data: updated, error: updateError } = await supabase
      .from("disputes")
      .update({
        response_description: description,
        response_evidence_urls: evidenceUrls || [],
        responded_at: new Date().toISOString()
      })
      .eq("id", disputeId)
      .select()
      .single();

    if (updateError) {
      console.error("[disputes] Failed to update dispute", updateError);
      return res.status(500).json({ error: "Failed to respond to dispute." });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("[disputes] Error responding to dispute", err);
    res.status(500).json({ error: "Failed to respond to dispute." });
  }
});

// Get my disputes (client or provider)
app.get("/api/disputes", async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const userId = getUserId(req);

  try {
    // Get bookings where user is client or provider
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .or(`client_id.eq.${userId},provider_id.eq.${userId}`);

    if (bookingsError) {
      console.error("[disputes] Failed to fetch bookings", bookingsError);
      return res.status(500).json({ error: "Failed to fetch disputes." });
    }

    const bookingIds = (bookings || []).map(b => b.id);

    if (bookingIds.length === 0) {
      return res.status(200).json([]);
    }

    // Get disputes for these bookings
    const { data: disputes, error: disputesError } = await supabase
      .from("disputes")
      .select(`
        *,
        bookings:booking_id (
          id, scheduled_at, price, status,
          services:service_id (name),
          client:client_id (id, raw_user_meta_data),
          provider:provider_id (id, raw_user_meta_data)
        )
      `)
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (disputesError) {
      console.error("[disputes] Failed to fetch disputes", disputesError);
      return res.status(500).json({ error: "Failed to fetch disputes." });
    }

    res.status(200).json(disputes || []);
  } catch (err) {
    console.error("[disputes] Error fetching disputes", err);
    res.status(500).json({ error: "Failed to fetch disputes." });
  }
});

// Admin: List all disputes with filters
app.get("/api/admin/disputes", requireAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let query = supabase
      .from("disputes")
      .select(`
        *,
        bookings:booking_id (
          id, scheduled_at, price, status, payment_intent_id,
          services:service_id (name)
        )
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq("status", status);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: disputes, count, error } = await query;

    if (error) {
      console.error("[admin/disputes] Failed to fetch disputes", error);
      return res.status(500).json({ error: "Failed to fetch disputes." });
    }

    // Fetch user details for each dispute
    const userIds = new Set();
    (disputes || []).forEach(d => {
      if (d.opened_by) userIds.add(d.opened_by);
      if (d.resolved_by) userIds.add(d.resolved_by);
    });

    // Also get client and provider from bookings
    const bookingIds = [...new Set((disputes || []).map(d => d.booking_id))];

    let clientProviderMap = {};
    if (bookingIds.length > 0) {
      const { data: bookingUsers } = await supabase
        .from("bookings")
        .select("id, client_id, provider_id")
        .in("id", bookingIds);

      (bookingUsers || []).forEach(b => {
        clientProviderMap[b.id] = { clientId: b.client_id, providerId: b.provider_id };
        userIds.add(b.client_id);
        userIds.add(b.provider_id);
      });
    }

    let usersMap = {};
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, raw_user_meta_data")
        .in("id", [...userIds]);

      (users || []).forEach(u => {
        usersMap[u.id] = u.raw_user_meta_data || {};
      });
    }

    // Enrich disputes with user info
    const enrichedDisputes = (disputes || []).map(d => {
      const bp = clientProviderMap[d.booking_id] || {};
      return {
        ...d,
        opener_name: usersMap[d.opened_by]?.full_name || usersMap[d.opened_by]?.name || 'Unknown',
        client_name: usersMap[bp.clientId]?.full_name || usersMap[bp.clientId]?.name || 'Unknown',
        provider_name: usersMap[bp.providerId]?.full_name || usersMap[bp.providerId]?.name || 'Unknown',
        reason_label: DISPUTE_REASON_LABELS[d.reason] || d.reason
      };
    });

    res.status(200).json({
      data: enrichedDisputes,
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (err) {
    console.error("[admin/disputes] Error fetching disputes", err);
    res.status(500).json({ error: "Failed to fetch disputes." });
  }
});

// Admin: Get single dispute with full details
app.get("/api/admin/disputes/:id", requireAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const disputeId = req.params.id;

  try {
    const { data: dispute, error } = await supabase
      .from("disputes")
      .select(`
        *,
        bookings:booking_id (
          id, scheduled_at, price, status, payment_intent_id, payment_status,
          services:service_id (name, price),
          client_id, provider_id
        )
      `)
      .eq("id", disputeId)
      .single();

    if (error || !dispute) {
      return res.status(404).json({ error: "Dispute not found." });
    }

    // Get user details
    const userIds = [dispute.opened_by, dispute.bookings?.client_id, dispute.bookings?.provider_id].filter(Boolean);
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, raw_user_meta_data")
        .in("id", userIds);

      (users || []).forEach(u => {
        usersMap[u.id] = { ...u.raw_user_meta_data, email: u.email };
      });
    }

    const enriched = {
      ...dispute,
      opener: usersMap[dispute.opened_by] || {},
      client: usersMap[dispute.bookings?.client_id] || {},
      provider: usersMap[dispute.bookings?.provider_id] || {},
      reason_label: DISPUTE_REASON_LABELS[dispute.reason] || dispute.reason
    };

    res.status(200).json(enriched);
  } catch (err) {
    console.error("[admin/disputes] Error fetching dispute", err);
    res.status(500).json({ error: "Failed to fetch dispute." });
  }
});

// Admin: Resolve/update dispute
app.patch("/api/admin/disputes/:id", requireAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  const adminId = getUserId(req);
  const disputeId = req.params.id;
  const { status, resolution, resolution_amount, resolution_notes } = req.body;

  try {
    // Get dispute with booking info
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        bookings:booking_id (payment_intent_id, price)
      `)
      .eq("id", disputeId)
      .single();

    if (disputeError || !dispute) {
      return res.status(404).json({ error: "Dispute not found." });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resolution_notes !== undefined) updateData.resolution_notes = resolution_notes;

    // Handle resolution with potential refund
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolved_by = adminId;
      updateData.resolved_at = new Date().toISOString();
      updateData.status = 'resolved';

      // Process Stripe refund if needed
      if ((resolution === 'full_refund' || resolution === 'partial_refund') && dispute.bookings?.payment_intent_id) {
        try {
          const refundParams = {
            payment_intent: dispute.bookings.payment_intent_id,
            reason: 'requested_by_customer',
            metadata: { dispute_id: disputeId }
          };

          if (resolution === 'partial_refund' && resolution_amount) {
            refundParams.amount = resolution_amount;
            updateData.resolution_amount = resolution_amount;
          }

          const refund = await stripe.refunds.create(refundParams);
          updateData.refund_id = refund.id;
        } catch (stripeErr) {
          console.error("[admin/disputes] Stripe refund failed", stripeErr);
          return res.status(500).json({ error: `Refund failed: ${stripeErr.message}` });
        }
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("disputes")
      .update(updateData)
      .eq("id", disputeId)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/disputes] Failed to update dispute", updateError);
      return res.status(500).json({ error: "Failed to update dispute." });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("[admin/disputes] Error updating dispute", err);
    res.status(500).json({ error: "Failed to update dispute." });
  }
});

// Admin: Get dispute stats
app.get("/api/admin/disputes/stats", requireAdmin, async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database not configured" });

  try {
    const { data: disputes, error } = await supabase
      .from("disputes")
      .select("status, created_at, resolved_at");

    if (error) {
      console.error("[admin/disputes] Failed to fetch stats", error);
      return res.status(500).json({ error: "Failed to fetch stats." });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      open: 0,
      under_review: 0,
      resolved_this_week: 0,
      total_resolved: 0,
      avg_resolution_hours: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    (disputes || []).forEach(d => {
      if (d.status === 'open') stats.open++;
      if (d.status === 'under_review') stats.under_review++;
      if (d.status === 'resolved') {
        stats.total_resolved++;
        if (new Date(d.resolved_at) >= weekAgo) {
          stats.resolved_this_week++;
        }
        if (d.resolved_at && d.created_at) {
          const resolutionTime = new Date(d.resolved_at) - new Date(d.created_at);
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      }
    });

    if (resolvedCount > 0) {
      stats.avg_resolution_hours = Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60));
    }

    res.status(200).json(stats);
  } catch (err) {
    console.error("[admin/disputes] Error fetching stats", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER INVITES
// ─────────────────────────────────────────────────────────────────────────────

async function resolveInviteIdentifier(identifier) {
  const providerFields = "id, user_id, handle, name, business_name, category, city, photo, bio, avatar";

  const { data: invite, error: inviteError } = await supabase
    .from("provider_invites")
    .select("id, code, status, provider_id, expires_at, uses_count")
    .eq("code", identifier)
    .maybeSingle();

  if (inviteError) throw inviteError;

  if (invite) {
    if (invite.status === "expired") return { reason: "expired" };
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await supabase.from("provider_invites").update({ status: "expired" }).eq("id", invite.id);
      return { reason: "expired" };
    }

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select(providerFields)
      .eq("user_id", invite.provider_id)
      .maybeSingle();

    if (providerError) throw providerError;
    if (!provider) return { reason: "provider_not_found" };

    return { provider, invite, identifierType: "code" };
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select(providerFields)
    .eq("handle", identifier)
    .maybeSingle();

  if (providerError) throw providerError;
  if (!provider) return { reason: "not_found" };

  return { provider, invite: null, identifierType: "handle" };
}

// ─── POST /api/provider/invites — generate a new invite code ─────────────────
app.post("/api/provider/invites", async (req, res) => {
  const providerId = getProviderId(req);
  if (!supabase) {
    return res.status(201).json({ code: "demo-invite-code", url: `/join/demo-invite-code` });
  }
  try {
    // Generate a short random code: 8 url-safe chars
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const { data, error } = await supabase
      .from("provider_invites")
      .insert({ provider_id: providerId, code, status: "active" })
      .select("code")
      .single();
    if (error) throw error;
    res.status(201).json({ code: data.code, url: `/join/${data.code}` });
  } catch (err) {
    console.error("[provider/invites POST]", err);
    res.status(500).json({ error: "Failed to create invite." });
  }
});

// ─── GET /api/provider/invites/current — fetch an active invite code ──────────
app.get("/api/provider/invites/current", async (req, res) => {
  const providerId = getProviderId(req);
  if (!supabase) {
    return res.json({ code: "demo-invite-code", url: "/join/demo-invite-code" });
  }

  try {
    const now = new Date().toISOString();
    const { data: existingInvite, error } = await supabase
      .from("provider_invites")
      .select("code, status, expires_at, created_at")
      .eq("provider_id", providerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (existingInvite?.expires_at && new Date(existingInvite.expires_at) < new Date()) {
      await supabase
        .from("provider_invites")
        .update({ status: "expired" })
        .eq("provider_id", providerId)
        .eq("code", existingInvite.code);
    } else if (existingInvite?.code) {
      return res.json({ code: existingInvite.code, url: `/join/${existingInvite.code}` });
    }

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const { data: createdInvite, error: createError } = await supabase
      .from("provider_invites")
      .insert({
        provider_id: providerId,
        code,
        status: "active",
        created_at: now,
      })
      .select("code")
      .single();

    if (createError) throw createError;

    return res.json({ code: createdInvite.code, url: `/join/${createdInvite.code}` });
  } catch (err) {
    console.error("[provider/invites/current GET]", err);
    return res.status(500).json({ error: "Failed to fetch invite." });
  }
});

// ─── GET /api/provider/invites/join/:code — look up invite + provider info ───
app.get("/api/provider/invites/join/:code", async (req, res) => {
  const { code } = req.params;
  if (!supabase) {
    // Stub for local dev
    return res.json({
      valid: true,
      invite: { id: "stub-id", code, status: "active" },
      provider: {
        id: "stub-provider",
        name: "Demo Provider",
        business_name: "Demo Studio",
        category: "wellness",
        city: "Toronto",
        photo: null,
        bio: "Here to help.",
      },
    });
  }
  try {
    const resolved = await resolveInviteIdentifier(code);
    if (resolved.reason) return res.json({ valid: false, reason: resolved.reason });

    const invitePayload = resolved.invite
      ? { id: resolved.invite.id, code: resolved.invite.code, status: resolved.invite.status }
      : { id: null, code, status: "active" };

    res.json({ valid: true, invite: invitePayload, provider: resolved.provider });
  } catch (err) {
    console.error("[provider/invites/join GET]", err);
    res.status(500).json({ error: "Failed to look up invite." });
  }
});

// ─── POST /api/invites/:code/accept — accept invite (multi-use link) ──────────
app.post("/api/invites/:code/accept", async (req, res) => {
  const { code } = req.params;
  const clientId = getUserId(req);

  if (!supabase) return res.json({ connected: true, already_connected: false });
  try {
    const resolved = await resolveInviteIdentifier(code);
    if (resolved.reason === "not_found" || resolved.reason === "provider_not_found") {
      return res.status(404).json({ error: "invalid" });
    }
    if (resolved.reason === "expired") {
      return res.status(410).json({ error: "expired" });
    }

    const provider = resolved.provider;
    const invite = resolved.invite;
    const providerId = provider.user_id;

    // 2. Edge case: client trying to accept their own invite
    if (providerId === clientId) {
      return res.status(400).json({ error: "own_invite" });
    }

    const connectionResult = await ensureProviderClientConnection({
      providerId,
      clientId,
      inviteId: invite?.id || null,
      source: "invite",
    });

    if (!connectionResult.created) {
      return res.json({ already_connected: true, connected: false, provider: provider || null });
    }

    // 4. Ensure client_profiles row exists (new users won't have one yet)
    await supabase
      .from("client_profiles")
      .upsert({ user_id: clientId }, { onConflict: "user_id", ignoreDuplicates: true });

    // 5. Increment uses_count for legacy code-based invites only.
    if (invite?.id) {
      await supabase
        .from("provider_invites")
        .update({ uses_count: (invite.uses_count || 0) + 1 })
        .eq("id", invite.id);
    }

    // 6. Get client name for notification
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("name")
      .eq("user_id", clientId)
      .maybeSingle();
    const clientName = clientProfile?.name || "Someone";

    // 7. Notify provider
    await createProviderNotification(providerId, {
      type: "new_client",
      title: "New client connected",
      body: `${clientName} accepted your invite and joined your klique.`,
      data: { client_id: clientId },
    }).catch(() => {});

    res.json({ connected: true, already_connected: false, provider: provider || null });
  } catch (err) {
    console.error("[invites/accept POST]", err);
    res.status(500).json({ error: "Failed to accept invite." });
  }
});

// Keep legacy path working too
app.post("/api/provider/invites/join/:code/accept", async (req, res) => {
  req.params.code = req.params.code;
  // Forward to new handler by re-using same logic path
  const { code } = req.params;
  const clientId = getUserId(req);
  if (!supabase) return res.json({ ok: true });
  try {
    const resolved = await resolveInviteIdentifier(code);
    if (resolved.reason === "not_found" || resolved.reason === "provider_not_found") {
      return res.status(404).json({ error: "Invite not found." });
    }
    if (resolved.reason === "expired") return res.status(410).json({ error: "expired" });

    const providerId = resolved.provider.user_id;
    const invite = resolved.invite;

    await supabase.from("provider_clients").upsert(
      { provider_id: providerId, client_id: clientId, invite_id: invite?.id || null, connected_at: new Date().toISOString(), source: "invite" },
      { onConflict: "provider_id,client_id" }
    );
    if (invite?.id) {
      await supabase.from("provider_invites").update({ uses_count: (invite.uses_count || 0) + 1 }).eq("id", invite.id);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[provider/invites/join/accept legacy]", err);
    res.status(500).json({ error: "Failed." });
  }
});

// ─── POST /api/auth/signup — passwordless client signup for invite/booking flow
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: "name, email, and phone are required." });
  }
  if (!supabase) {
    const stubId = email.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return res.json({ ok: true, userId: stubId, email });
  }
  try {
    // 1. Create auth user + send magic link
    const { data: otpData, error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { name, phone, role: "client" },
      },
    });
    if (otpErr) throw otpErr;

    // 2. Upsert a row in client_profiles so name/phone are available immediately
    //    user_id from the OTP response may not exist yet — use email as lookup key
    //    and rely on the auth trigger or a second upsert when the session lands.
    //    We store what we can now, keyed by email, and finish in AuthCallback.
    // Store as a transient lookup via a separate upsert attempt using admin API
    // Use targeted getUserByEmail instead of listUsers() to avoid fetching all users
    try {
      const { data: userData } = await supabase.auth.admin.getUserByEmail(email.toLowerCase().trim());
      if (userData?.user?.id) {
        await supabase
          .from("client_profiles")
          .upsert(
            {
              user_id: userData.user.id,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      }
    } catch (profileErr) {
      // Non-fatal — profile will be created on first authenticated request
      console.warn("[auth/signup] Could not pre-create client_profile:", profileErr.message);
    }

    res.json({ ok: true, message: "Magic link sent to " + email });
  } catch (err) {
    console.error("[auth/signup]", err);
    res.status(500).json({ error: err.message || "Failed to create account." });
  }
});

// ─── GET /api/provider/onboarding/draft — load saved draft ──────────────────
app.get("/api/provider/onboarding/draft", async (req, res) => {
  if (!supabase) return res.json({ draft: null });
  const providerId = getProviderId(req);
  try {
    const { data, error } = await supabase
      .from("provider_onboarding_drafts")
      .select("step, data")
      .eq("provider_id", providerId)
      .maybeSingle();
    if (error) throw error;
    res.json({ draft: data ? { step: data.step, ...data.data } : null });
  } catch (err) {
    console.error("[onboarding/draft GET]", err);
    res.status(500).json({ error: "Failed to load draft." });
  }
});

// ─── PUT /api/provider/onboarding/draft — upsert draft ───────────────────────
app.put("/api/provider/onboarding/draft", async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  const providerId = getProviderId(req);
  const { step, ...rest } = req.body || {};
  try {
    const { error } = await supabase
      .from("provider_onboarding_drafts")
      .upsert(
        {
          provider_id: providerId,
          step: step || 1,
          data: rest,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider_id" }
      );
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[onboarding/draft PUT]", err);
    res.status(500).json({ error: "Failed to save draft." });
  }
});

// ─── DELETE /api/provider/onboarding/draft — clear draft on completion ───────
app.delete("/api/provider/onboarding/draft", async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  const providerId = getProviderId(req);
  try {
    await supabase
      .from("provider_onboarding_drafts")
      .delete()
      .eq("provider_id", providerId);
    res.json({ ok: true });
  } catch (err) {
    console.error("[onboarding/draft DELETE]", err);
    res.status(500).json({ error: "Failed to clear draft." });
  }
});

// ─── GET /api/provider/check-handle — check if a public handle is available ──
app.get("/api/provider/check-handle", async (req, res) => {
  const { handle } = req.query;
  if (!handle) return res.status(400).json({ error: "handle is required" });
  // Validate format: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9-]+$/.test(handle)) {
    return res.json({ available: false, reason: "invalid" });
  }
  if (!supabase) return res.json({ available: true }); // stub
  try {
    const { data } = await supabase
      .from("providers")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();
    res.json({ available: !data });
  } catch (err) {
    console.error("[check-handle]", err);
    res.status(500).json({ error: "Failed to check handle." });
  }
});

// ─── POST /api/provider/stripe/connect — create Stripe Connect account link ──
app.post("/api/provider/stripe/connect", async (req, res) => {
  const providerId = getProviderId(req);
  const { refreshUrl, returnUrl } = req.body || {};
  try {
    // Fetch provider email / business name
    let email = null;
    let businessName = null;
    if (supabase) {
      const { data } = await supabase
        .from("providers")
        .select("email, business_name, name, stripe_account_id")
        .eq("user_id", providerId)
        .maybeSingle();
      email = data?.email || null;
      businessName = data?.business_name || data?.name || null;
      // Reuse existing account if already created
      if (data?.stripe_account_id) {
        const link = await stripe.accountLinks.create({
          account: data.stripe_account_id,
          refresh_url: refreshUrl || `${req.headers.origin}/provider/onboarding?step=5`,
          return_url: returnUrl || `${req.headers.origin}/provider/onboarding?stripe=done`,
          type: "account_onboarding",
        });
        return res.json({ url: link.url, accountId: data.stripe_account_id });
      }
    }
    const account = await stripe.accounts.create({
      type: "express",
      ...(email ? { email } : {}),
      business_profile: businessName ? { name: businessName } : undefined,
    });
    // Save account ID to providers row
    if (supabase) {
      const fallbackName = businessName || email || "Provider";
      await supabase
        .from("providers")
        .upsert(
          {
            user_id: providerId,
            name: fallbackName,
            business_name: businessName || null,
            stripe_account_id: account.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    }
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl || `${req.headers.origin}/provider/onboarding?step=5`,
      return_url: returnUrl || `${req.headers.origin}/provider/onboarding?stripe=done`,
      type: "account_onboarding",
    });
    res.json({ url: link.url, accountId: account.id });
  } catch (err) {
    console.error("[stripe/connect]", err);
    res.status(500).json({ error: err.message || "Failed to create Stripe Connect link." });
  }
});

// ─── POST /api/provider/onboarding/complete — persist all onboarding data ────
app.post("/api/provider/onboarding/complete", async (req, res) => {
  const providerId = getProviderId(req);
  const {
    category,
    businessName,
    city,
    bio,
    handle,
    services,        // [{ name, duration, price, paymentType, depositType, depositValue }]
    availability,    // { monday: { enabled, from, to }, ... }
    bufferMinutes,
    bookingWindowWeeks,
    photoUrl,
  } = req.body || {};

  if (!supabase) return res.json({ ok: true });

  try {
    // Upsert provider row
    const updates = {
      user_id: providerId,
      is_profile_complete: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (category)            updates.category = category;
    if (businessName)        updates.business_name = businessName;
    if (city)                updates.city = city;
    if (bio)                 updates.bio = bio;
    if (handle)              updates.handle = handle;
    if (photoUrl)            updates.photo = photoUrl;
    if (availability)        updates.availability = availability;
    if (bufferMinutes != null)       updates.buffer_minutes = bufferMinutes;
    if (bookingWindowWeeks != null)  updates.booking_window_weeks = bookingWindowWeeks;

    const { error: provErr } = await supabase
      .from("providers")
      .upsert(updates, { onConflict: "user_id" });

    if (provErr) {
      console.error("[onboarding/complete] provider upsert error", provErr);
    }

    // Insert services (skip if already exist for this provider)
    if (Array.isArray(services) && services.length > 0) {
      const { data: existing } = await supabase
        .from("services")
        .select("id")
        .eq("provider_id", providerId)
        .limit(1);

      if (!existing || existing.length === 0) {
        const serviceRows = services.map((s) => ({
          id: crypto.randomUUID(),
          provider_id: providerId,
          name: s.name,
          duration: s.duration,
          base_price: Math.round((parseFloat(s.price) || 0) * 100), // dollars → cents
          payment_type: s.paymentType || "full",
          deposit_type: s.depositType || null,
          deposit_value: s.depositValue || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("services").insert(serviceRows);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[onboarding/complete]", err);
    res.status(500).json({ error: "Failed to complete onboarding." });
  }
});

// ============================================================================
// PUBLIC BOOKING FLOW ENDPOINTS
// ============================================================================

// GET /api/provider/public/:handle — public provider profile + services + groups + reviews
app.get("/api/provider/public/:handle", async (req, res) => {
  const { handle } = req.params;
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  try {
    const { data: provider, error } = await supabase
      .from("providers")
      .select("id, user_id, name, business_name, avatar, photo, category, categories, city, bio, rating, review_count, handle, booking_window_weeks, buffer_minutes")
      .eq("handle", handle)
      .maybeSingle();
    if (error) throw error;
    if (!provider) return res.status(404).json({ error: "Provider not found." });

    // Also grab booking_settings from provider_profiles
    const { data: profile } = await supabase
      .from("provider_profiles")
      .select("booking_settings")
      .eq("provider_id", provider.user_id)
      .maybeSingle();

    const [servicesRes, groupsRes, reviewsRes, clientCountRes] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, duration, base_price, unit, payment_type, deposit_type, deposit_value, description, group_id, metadata")
        .eq("provider_id", provider.user_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("service_groups")
        .select("id, name, description, sort_order")
        .eq("provider_id", provider.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("reviews")
        .select("id, client_name, client_avatar, rating, comment, created_at, service_name")
        .eq("provider_id", provider.user_id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("provider_clients")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", provider.user_id),
    ]);

    const bookingWindow = provider.booking_window_weeks
      || profile?.booking_settings?.booking_window
      || 8;
    const bufferMins = provider.buffer_minutes
      || profile?.booking_settings?.buffer_time
      || 0;
    const clientCount = clientCountRes.count || 0;

    res.json({
      provider: { ...provider, booking_window_weeks: bookingWindow, buffer_minutes: bufferMins, client_count: clientCount },
      services: servicesRes.data || [],
      groups: groupsRes.data || [],
      reviews: reviewsRes.data || [],
    });
  } catch (err) {
    console.error("[provider/public/:handle]", err);
    res.status(500).json({ error: "Failed to load provider." });
  }
});

// POST /api/auth/check-email — check whether an email has an account
// Rate limited strictly to prevent account enumeration abuse
app.post("/api/auth/check-email", sensitiveAuthLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email?.trim()) return res.status(400).json({ error: "email is required." });
  if (!supabase) return res.json({ exists: false });
  try {
    // Use a targeted query instead of listing all users
    const { data, error } = await supabase
      .from("client_profiles")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase().trim());
    if (error) throw error;
    // Return generic response — same shape but don't confirm/deny definitively
    // to reduce enumeration risk while still supporting the booking flow UX
    const exists = (data?.length ?? 0) > 0 || false;
    res.json({ exists });
  } catch (err) {
    console.error("[auth/check-email]", err);
    // Return false on error rather than leaking error details
    res.json({ exists: false });
  }
});

// POST /api/auth/magic-link — send magic login link to existing user
app.post("/api/auth/magic-link", async (req, res) => {
  const { email, redirectTo } = req.body || {};
  if (!email?.trim()) return res.status(400).json({ error: "email is required." });
  if (!supabase) return res.json({ ok: true });
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo || process.env.FRONTEND_URL + "/auth/callback",
      },
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth/magic-link]", err);
    res.status(500).json({ error: err.message || "Failed to send magic link." });
  }
});

// POST /api/auth/send-password-setup — send account setup email to new user
// Rate limited strictly — only called after a real booking is created
app.post("/api/auth/send-password-setup", sensitiveAuthLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email?.trim()) return res.status(400).json({ error: "email is required." });
  if (!supabase) return res.json({ ok: true });
  try {
    // Verify the email actually has a booking before sending setup email
    // This prevents using this endpoint to spam arbitrary email addresses
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("client_email", email.toLowerCase().trim());
    if (!count || count === 0) {
      // Return ok silently — don't confirm whether email exists or not
      return res.json({ ok: true });
    }
    const { error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth/send-password-setup]", err);
    // Non-fatal — don't fail the booking confirmation
    res.json({ ok: true });
  }
});

// GET /api/payments/methods — get saved cards for logged-in client
app.get("/api/payments/methods", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  if (!supabase) return res.json({ paymentMethods: [] });
  try {
    const customerId = await getClientStripeCustomerId(userId);
    if (!customerId) return res.json({ paymentMethods: [] });

    const { defaultPaymentMethodId, paymentMethods } = await listCustomerCardPaymentMethods(customerId);

    res.json({
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        isDefault: pm.id === defaultPaymentMethodId,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      })),
    });
  } catch (err) {
    console.error("[payments/methods]", err);
    res.status(500).json({ error: "Failed to load payment methods." });
  }
});

// POST /api/payments/setup-intent — create SetupIntent to save a card
app.post("/api/payments/setup-intent", async (req, res) => {
  const userId = getUserId(req);
  const { email, name } = req.body || {};
  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  try {
    // Find or create Stripe customer
    let customerId;
    // Check Supabase first for an existing customer ID
    if (supabase) {
      const { data: cp } = await supabase
        .from("client_profiles")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();
      customerId = cp?.stripe_customer_id;
    }
    // If not in DB, search Stripe by metadata
    if (!customerId) {
      const customers = await stripe.customers.list({ limit: 100 });
      const existing = customers.data.find((c) => c.metadata?.userId === userId);
      customerId = existing?.id;
    }
    // Still nothing — create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId, userType: "client" },
      });
      customerId = customer.id;
    }
    // Always ensure stripe_customer_id is persisted in Supabase
    if (supabase) {
      try {
        await supabase
          .from("client_profiles")
          .upsert(
            { user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
      } catch (_) {}
    }
    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });
    res.json({ clientSecret: intent.client_secret, customerId });
  } catch (err) {
    console.error("[payments/setup-intent]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/payment-intent — create PaymentIntent for deposit or full payment
// Body: { serviceId, providerId, amountCents, currency?, email, name }
app.post("/api/payments/payment-intent", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  const { serviceId, providerId, amountCents, email, name, isDeposit } = req.body || {};
  if (!amountCents || !providerId) {
    return res.status(400).json({ error: "amountCents and providerId are required." });
  }
  if (amountCents < 50) {
    return res.status(400).json({ error: "Amount must be at least $0.50." });
  }

  try {
    // Resolve provider's Stripe account
    const { data: providerRow } = await supabase
      .from("providers")
      .select("stripe_account_id")
      .eq("user_id", providerId)
      .maybeSingle();
    const stripeAccountId = providerRow?.stripe_account_id;

    // Find or create Stripe customer for client
    let customerId;
    if (supabase) {
      const { data: cp } = await supabase
        .from("client_profiles")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();
      customerId = cp?.stripe_customer_id;
    }
    if (!customerId) {
      const customers = await stripe.customers.list({ limit: 100 });
      const existing = customers.data.find((c) => c.metadata?.userId === userId);
      customerId = existing?.id;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId, userType: "client" },
      });
      customerId = customer.id;
    }
    if (supabase) {
      try {
        await supabase
          .from("client_profiles")
          .upsert(
            { user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
      } catch (_) {}
    }

    // Client pays service amount + platform fee on top.
    // Provider receives the full service amount. Platform keeps the fee and absorbs Stripe's cut.
    const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE);
    const totalCharge = amountCents + platformFee; // what client actually pays

    const intentParams = {
      amount: totalCharge,
      currency: PLATFORM_CURRENCY,
      customer: customerId,
      payment_method_types: ["card"],
      capture_method: "automatic",
      // For deposit payments, save the card for the remaining off-session charge later
      setup_future_usage: isDeposit ? "off_session" : undefined,
      metadata: { userId, serviceId: serviceId || "", providerId, serviceCents: amountCents },
    };

    // Route service amount to provider's Stripe account; platform keeps the fee
    if (stripeAccountId) {
      intentParams.transfer_data = { destination: stripeAccountId };
      intentParams.application_fee_amount = platformFee;
    }

    const intent = await stripe.paymentIntents.create(intentParams);
    res.json({ clientSecret: intent.client_secret, customerId, paymentIntentId: intent.id });
  } catch (err) {
    console.error("[payments/payment-intent]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/methods/:paymentMethodId/default — set default card
app.post("/api/payments/methods/:paymentMethodId/default", async (req, res) => {
  const userId = getUserId(req);
  const { paymentMethodId } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  if (!paymentMethodId) return res.status(400).json({ error: "paymentMethodId is required." });

  try {
    const customerId = await requireClientStripeCustomerId(userId);
    await assertPaymentMethodBelongsToCustomer(paymentMethodId, customerId);

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ success: true, defaultPaymentMethodId: paymentMethodId });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("[payments/default]", err);
    res.status(statusCode).json({ error: err.message || "Failed to update default payment method." });
  }
});

// DELETE /api/payments/methods/:paymentMethodId — remove saved card for logged-in client
app.delete("/api/payments/methods/:paymentMethodId", async (req, res) => {
  const userId = getUserId(req);
  const { paymentMethodId } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });
  if (!paymentMethodId) return res.status(400).json({ error: "paymentMethodId is required." });

  try {
    const customerId = await requireClientStripeCustomerId(userId);
    await assertPaymentMethodBelongsToCustomer(paymentMethodId, customerId);

    const { defaultPaymentMethodId, paymentMethods } = await listCustomerCardPaymentMethods(customerId);
    const remainingMethods = paymentMethods.filter((method) => method.id !== paymentMethodId);

    await stripe.paymentMethods.detach(paymentMethodId);

    if (defaultPaymentMethodId === paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: remainingMethods[0]?.id || null,
        },
      });
    }

    res.json({
      success: true,
      deletedPaymentMethodId: paymentMethodId,
      defaultPaymentMethodId:
        defaultPaymentMethodId === paymentMethodId ? (remainingMethods[0]?.id || null) : defaultPaymentMethodId,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("[payments/delete]", err);
    res.status(statusCode).json({ error: err.message || "Failed to remove payment method." });
  }
});

// POST /api/bookings/create — create booking and charge via PaymentIntent
app.post("/api/bookings/create", createChargedBookingHandler({
  getUserId,
  getProviderBookingRules: async (providerId) =>
    normalizeProviderBookingRules(
      supabase ? await getProviderBookingSettings(providerId) : {}
    ),
  getServiceDuration: async (serviceId) => {
    if (!supabase || !serviceId) return 60;
    const { data: serviceRow } = await supabase
      .from("services")
      .select("duration")
      .eq("id", serviceId)
      .maybeSingle();
    return parseInt(serviceRow?.duration, 10) || 60;
  },
  getServiceName: async (serviceId) => {
    if (!supabase || !serviceId) return null;
    const { data: serviceRow } = await supabase
      .from("services")
      .select("name")
      .eq("id", serviceId)
      .maybeSingle();
    return serviceRow?.name || null;
  },
  getProviderStripe: async (providerId) =>
    getProviderStripeConnectStatus(providerId, { requireReady: true }),
  hasConflict: hasProviderBookingConflict,
  createBookingRecord: async ({
    bookingId,
    userId,
    serviceId,
    serviceName,
    providerId,
    scheduledAt,
    serviceDuration,
    notes,
    price,
    autoAccept,
    platformCurrency,
  }) => {
    if (!supabase) return bookingId;
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        id: bookingId,
        client_id: userId,
        service_id: serviceId,
        service_name: serviceName || "Service",
        provider_id: providerId,
        scheduled_at: scheduledAt,
        duration: serviceDuration,
        notes: notes || "",
        status: autoAccept ? "confirmed" : "pending",
        price: price ?? null,
        currency: platformCurrency.toUpperCase(),
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  },
  getOrCreateCustomerId: async (userId) => {
    const customers = await stripe.customers.list({ limit: 100 });
    const existing = customers.data.find((c) => c.metadata?.userId === userId);
    if (existing) return existing.id;
    const customer = await stripe.customers.create({ metadata: { userId } });
    return customer.id;
  },
  createPaymentIntent: async ({
    amountCents,
    customerId,
    paymentMethodId,
    bookingId,
    providerId,
    userId,
    saveCard,
    providerStripe,
    platformCurrency,
  }) =>
    stripe.paymentIntents.create({
      amount: amountCents,
      currency: platformCurrency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: false,
      metadata: { bookingId, providerId, userId },
      ...(saveCard ? { setup_future_usage: "off_session" } : {}),
      ...(providerStripe
        ? buildConnectTransferParams(amountCents, providerStripe.accountId)
        : {}),
    }),
  afterBookingCreated: async ({
    bookingId,
    userId,
    serviceId,
    providerId,
    scheduledAt,
    autoAccept,
  }) => {
    if (supabase && userId) {
      await ensureProviderClientConnection({
        providerId,
        clientId: userId,
        source: "booking",
      }).catch((err) =>
        console.warn("[bookings/create] provider_clients upsert:", err.message)
      );
    }

    await createProviderNotification(providerId, {
      type: "new_booking",
      title: autoAccept ? "New booking confirmed" : "New booking request",
      body: autoAccept
        ? "A booking through your public link was automatically accepted."
        : "A client just booked through your public link.",
      data: { booking_id: bookingId },
      booking_id: bookingId,
    }).catch(() => {});

    const providerEmailInfo = await getProviderEmailInfo(providerId);
    const { name: bookingClientName, email: bookingClientEmail } = userId
      ? await getClientNotifPrefs(userId)
      : { name: "A client", email: null };
    const { data: bookingService } =
      serviceId && supabase
        ? await supabase
            .from("services")
            .select("name, metadata")
            .eq("id", serviceId)
            .maybeSingle()
        : { data: null };

    await sendProviderNewBookingEmail({
      to: providerEmailInfo.email,
      clientName: bookingClientName,
      serviceName: bookingService?.name || null,
      scheduledAt,
      autoAccepted: autoAccept,
    }).catch(() => {});

    if (autoAccept && userId) {
      await createClientNotification(userId, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your booking was automatically confirmed.",
        booking_id: bookingId,
        data: {
          provider_id: providerId,
          booking_id: bookingId,
          scheduled_at: scheduledAt,
          status: "confirmed",
        },
      }).catch(() => {});
      await sendClientPushNotification(userId, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your appointment has been confirmed in Kliques.",
        url: "/app/bookings",
        tag: `booking-confirmed-${bookingId}`,
      }).catch(() => {});
      await sendClientBookingConfirmedEmail({
        to: bookingClientEmail,
        providerName: providerEmailInfo.name,
        serviceName: bookingService?.name || null,
        scheduledAt,
        preAppointmentInfo: bookingService?.metadata?.preAppointmentInfo || null,
      }).catch(() => {});
    }
  },
  platformCurrency: PLATFORM_CURRENCY,
}));

// ─────────────────────────────────────────────────────────────────────────────
// BOOKING COMPLETION & DECLINE
// ─────────────────────────────────────────────────────────────────────────────

const BOOKING_PLATFORM_FEE_RATE = 0.10; // 10%

// Helper: generate invoice number for a provider in the current year
// Format: {INITIALS}-{YEAR}-{SEQUENCE 4-digits}  e.g. AW-2026-0047
async function generateInvoiceNumber(supabase, providerId, providerName) {
  const year = new Date().getFullYear();
  // Derive initials from business_name or name
  const parts = (providerName || "XX").trim().split(/\s+/);
  const inv = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0].slice(0, 2)).toUpperCase();

  // Count invoices for this provider in the current year to get next sequence
  const { count } = await supabase
    .from("provider_invoices")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gte("issued_at", `${year}-01-01T00:00:00.000Z`)
    .lt("issued_at", `${year + 1}-01-01T00:00:00.000Z`);

  const sequence = (count || 0) + 1;
  return `${inv}-${year}-${String(sequence).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME REQUEST BOOKING FLOW
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/bookings/request-time
// Client requests a specific date/time with a provider (no payment upfront)
app.post("/api/bookings/request-time", createRequestTimeBookingHandler({
  getUserId,
  getProviderBookingRules: async (providerId) =>
    normalizeProviderBookingRules(await getProviderBookingSettings(providerId)),
  getServiceInfo: async (serviceId) => {
    if (!serviceId) {
      return {
        serviceName: null,
        servicePrice: null,
        serviceDuration: 60,
        servicePreAppointmentInfo: null,
      };
    }
    const { data: svc } = await supabase
      .from("services")
      .select("name, base_price, duration, metadata")
      .eq("id", serviceId)
      .maybeSingle();
    return {
      serviceName: svc?.name || null,
      servicePrice: svc?.base_price || null,
      serviceDuration: parseInt(svc?.duration, 10) || 60,
      servicePreAppointmentInfo: svc?.metadata?.preAppointmentInfo || null,
    };
  },
  hasConflict: hasProviderBookingConflict,
  ensureProviderPaymentReady: async (providerId) =>
    getProviderStripeConnectStatus(providerId, { requireReady: true }),
  getProviderName: async (providerId) => {
    const { data: providerRow } = await supabase
      .from("providers")
      .select("name, business_name")
      .eq("user_id", providerId)
      .maybeSingle();
    return providerRow?.business_name || providerRow?.name || null;
  },
  getClientName: async (clientId) => {
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("name")
      .eq("user_id", clientId)
      .maybeSingle();
    return clientProfile?.name || "A client";
  },
  createBookingRecord: async ({
    clientId,
    clientName,
    providerId,
    providerName,
    serviceId,
    serviceName,
    scheduledAt,
    serviceDuration,
    autoAccept,
    paymentStatus,
    paymentType,
    stripeSetupIntentId,
    stripePaymentMethodId,
    depositPaidCents,
    servicePrice,
    message,
    requestedDate,
    requestedTime,
    stripePaymentIntentId,
  }) => {
    const { data: booking, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        client_id: clientId,
        client_name: clientName !== "A client" ? clientName : null,
        provider_id: providerId,
        provider_name: providerName,
        service_id: serviceId || null,
        service_name: serviceName || "Session",
        scheduled_at: scheduledAt,
        duration: serviceDuration,
        status: autoAccept ? "confirmed" : "pending",
        payment_status: paymentStatus,
        payment_type: paymentType || "none",
        stripe_setup_intent_id: stripeSetupIntentId || null,
        stripe_payment_method_id: stripePaymentMethodId || null,
        deposit_paid_cents: depositPaidCents || 0,
        price: servicePrice,
        metadata: {
          type: "time_request",
          client_message: message || null,
          requested_date: requestedDate,
          requested_time: requestedTime,
          stripe_payment_intent_id: stripePaymentIntentId || null,
        },
      })
      .select()
      .single();
    if (insertErr) throw insertErr;
    return booking;
  },
  afterBookingCreated: async ({
    booking,
    clientId,
    clientName,
    providerId,
    providerName,
    serviceName,
    scheduledAt,
    displayDate,
    displayTime,
    message,
    autoAccept,
    servicePreAppointmentInfo,
    now,
  }) => {
    await ensureProviderClientConnection({
      providerId,
      clientId,
      source: "booking",
      connectedAt: booking.created_at || now,
    }).catch((err) => {
      console.warn("[bookings/request-time] provider_clients upsert:", err.message);
    });

    const notifBody = serviceName
      ? `${clientName} requested ${serviceName} on ${displayDate} at ${displayTime}`
      : `${clientName} requested a session on ${displayDate} at ${displayTime}`;

    await createProviderNotification(providerId, {
      type: autoAccept ? "new_booking" : "booking_request",
      title: autoAccept ? "New booking confirmed" : "New booking request",
      body: notifBody,
      booking_id: booking.id,
      data: {
        booking_id: booking.id,
        client_id: clientId,
        scheduled_at: scheduledAt,
        service_name: serviceName,
        client_message: message || null,
      },
    }).catch(() => {});

    const providerEmailInfo = await getProviderEmailInfo(providerId);
    const { email: clientEmail } = await getClientNotifPrefs(clientId);
    await sendProviderNewBookingEmail({
      to: providerEmailInfo.email,
      clientName,
      serviceName,
      scheduledAt,
      autoAccepted: autoAccept,
    }).catch(() => {});

    if (autoAccept) {
      await createClientNotification(clientId, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your booking was automatically confirmed.",
        booking_id: booking.id,
        data: {
          provider_id: providerId,
          booking_id: booking.id,
          scheduled_at: scheduledAt,
          status: "confirmed",
        },
      }).catch(() => {});
      await sendClientPushNotification(clientId, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your appointment has been confirmed in Kliques.",
        url: "/app/bookings",
        tag: `booking-confirmed-${booking.id}`,
      }).catch(() => {});
      await sendClientBookingConfirmedEmail({
        to: clientEmail,
        providerName: providerEmailInfo.name || providerName,
        serviceName,
        scheduledAt,
        preAppointmentInfo: servicePreAppointmentInfo,
      }).catch(() => {});
    }
  },
}));

// POST /api/bookings/:id/accept
// Provider accepts a pending booking — client is notified to proceed to payment
app.post("/api/bookings/:id/accept", createAcceptBookingHandler({
  getBookingId: (req) => req.params.id,
  getUserId,
  fetchBooking: async (bookingId) => {
    if (!supabase) return null;
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, status, provider_id, provider_name, client_id, service_id, service_name, scheduled_at, price, metadata")
      .eq("id", bookingId)
      .single();
    if (fetchErr) return null;
    return booking || null;
  },
  updateAcceptedBooking: async ({ bookingId, updatedAt }) => {
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "confirmed", updated_at: updatedAt })
      .eq("id", bookingId)
      .select("*")
      .single();
    if (updateErr) throw updateErr;
    return updatedBooking;
  },
  afterAccept: async ({ booking, requestingUserId }) => {
    const bookingId = booking.id;
    const displayDate = new Date(booking.scheduled_at).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const sessionLabel = booking.service_name || "your service";
    const providerLabel = booking.provider_name || "Your provider";

    if (booking.client_id) {
      await createClientNotification(booking.client_id, {
        type: "accepted",
        title: "Booking accepted",
        body: `${providerLabel} confirmed your booking for ${sessionLabel} on ${displayDate}`,
        booking_id: bookingId,
        data: {
          provider_id: requestingUserId,
          booking_id: bookingId,
          scheduled_at: booking.scheduled_at,
          status: "confirmed",
        },
      }).catch(() => {});
      await sendClientPushNotification(booking.client_id, {
        type: "accepted",
        title: "Booking confirmed",
        body: "Your appointment has been confirmed in Kliques.",
        url: "/app/bookings",
        tag: `booking-confirmed-${bookingId}`,
      }).catch(() => {});

      const { email: clientEmail } = await getClientNotifPrefs(booking.client_id);
      const providerInfo = await getProviderEmailInfo(requestingUserId);
      let acceptSvcMeta = null;
      if (booking.service_id) {
        const { data: svcMeta } = await supabase
          .from("services")
          .select("metadata")
          .eq("id", booking.service_id)
          .maybeSingle();
        acceptSvcMeta = svcMeta?.metadata || null;
      }
      if (clientEmail) {
        await sendClientBookingConfirmedEmail({
          to: clientEmail,
          providerName: providerInfo.name || providerLabel,
          serviceName: sessionLabel,
          scheduledAt: booking.scheduled_at,
          preAppointmentInfo: acceptSvcMeta?.preAppointmentInfo || null,
        }).catch(() => {});
      }
    }
  },
}));

// POST /api/bookings/:id/complete
app.post("/api/bookings/:id/complete", createCompleteBookingHandler({
  getBookingId: (req) => req.params.id,
  getUserId,
  fetchBooking: async (bookingId) => {
    if (!supabase) return null;
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (bookingErr) return null;
    return booking || null;
  },
  getServiceInfo: async (serviceId) => {
    if (!serviceId) return null;
    const { data: serviceData } = await supabase
      .from("services")
      .select("name, description, duration")
      .eq("id", serviceId)
      .maybeSingle();
    return serviceData || null;
  },
  markPaymentFailed: async ({ bookingId, now }) => {
    await supabase
      .from("bookings")
      .update({ payment_status: "payment_failed", updated_at: now })
      .eq("id", bookingId);
  },
  notifyProviderChargeResult: async ({ booking, ...rest }) =>
    notifyProviderCompletionChargeResult(booking, rest),
  notifyClientPaymentFailed: async ({ booking, bookingId, stripeErr }) => {
    if (!booking.client_id) return;
    const notifServiceName = booking.service_name || "your service";
    const providerInfo = await getProviderEmailInfo(booking.provider_id).catch(
      () => ({})
    );
    const provName = providerInfo?.name || booking.provider_name || "Your provider";

    await createClientNotification(booking.client_id, {
      type: "payment_failed",
      title: "Payment unsuccessful",
      body: `Your payment for ${notifServiceName} with ${provName} couldn't be processed. Please update your payment method to complete your booking.`,
      booking_id: bookingId,
      data: { booking_id: bookingId, provider_id: booking.provider_id },
    }).catch(() => {});

    const { email: clientEmail, name: clientName } = await getClientNotifPrefs(
      booking.client_id
    ).catch(() => ({}));
    if (clientEmail) {
      sendEmail({
        to: clientEmail,
        subject: `Action required — payment failed for ${notifServiceName}`,
        html: `
          <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;color:#3D231E">
            <div style="background:#FDEDEA;padding:28px 24px;border-radius:16px 16px 0 0;text-align:center">
              <div style="width:56px;height:56px;background:#B04040;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                <span style="color:white;font-size:24px">✕</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#8F2E2E">Payment unsuccessful</h1>
            </div>
            <div style="background:#FBF7F2;padding:24px;border-radius:0 0 16px 16px">
              <p style="margin:0 0 12px">Hi ${clientName || "there"},</p>
              <p style="margin:0 0 20px;color:#8C6A64">Your payment for <strong>${notifServiceName}</strong> with <strong>${provName}</strong> couldn't be processed. Your provider has marked the session as complete but the charge was unsuccessful.</p>
              <div style="background:#FDEDEA;border-radius:12px;padding:16px;margin-bottom:20px;border-left:3px solid #B04040">
                <p style="margin:0;font-size:13px;color:#8F2E2E;font-weight:600">Reason: ${stripeErr.message || "Card declined"}</p>
              </div>
              <p style="margin:0 0 20px;color:#8C6A64">Please open your booking in the Kliques app to retry payment with the same card or a new one.</p>
              <div style="text-align:center;margin-bottom:24px">
                <a href="https://mykliques.com/app/bookings/${bookingId}" style="display:inline-block;background:#3D231E;color:#fff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:15px">Retry payment →</a>
              </div>
              <p style="margin:0;font-size:12px;color:#B0948F;text-align:center">Kliques · mykliques.com</p>
            </div>
          </div>`,
      }).catch(() => {});
    }
  },
  getProviderStripeAccountId: async (providerId) => {
    const { data: provRow } = await supabase
      .from("providers")
      .select("stripe_account_id")
      .eq("user_id", providerId)
      .maybeSingle();
    return provRow?.stripe_account_id || null;
  },
  getClientStripeCustomerId: async (clientId) => {
    const { data: cp } = await supabase
      .from("client_profiles")
      .select("stripe_customer_id")
      .eq("user_id", clientId)
      .maybeSingle();
    return cp?.stripe_customer_id || null;
  },
  chargeCompletion: async ({
    booking,
    serviceChargeCents,
    totalRemainingCharge,
    stripeAccountId,
    customerId,
  }) => {
    const piParams = {
      amount: totalRemainingCharge,
      currency: PLATFORM_CURRENCY,
      customer: customerId || undefined,
      payment_method: booking.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      metadata: {
        booking_id: booking.id,
        type:
          booking.payment_type === "save_card"
            ? "save_card_completion_charge"
            : "deposit_remaining",
        serviceCents: serviceChargeCents,
      },
    };
    if (stripeAccountId) {
      piParams.transfer_data = { destination: stripeAccountId };
      piParams.application_fee_amount = Math.round(
        serviceChargeCents * BOOKING_PLATFORM_FEE_RATE
      );
    }
    return stripe.paymentIntents.create(piParams);
  },
  markCompleted: async ({ bookingId, now, paymentStatusAfterCompletion }) => {
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        completed_at: now,
        payment_status: paymentStatusAfterCompletion,
        updated_at: now,
      })
      .eq("id", bookingId);
    if (updateErr) throw updateErr;
  },
  createEarningsRecord: async ({
    booking,
    bookingId,
    now,
    grossAmountCents,
    platformFeeCents,
    netAmountCents,
  }) => {
    const { error: earningsErr } = await supabase.from("provider_earnings").insert({
      provider_id: booking.provider_id,
      booking_id: bookingId,
      gross_amount: grossAmountCents,
      platform_fee: platformFeeCents,
      net_amount: netAmountCents,
      payout_status: "pending",
      created_at: now,
    });
    if (earningsErr)
      console.warn("[bookings/complete] provider_earnings insert:", earningsErr.message);
  },
  createInvoice: async ({
    booking,
    bookingId,
    now,
    serviceInfo,
    totalCents,
    remainingCents,
    depositPaidCents,
  }) => {
    let invoiceNumber = null;
    let invoiceId = null;
    const serviceName = serviceInfo?.name || booking.service_name || "Service";
    const serviceDesc =
      serviceInfo?.description || booking.service_description || null;
    const durationMins =
      serviceInfo?.duration || booking.duration_minutes || booking.duration || null;
    const { name: fallbackProviderName } = await getProviderEmailInfo(
      booking.provider_id
    ).catch(() => ({}));
    let providerDisplayName =
      fallbackProviderName || booking.provider_name || "Provider";

    try {
      const { data: providerProfile } = await supabase
        .from("provider_profiles")
        .select("business_name, name, address, email, phone, bio")
        .eq("provider_id", booking.provider_id)
        .maybeSingle();

      providerDisplayName =
        providerProfile?.business_name || providerProfile?.name || providerDisplayName;
      invoiceNumber = await generateInvoiceNumber(
        supabase,
        booking.provider_id,
        providerDisplayName
      );

      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("name, email, phone")
        .eq("user_id", booking.client_id)
        .maybeSingle();

      const { data: invoice, error: invoiceErr } = await supabase
        .from("provider_invoices")
        .insert({
          provider_id: booking.provider_id,
          client_id: booking.client_id,
          booking_id: bookingId,
          invoice_number: invoiceNumber,
          business_name: providerDisplayName,
          business_address: providerProfile?.address || null,
          business_email: providerProfile?.email || null,
          business_phone: providerProfile?.phone || null,
          client_name: clientProfile?.name || booking.client_name || null,
          client_email: clientProfile?.email || booking.client_email || null,
          client_phone: clientProfile?.phone || booking.client_phone || null,
          address: booking.address || null,
          service: serviceName,
          description: serviceDesc,
          service_name: serviceName,
          service_description: serviceDesc,
          date_of_service: booking.scheduled_at || booking.created_at,
          duration: durationMins ? `${durationMins} min` : null,
          total_amount: totalCents,
          final_amount: remainingCents,
          subtotal: totalCents,
          deposit_amount: depositPaidCents,
          remaining_amount: remainingCents,
          total: totalCents,
          status: "paid",
          issued_at: now,
          paid_at: now,
        })
        .select()
        .single();

      if (!invoiceErr) {
        invoiceId = invoice?.id || null;
      } else {
        console.warn("[bookings/complete] invoice insert error:", invoiceErr.message);
      }
    } catch (postCompleteErr) {
      console.warn(
        "[bookings/complete] post-completion follow-up failed:",
        postCompleteErr.message
      );
    }

    return { invoiceNumber, invoiceId };
  },
  notifyClientCompletion: async ({
    booking,
    bookingId,
    serviceInfo,
    invoiceNumber,
    invoiceId,
    totalCents,
  }) => {
    if (!booking.client_id) return;
    const serviceName = serviceInfo?.name || booking.service_name || "Service";
    const { name: fallbackProviderName } = await getProviderEmailInfo(
      booking.provider_id
    ).catch(() => ({}));
    const providerDisplayName =
      fallbackProviderName || booking.provider_name || "Provider";

    try {
      const hasNote = !!(booking.session_notes || "").trim();
      const hasRec = !!(booking.session_recommendation || "").trim();
      const { count: photoCount } = await supabase
        .from("booking_photos")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId);
      const hasPhotos = (photoCount || 0) > 0;

      const leftItems = [
        hasNote && "a session note",
        hasRec && "a recommendation",
        hasPhotos && "photos",
      ].filter(Boolean);

      let completionBody = `Your ${serviceName} with ${providerDisplayName} is complete.`;
      if (leftItems.length > 0) {
        const joined =
          leftItems.length === 1
            ? leftItems[0]
            : leftItems.slice(0, -1).join(", ") +
              " and " +
              leftItems[leftItems.length - 1];
        completionBody += ` ${providerDisplayName} left ${joined} for you.`;
      }
      completionBody += invoiceNumber
        ? " Your invoice is now available in the Invoices page."
        : " Open the booking to view session details.";

      await createClientNotification(booking.client_id, {
        type: "session_complete",
        title: "Session complete",
        body: completionBody,
        booking_id: bookingId,
        data: {
          provider_id: booking.provider_id,
          provider_name: providerDisplayName,
          service_name: serviceName,
          booking_date: booking.scheduled_at,
          show_review_prompt: true,
          has_session_note: hasNote,
          has_recommendation: hasRec,
          has_photos: hasPhotos,
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
        },
      });
    } catch (notifErr) {
      console.warn("[bookings/complete] client notification failed:", notifErr.message);
    }

    try {
      const { prefs, email: clientEmail, name: clientName } =
        await getClientNotifPrefs(booking.client_id);
      if (prefs?.email_invoices !== false && clientEmail && invoiceNumber) {
        const totalStr = `$${(totalCents / 100).toFixed(2)}`;
        const depositPaidCents = booking.deposit_paid_cents || 0;
        const depositStr =
          depositPaidCents > 0
            ? `$${(depositPaidCents / 100).toFixed(2)}`
            : null;

        let attachments;
        if (invoiceId) {
          try {
            const { data: invoiceRow } = await supabase
              .from("provider_invoices")
              .select("*")
              .eq("id", invoiceId)
              .single();
            if (invoiceRow) {
              const pdfBuffer = await generateInvoicePdfBuffer(invoiceRow);
              attachments = [
                {
                  filename: `invoice-${invoiceNumber}.pdf`,
                  content: pdfBuffer.toString("base64"),
                },
              ];
            }
          } catch (pdfErr) {
            console.warn(
              "[bookings/complete] PDF attachment generation failed:",
              pdfErr.message
            );
          }
        }

        await sendEmail({
          to: clientEmail,
          subject: `Invoice #${invoiceNumber} — ${serviceName}`,
          attachments,
          html: `
            <div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;color:#3D231E">
              <div style="background:#FDDCC6;padding:32px 24px;border-radius:16px 16px 0 0;text-align:center">
                <h1 style="margin:0;font-size:22px;font-weight:700">Invoice #${invoiceNumber}</h1>
              </div>
              <div style="background:#FBF7F2;padding:24px;border-radius:0 0 16px 16px">
                <p style="margin:0 0 8px">Hi ${clientName || "there"},</p>
                <p style="margin:0 0 20px;color:#8C6A64">Here is your invoice from ${providerDisplayName}. Your invoice PDF is attached.</p>
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);color:#8C6A64;font-size:14px">Service</td><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);text-align:right;font-weight:600">${serviceName}</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);color:#8C6A64;font-size:14px">Provider</td><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);text-align:right;font-weight:600">${providerDisplayName}</td></tr>
                  ${depositStr ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);color:#8C6A64;font-size:14px">Deposit paid</td><td style="padding:10px 0;border-bottom:1px solid rgba(140,106,100,0.2);text-align:right">${depositStr}</td></tr>` : ""}
                  <tr><td style="padding:10px 0;color:#8C6A64;font-size:14px;font-weight:700">Total</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px">${totalStr}</td></tr>
                </table>
                <p style="margin:24px 0 0;font-size:12px;color:#B0948F;text-align:center">Kliques · mykliques.com</p>
              </div>
            </div>`,
        });
      }
    } catch (emailErr) {
      console.warn("[bookings/complete] client invoice email failed:", emailErr.message);
    }
  },
  getNowIso: () => new Date().toISOString(),
  platformFeeRate: BOOKING_PLATFORM_FEE_RATE,
}));

// POST /api/bookings/:id/charge-card
// Provider charges the saved card for a save_card booking
app.post("/api/bookings/:id/charge-card", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const bookingId = req.params.id;
  const requestingUserId = getUserId(req);
  if (!requestingUserId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.provider_id !== requestingUserId) return res.status(403).json({ error: "Not authorized." });
    if (booking.payment_type !== "save_card") return res.status(400).json({ error: "Booking is not a save_card booking." });
    if (booking.payment_status === "paid") return res.status(409).json({ error: "Card already charged." });
    if (!booking.stripe_payment_method_id) return res.status(400).json({ error: "No saved payment method on this booking." });

    // booking.price is always in cents (base_price from services table)
    const totalCents = Math.round(Number(booking.price) || 0);
    if (totalCents < 50) return res.status(400).json({ error: "Amount too small to charge." });

    // Fetch provider Stripe account
    const { data: provRow } = await supabase
      .from("providers")
      .select("stripe_account_id")
      .eq("user_id", booking.provider_id)
      .maybeSingle();
    const stripeAccountId = provRow?.stripe_account_id;

    // Get Stripe customer
    const { data: cp } = await supabase
      .from("client_profiles")
      .select("stripe_customer_id")
      .eq("user_id", booking.client_id)
      .maybeSingle();
    const customerId = cp?.stripe_customer_id;

    // Client pays service amount + platform fee on top; provider receives full service amount
    const platformFee = Math.round(totalCents * PLATFORM_FEE_RATE);
    const totalCharge = totalCents + platformFee;

    const piParams = {
      amount: totalCharge,
      currency: PLATFORM_CURRENCY,
      customer: customerId || undefined,
      payment_method: booking.stripe_payment_method_id,
      confirm: true,
      off_session: true,
      metadata: { booking_id: bookingId, type: "save_card_charge", serviceCents: totalCents },
    };
    if (stripeAccountId) {
      piParams.transfer_data = { destination: stripeAccountId };
      piParams.application_fee_amount = platformFee;
    }

    const pi = await stripe.paymentIntents.create(piParams);

    // Update booking payment_status
    const now = new Date().toISOString();
    await supabase
      .from("bookings")
      .update({ payment_status: "paid", updated_at: now })
      .eq("id", bookingId);

    return res.json({
      ok: true,
      paymentIntentId: pi.id,
      amountCharged: totalCents,
    });
  } catch (err) {
    console.error("[bookings/charge-card]", err);
    // Surface Stripe card errors clearly
    if (err.type === "StripeCardError") {
      return res.status(402).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Failed to charge card." });
  }
});

// POST /api/bookings/:id/retry-payment
// Client retries a failed charge — creates a PaymentIntent the client confirms via Stripe.js
// Supports swapping in a new payment method id (passed in body as payment_method_id)
app.post("/api/bookings/:id/retry-payment", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });
  const bookingId = req.params.id;
  const requestingUserId = getUserId(req);
  const { payment_method_id } = req.body || {};

  try {
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings").select("*").eq("id", bookingId).single();

    if (bookingErr || !booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.client_id !== requestingUserId) return res.status(403).json({ error: "Not authorized." });
    if (booking.payment_status === "paid") return res.status(409).json({ error: "Already paid." });

    const totalCents = Math.round(Number(booking.price) || 0);
    const depositPaidCents = booking.deposit_paid_cents || 0;
    const amountCents = booking.payment_type === "deposit"
      ? Math.max(totalCents - depositPaidCents, 0)
      : totalCents;

    if (amountCents < 50) return res.status(400).json({ error: "Amount too small." });

    const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE);
    const totalCharge = amountCents + platformFee;

    // Fetch provider Stripe account
    const { data: provRow } = await supabase
      .from("providers").select("stripe_account_id").eq("user_id", booking.provider_id).maybeSingle();
    const stripeAccountId = provRow?.stripe_account_id;

    // Resolve customer
    const { data: cp } = await supabase
      .from("client_profiles").select("stripe_customer_id, email").eq("user_id", requestingUserId).maybeSingle();
    const customerId = cp?.stripe_customer_id;

    // Use the new pm if provided, otherwise fall back to saved one
    const pmId = payment_method_id || booking.stripe_payment_method_id;

    const piParams = {
      amount: totalCharge,
      currency: PLATFORM_CURRENCY,
      customer: customerId || undefined,
      ...(pmId ? { payment_method: pmId } : {}),
      metadata: { booking_id: bookingId, type: "retry_payment" },
    };
    if (stripeAccountId) {
      piParams.transfer_data = { destination: stripeAccountId };
      piParams.application_fee_amount = platformFee;
    }

    // If we have a pm, try off-session first; otherwise create intent for client confirmation
    if (pmId) {
      piParams.confirm = true;
      piParams.off_session = true;
      try {
        await stripe.paymentIntents.create(piParams);
        const now = new Date().toISOString();
        // Save new pm if it's different
        const updates = { payment_status: "paid", updated_at: now };
        if (payment_method_id && payment_method_id !== booking.stripe_payment_method_id) {
          updates.stripe_payment_method_id = payment_method_id;
        }
        await supabase.from("bookings").update(updates).eq("id", bookingId);

        // Notify client that payment succeeded
        await createClientNotification(requestingUserId, {
          type: "payment_success",
          title: "Payment successful",
          body: `Your payment for ${booking.service_name || 'your booking'} was processed successfully.`,
          booking_id: bookingId,
          data: { booking_id: bookingId },
        }).catch(() => {});

        return res.json({ ok: true, status: "paid" });
      } catch (stripeErr) {
        if (stripeErr.code === "authentication_required" || stripeErr.raw?.payment_intent) {
          // Card requires 3DS — return client_secret for frontend confirmation
          const pi = await stripe.paymentIntents.create({ ...piParams, confirm: false, off_session: false });
          return res.json({ requires_action: true, client_secret: pi.client_secret });
        }
        return res.status(402).json({ error: stripeErr.message || "Payment failed." });
      }
    }

    // No saved pm — create intent for client to confirm with new card in-browser
    const pi = await stripe.paymentIntents.create(piParams);
    return res.json({ requires_action: true, client_secret: pi.client_secret });
  } catch (err) {
    console.error("[bookings/retry-payment]", err);
    return res.status(500).json({ error: err.message || "Failed to process payment." });
  }
});

// POST /api/bookings/:id/decline
app.post("/api/bookings/:id/decline", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const bookingId = req.params.id;
  const requestingUserId = getUserId(req);
  const { reason } = req.body || {};

  try {
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, status, provider_id, provider_name, client_id, service_name, scheduled_at, metadata")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.provider_id !== requestingUserId) {
      return res.status(403).json({ error: "Not authorized to decline this booking." });
    }
    if (booking.status === "cancelled") return res.status(409).json({ error: "Already declined." });

    const existingMeta = booking.metadata || {};
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
        metadata: { ...existingMeta, decline_reason: reason || null },
      })
      .eq("id", bookingId)
      .select("*")
      .single();

    if (updateErr) throw updateErr;

    if (booking.client_id) {
      const providerLabel = booking.provider_name || "Your provider";
      const sessionLabel = booking.service_name || "your session";
      const body = reason
        ? `${providerLabel} declined your booking request. Reason: ${reason}`
        : `${providerLabel} declined your booking request`;
      await createClientNotification(booking.client_id, {
        type: "rejected",
        title: "Booking declined",
        body,
        booking_id: bookingId,
        data: {
          provider_id: requestingUserId,
          booking_id: bookingId,
          scheduled_at: booking.scheduled_at,
          service_name: sessionLabel,
          status: "cancelled",
          reason: reason || null,
          decline_reason: reason || null,
        },
      }).catch(() => {});
    }

    return res.status(200).json({ booking: updatedBooking });
  } catch (err) {
    console.error("[bookings/:id/decline]", err);
    return res.status(500).json({ error: "Failed to decline booking." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/invoices/:id — fetch single invoice
app.get("/api/invoices/:id", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { id } = req.params;
  const userId = getUserId(req);

  try {
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) return res.status(404).json({ error: "Invoice not found." });

    // Auth check: must be the provider or the client on this invoice
    if (invoice.provider_id !== userId && invoice.client_id !== userId) {
      // Try matching by client_email if client_id not stored
      return res.status(403).json({ error: "Not authorized." });
    }

    return res.status(200).json({ invoice });
  } catch (err) {
    console.error("[invoices/:id]", err);
    return res.status(500).json({ error: "Failed to fetch invoice." });
  }
});

// GET /api/providers/:id/invoices — list invoices for a provider (paginated)
app.get("/api/providers/:id/invoices", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { id } = req.params;
  const requestingUserId = getUserId(req);
  const page = parseInt(req.query.page || "1", 10);
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const offset = (page - 1) * limit;

  if (id !== requestingUserId) return res.status(403).json({ error: "Not authorized." });

  try {
    const { data, error, count } = await supabase
      .from("provider_invoices")
      .select("*", { count: "exact" })
      .eq("provider_id", id)
      .order("issued_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return res.status(200).json({ invoices: data, total: count, page, limit });
  } catch (err) {
    console.error("[providers/:id/invoices]", err);
    return res.status(500).json({ error: "Failed to fetch invoices." });
  }
});

// GET /api/clients/:id/invoices — list invoices for a client (paginated)
app.get("/api/clients/:id/invoices", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { id } = req.params;
  const requestingUserId = getUserId(req);
  const page = parseInt(req.query.page || "1", 10);
  const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
  const offset = (page - 1) * limit;

  if (id !== requestingUserId) return res.status(403).json({ error: "Not authorized." });

  try {
    const { data, error, count } = await supabase
      .from("provider_invoices")
      .select("*", { count: "exact" })
      .eq("client_id", id)
      .order("issued_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return res.status(200).json({ invoices: data, total: count, page, limit });
  } catch (err) {
    console.error("[clients/:id/invoices]", err);
    return res.status(500).json({ error: "Failed to fetch invoices." });
  }
});

// POST /api/invoices/:id/send — email invoice PDF to client
app.post("/api/invoices/:id/send", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { id } = req.params;
  const requestingUserId = getUserId(req);

  try {
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) return res.status(404).json({ error: "Invoice not found." });
    if (invoice.provider_id !== requestingUserId) return res.status(403).json({ error: "Not authorized." });
    if (!invoice.client_email) return res.status(400).json({ error: "No client email on invoice." });

    // TODO: integrate email provider (SendGrid / Resend) to attach PDF
    // For now, mark as sent and return ok
    await supabase
      .from("provider_invoices")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", id);

    return res.status(200).json({ ok: true, sent_to: invoice.client_email });
  } catch (err) {
    console.error("[invoices/:id/send]", err);
    return res.status(500).json({ error: "Failed to send invoice." });
  }
});

// GET /api/invoices/:id/pdf — generate and stream invoice PDF
app.get("/api/invoices/:id/pdf", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { id } = req.params;
  const requestingUserId = getUserId(req);

  try {
    const { data: invoice, error } = await supabase
      .from("provider_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) return res.status(404).json({ error: "Invoice not found." });

    // Auth: provider or client on this invoice
    if (invoice.provider_id !== requestingUserId && invoice.client_id !== requestingUserId) {
      return res.status(403).json({ error: "Not authorized." });
    }

    // ── PDF Generation ──────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: "LETTER", margin: 60 });
    const safeFilename = (invoice.invoice_number || id).replace(/[^a-zA-Z0-9\-_]/g, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
    doc.pipe(res);

    const INK   = "#3D231E";
    const MUTED = "#8C6A64";
    const FADED = "#B0948F";
    const ACCENT = "#C25E4A";
    const LINE  = "#D4C0BA"; // visible hairline for PDF

    const fmtDate = (d) => d
      ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";
    const fmtMoney = (cents) => {
      const val = cents != null ? (cents >= 100 ? cents / 100 : cents) : 0;
      return `$${(+val).toFixed(2)}`;
    };

    const businessName = invoice.business_name || "Provider";
    const issueDate = fmtDate(invoice.issued_at);
    const RIGHT_X = 540; // right edge for right-aligned content

    // ── Provider block (top-left) ────────────────────────────────────────────
    let y = 60;
    doc.font("Helvetica-Bold").fontSize(20).fillColor(INK).text(businessName, 60, y);
    y += 28;
    if (invoice.business_address) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.business_address, 60, y);
      y += 15;
    }
    if (invoice.business_email) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.business_email, 60, y);
      y += 15;
    }
    if (invoice.business_phone) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.business_phone, 60, y);
      y += 15;
    }

    // ── PAID badge (top-right) ───────────────────────────────────────────────
    const paidLabel = invoice.status === "paid" ? "PAID" : (invoice.status || "PENDING").toUpperCase();
    const badgeColor = invoice.status === "paid" ? "#5A8A5E" : ACCENT;
    doc.rect(RIGHT_X - 54, 60, 54, 22).fillAndStroke(badgeColor, badgeColor);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF")
      .text(paidLabel, RIGHT_X - 54, 66, { width: 54, align: "center" });

    // ── Invoice number / date row ─────────────────────────────────────────────
    y = Math.max(y + 12, 130);
    doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();
    y += 12;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK)
      .text(`Invoice #${invoice.invoice_number || id}`, 60, y);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED)
      .text(`Date: ${issueDate}`, 0, y, { align: "right" });
    y += 24;
    doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

    // ── Billed To ────────────────────────────────────────────────────────────
    y += 16;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(FADED)
      .text("BILLED TO", 60, y, { characterSpacing: 1 });
    y += 16;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK)
      .text(invoice.client_name || "Client", 60, y);
    y += 15;
    if (invoice.client_email) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(invoice.client_email, 60, y);
      y += 14;
    }
    y += 8;
    doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

    // ── Service Details ───────────────────────────────────────────────────────
    y += 16;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(FADED)
      .text("SERVICE DETAILS", 60, y, { characterSpacing: 1 });
    y += 16;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(INK)
      .text(invoice.service_name || "Service", 60, y);
    y += 17;
    if (invoice.service_description) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED)
        .text(invoice.service_description, 60, y, { width: 380, lineGap: 2 });
      y += doc.heightOfString(invoice.service_description, { width: 380 }) + 8;
    }
    const detailParts = [];
    if (invoice.date_of_service) detailParts.push(`Date: ${fmtDate(invoice.date_of_service)}`);
    if (invoice.duration) detailParts.push(`Duration: ${invoice.duration}`);
    if (detailParts.length) {
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(detailParts.join("  ·  "), 60, y);
      y += 16;
    }
    y += 8;
    doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();

    // ── Line items ────────────────────────────────────────────────────────────
    y += 16;
    const lineItem = (label, amount, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(11)
        .fillColor(bold ? INK : MUTED).text(label, 60, y);
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(11)
        .fillColor(bold ? INK : MUTED).text(amount, 0, y, { align: "right" });
      y += 20;
    };

    lineItem("Subtotal", fmtMoney(invoice.subtotal));
    if (invoice.deposit_amount > 0) {
      lineItem("Deposit paid", `−${fmtMoney(invoice.deposit_amount)}`);
      lineItem("Remaining charged", fmtMoney(invoice.remaining_amount));
    }
    y += 4;
    doc.moveTo(60, y).lineTo(RIGHT_X, y).strokeColor(LINE).lineWidth(0.75).stroke();
    y += 12;
    lineItem("Total", fmtMoney(invoice.total), true);

    // ── Payment status ────────────────────────────────────────────────────────
    y += 8;
    const paymentLine = invoice.status === "paid"
      ? `Payment received via Stripe · ${fmtDate(invoice.issued_at)}`
      : "Payment pending";
    doc.font("Helvetica").fontSize(10)
      .fillColor(invoice.status === "paid" ? "#5A8A5E" : ACCENT)
      .text(paymentLine, 60, y);

    // ── Footer ────────────────────────────────────────────────────────────────
    const FOOTER_Y = 720;
    doc.moveTo(60, FOOTER_Y).lineTo(RIGHT_X, FOOTER_Y).strokeColor(LINE).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(9).fillColor(FADED)
      .text(`Invoice generated by ${businessName} · Powered by Kliques`, 60, FOOTER_Y + 10, {
        align: "center", width: RIGHT_X - 60,
      });

    doc.end();
  } catch (err) {
    console.error("[invoices/:id/pdf]", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to generate PDF." });
  }
});

// ============================================
// ACCOUNT DELETION
// ============================================

/**
 * DELETE /api/accounts/me
 *
 * Soft-deletes the calling user's account:
 *   1. Verify auth (x-user-id header)
 *   2. Cancel any pending bookings and notify the other party
 *   3. Anonymise PII in client_profiles / provider_profiles
 *   4. Set account_status = 'deleted' + deleted_at timestamp
 *   5. Schedule hard delete by storing scheduled_hard_delete_at (30 days out)
 *   6. Supabase Auth: disable the user so tokens no longer work
 *
 * The frontend signs the user out client-side after receiving 200.
 * Hard deletion of auth user + all rows is handled by a scheduled job / cron.
 */
app.delete("/api/accounts/me", async (req, res) => {
  const userId = getUserId(req);
  if (!userId || userId === "demo-user") {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!supabase) {
    return res.status(503).json({ error: "Database unavailable." });
  }

  try {
    const now = new Date().toISOString();
    const hardDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const anonName = "Deleted User";
    const anonEmail = `deleted+${userId}@kliques.invalid`;

    // ── 1. Cancel pending bookings and notify the other party ──────────────
    const { data: pendingBookings } = await supabase
      .from("bookings")
      .select("id, provider_id, client_id")
      .eq("status", "pending")
      .or(`provider_id.eq.${userId},client_id.eq.${userId}`);

    if (pendingBookings && pendingBookings.length > 0) {
      const bookingIds = pendingBookings.map((b) => b.id);

      await supabase
        .from("bookings")
        .update({ status: "cancelled", cancelled_at: now, cancellation_reason: "Account deleted" })
        .in("id", bookingIds);

      // Notify the other party for each cancelled booking
      for (const booking of pendingBookings) {
        const isProvider = booking.provider_id === userId;
        const otherPartyId = isProvider ? booking.client_id : booking.provider_id;
        const notification = {
          type: "booking_cancelled",
          title: "Booking cancelled",
          body: "A booking was cancelled because the other party deleted their account.",
          data: { booking_id: booking.id },
        };
        if (isProvider) {
          await createClientNotification(otherPartyId, notification).catch(() => {});
        } else {
          await createProviderNotification(otherPartyId, notification).catch(() => {});
        }
      }
    }

    // ── 2. Anonymise client profile ────────────────────────────────────────
    await supabase
      .from("client_profiles")
      .update({
        name: anonName,
        email: anonEmail,
        phone: null,
        city: null,
        avatar: null,
        account_status: "deleted",
        deleted_at: now,
        scheduled_hard_delete_at: hardDeleteAt,
      })
      .eq("user_id", userId);

    // ── 3. Anonymise provider profile (if the user is also a provider) ─────
    await supabase
      .from("provider_profiles")
      .update({
        name: anonName,
        email: anonEmail,
        phone: null,
        bio: null,
        city: null,
        address_line1: null,
        address_line2: null,
        avatar: null,
        account_status: "deleted",
        deleted_at: now,
        scheduled_hard_delete_at: hardDeleteAt,
      })
      .eq("provider_id", userId);

    // ── 4. Disable the Supabase Auth user (invalidates all sessions) ───────
    // Uses admin API — requires service role key
    await supabase.auth.admin.updateUserById(userId, { ban_duration: "876600h" }); // ~100 years

    res.status(200).json({
      ok: true,
      message: "Account scheduled for deletion. All sessions have been invalidated.",
      scheduled_hard_delete_at: hardDeleteAt,
    });
  } catch (err) {
    console.error("[accounts/me DELETE]", err);
    res.status(500).json({ error: "Failed to delete account. Please contact support." });
  }
});

// ============================================
// SERVICE GROUPS (providers/:id/service-groups)
// ============================================

// POST /api/providers/:id/service-groups
app.post("/api/providers/:id/service-groups", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Group name is required." });

  try {
    const { data: existing } = await supabase
      .from("service_groups")
      .select("sort_order")
      .eq("provider_id", providerId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const sort_order = existing && existing.length > 0 ? (existing[0].sort_order ?? 0) + 1 : 0;

    const { data, error } = await supabase
      .from("service_groups")
      .insert({ provider_id: providerId, name: name.trim(), description: description?.trim() || null, sort_order })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ group: data });
  } catch (err) {
    console.error("[POST /providers/:id/service-groups]", err);
    res.status(500).json({ error: "Failed to create service group." });
  }
});

// PUT /api/providers/:id/service-groups/:groupId
app.put("/api/providers/:id/service-groups/:groupId", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const { groupId } = req.params;
  const { name, description } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Group name is required." });

  try {
    const { data, error } = await supabase
      .from("service_groups")
      .update({ name: name.trim(), description: description?.trim() ?? null, updated_at: new Date().toISOString() })
      .eq("id", groupId)
      .eq("provider_id", providerId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Group not found." });
    res.status(200).json({ group: data });
  } catch (err) {
    console.error("[PUT /providers/:id/service-groups/:groupId]", err);
    res.status(500).json({ error: "Failed to update service group." });
  }
});

// DELETE /api/providers/:id/service-groups/:groupId
// Reassigns all services in this group to ungrouped (group_id = null)
app.delete("/api/providers/:id/service-groups/:groupId", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const { groupId } = req.params;

  try {
    // Verify group belongs to this provider
    const { data: group, error: findErr } = await supabase
      .from("service_groups")
      .select("id")
      .eq("id", groupId)
      .eq("provider_id", providerId)
      .single();
    if (findErr || !group) return res.status(404).json({ error: "Group not found." });

    // Reassign services to ungrouped
    await supabase
      .from("services")
      .update({ group_id: null })
      .eq("group_id", groupId)
      .eq("provider_id", providerId);

    // Delete the group
    const { error: delErr } = await supabase
      .from("service_groups")
      .delete()
      .eq("id", groupId)
      .eq("provider_id", providerId);
    if (delErr) throw delErr;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[DELETE /providers/:id/service-groups/:groupId]", err);
    res.status(500).json({ error: "Failed to delete service group." });
  }
});

// PUT /api/services/:id/group — move a service to a different group (or ungrouped)
app.put("/api/services/:id/group", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const callerId = getProviderId(req);
  const { id } = req.params;
  const { group_id } = req.body || {};

  try {
    // Verify service ownership
    const { data: svc, error: findErr } = await supabase
      .from("services")
      .select("id, provider_id")
      .eq("id", id)
      .single();
    if (findErr || !svc) return res.status(404).json({ error: "Service not found." });
    if (svc.provider_id !== callerId) return res.status(403).json({ error: "Forbidden." });

    // If a group_id is provided, verify it belongs to the same provider
    if (group_id) {
      const { data: grp } = await supabase
        .from("service_groups")
        .select("id")
        .eq("id", group_id)
        .eq("provider_id", callerId)
        .single();
      if (!grp) return res.status(404).json({ error: "Group not found." });
    }

    const { data, error } = await supabase
      .from("services")
      .update({ group_id: group_id || null })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ service: data });
  } catch (err) {
    console.error("[PUT /services/:id/group]", err);
    res.status(500).json({ error: "Failed to move service." });
  }
});

// ============================================
// BOOKINGS — provider and client filtered views
// ============================================

/**
 * GET /api/providers/:id/bookings
 * Query params:
 *   tab — "pending" | "upcoming" | "past" | omitted (all)
 *
 * Returns bookings for the provider using the bookings table as the source of truth.
 */
app.get("/api/providers/:id/bookings", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const tab = String(req.query.tab || "").toLowerCase();
  const todayKey = getLocalDateKey();

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", providerId);
    if (error) throw error;
    const allBookings = data || [];
    const filtered = tab
      ? allBookings.filter((booking) => getProviderBookingTab(booking, todayKey) === tab)
      : allBookings;
    const bookings = sortProviderBookings(filtered, tab);

    res.status(200).json({ bookings });
  } catch (err) {
    console.error("[GET /providers/:id/bookings]", err);
    res.status(500).json({ error: "Failed to load bookings." });
  }
});

/**
 * GET /api/clients/:id/bookings
 * Query params:
 *   timeframe — "upcoming" | "past" | omitted (all)
 *
 * Returns bookings enriched with service name + provider name.
 */
app.get("/api/clients/:id/bookings", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const clientId = req.params.id;
  const callerId = getUserId(req);
  if (callerId !== clientId) return res.status(403).json({ error: "Forbidden." });

  const tab = String(req.query.tab || "").toLowerCase();
  const todayKey = getLocalDateKey();

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("client_id", clientId);
    if (error) throw error;
    const allBookings = data || [];
    const filtered = tab
      ? allBookings.filter((booking) => getClientBookingTab(booking, todayKey) === tab)
      : allBookings;
    const bookings = sortClientBookings(filtered, tab);

    res.status(200).json({ bookings });
  } catch (err) {
    console.error("[GET /clients/:id/bookings]", err);
    res.status(500).json({ error: "Failed to load bookings." });
  }
});

// ============================================
// PROFILE SETTINGS
// ============================================

// PUT /api/providers/:id/notification-preferences
app.put("/api/providers/:id/notification-preferences", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const { preferences } = req.body || {};
  if (!preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "preferences object is required." });
  }

  try {
    const { data, error } = await supabase
      .from("provider_profiles")
      .upsert(
        { provider_id: providerId, notification_preferences: preferences, updated_at: new Date().toISOString() },
        { onConflict: "provider_id" }
      )
      .select("notification_preferences")
      .single();
    if (error) throw error;
    res.status(200).json({ notification_preferences: data.notification_preferences });
  } catch (err) {
    console.error("[PUT /providers/:id/notification-preferences]", err);
    res.status(500).json({ error: "Failed to update notification preferences." });
  }
});

// PUT /api/providers/:id/booking-settings
app.put("/api/providers/:id/booking-settings", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const providerId = req.params.id;
  const callerId = getProviderId(req);
  if (callerId !== providerId) return res.status(403).json({ error: "Forbidden." });

  const { settings } = req.body || {};
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "settings object is required." });
  }

  try {
    const { data, error } = await supabase
      .from("provider_profiles")
      .upsert(
        { provider_id: providerId, booking_settings: settings, updated_at: new Date().toISOString() },
        { onConflict: "provider_id" }
      )
      .select("booking_settings")
      .single();
    if (error) throw error;
    res.status(200).json({ booking_settings: data.booking_settings });
  } catch (err) {
    console.error("[PUT /providers/:id/booking-settings]", err);
    res.status(500).json({ error: "Failed to update booking settings." });
  }
});

// PUT /api/clients/:id/notification-preferences
app.put("/api/clients/:id/notification-preferences", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database unavailable." });
  const clientId = req.params.id;
  const callerId = getUserId(req);
  if (callerId !== clientId) return res.status(403).json({ error: "Forbidden." });

  const { preferences } = req.body || {};
  if (!preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "preferences object is required." });
  }

  try {
    const { data, error } = await supabase
      .from("client_profiles")
      .upsert(
        { user_id: clientId, notification_preferences: preferences, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select("notification_preferences")
      .single();
    if (error) throw error;
    res.status(200).json({ notification_preferences: data.notification_preferences });
  } catch (err) {
    console.error("[PUT /clients/:id/notification-preferences]", err);
    res.status(500).json({ error: "Failed to update notification preferences." });
  }
});

export { app };

if (IS_DIRECT_RUN) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}
