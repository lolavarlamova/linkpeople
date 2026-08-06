// Vercel Serverless Function (Node.js classic (req,res) signature) — talent profile + optional CV.
// Multipart is parsed with busboy; the CV is kept in memory, validated, attached to the
// notification email, then discarded. It is never written to disk, a public folder/URL, or a DB.
// Requires RESEND_API_KEY + a verified Resend sending domain (see FORM_SETUP.md).
import { Resend } from "resend";
import Busboy from "busboy";

// Keep the raw request stream available for busboy (multipart file upload).
export const config = { api: { bodyParser: false } };

const FROM = process.env.FORM_FROM_EMAIL || "LinkPeople Website <website@linkpeople.agency>";
const TO = process.env.TALENT_INBOX || "talent@linkpeople.agency";
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function clip(s, n) { return String(s == null ? "" : s).trim().slice(0, n); }
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function table(title, rows) {
  var trs = rows.map(function (r) {
    return '<tr><td style="padding:6px 12px;color:#62676d;vertical-align:top;white-space:nowrap">' + esc(r[0]) +
      '</td><td style="padding:6px 12px;color:#111315;white-space:pre-wrap">' + esc(r[1]) + "</td></tr>";
  }).join("");
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px">' +
    '<h2 style="font-size:18px;color:#111315">' + esc(title) + "</h2>" +
    '<table style="border-collapse:collapse;font-size:14px;width:100%">' + trs + "</table></div>";
}
function confirmTalent(first) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111315;line-height:1.6;max-width:560px">' +
    "<p>Hi " + esc(first) + ",</p>" +
    "<p>Thank you for joining the LinkPeople Talent Network. Your profile has been received.</p>" +
    "<p>Joining the Talent Network is not an application for a specific vacancy, and submitting a profile does not guarantee contact. We will reach out only when a potentially relevant opportunity exists.</p>" +
    '<p>You can ask us to delete your profile at any time by emailing <a href="mailto:privacy@linkpeople.agency">privacy@linkpeople.agency</a>.</p>' +
    "<p>Best,<br>LinkPeople Talent Network<br>talent@linkpeople.agency</p></div>";
}

// Best-effort in-memory rate limit (per warm instance; not a substitute for a shared store).
function clientIp(req) {
  var xf = (req.headers && (req.headers["x-forwarded-for"] || req.headers["x-real-ip"])) || "";
  return String(xf).split(",")[0].trim() || "unknown";
}
function rateLimited(ip) {
  var store = globalThis.__lpTalentHits || (globalThis.__lpTalentHits = new Map());
  var now = Date.now(), WINDOW = 10000, MAX = 5;
  var arr = (store.get(ip) || []).filter(function (t) { return now - t < WINDOW; });
  arr.push(now); store.set(ip, arr);
  if (store.size > 5000) store.clear();
  return arr.length > MAX;
}

function parseMultipart(req) {
  return new Promise(function (resolve, reject) {
    var bb;
    try { bb = Busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES + 1, files: 1, fields: 40 } }); }
    catch (e) { reject(e); return; }
    var fields = {}, chunks = [], fileName = "", fileType = "", truncated = false, hasFile = false;
    bb.on("field", function (name, val) { fields[name] = val; });
    bb.on("file", function (name, stream, info) {
      hasFile = true; fileName = (info && info.filename) || ""; fileType = (info && info.mimeType) || "";
      stream.on("data", function (c) { chunks.push(c); });
      stream.on("limit", function () { truncated = true; });
      stream.on("error", function () { truncated = true; });
    });
    bb.on("close", function () {
      resolve({ fields: fields, fileBuf: hasFile ? Buffer.concat(chunks) : null, fileName: fileName, fileType: fileType, truncated: truncated });
    });
    bb.on("error", reject);
    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method_not_allowed" }); return; }
  if (!process.env.RESEND_API_KEY) { console.error("talent-submission: RESEND_API_KEY missing"); res.status(500).json({ ok: false, error: "server_config" }); return; }
  if (rateLimited(clientIp(req))) { res.status(429).json({ ok: false, error: "rate_limited" }); return; }

  var parsed;
  try { parsed = await parseMultipart(req); } catch (e) { res.status(400).json({ ok: false, error: "bad_request" }); return; }
  var fields = parsed.fields || {};

  // Spam: honeypot + minimum completion time
  if (String(fields.company_url || "").trim() !== "") { res.status(200).json({ ok: true }); return; }
  var elapsed = Date.now() - Number(fields.t0 || 0);
  if (!fields.t0 || elapsed < 2500 || elapsed > 1000 * 60 * 60) { res.status(400).json({ ok: false, error: "timing" }); return; }

  var name = clip(fields.name, 120), email = clip(fields.email, 200),
    linkedin = clip(fields.linkedin, 300), location = clip(fields.location, 160),
    pref = clip(fields.preferred_location, 160), expertise = clip(fields.expertise, 80),
    seniority = clip(fields.seniority, 80), workFormat = clip(fields.work_format, 80),
    summary = clip(fields.summary, 4000);
  var consentPrivacy = clip(fields.consent_privacy, 8), consentStore = clip(fields.consent_store, 8);
  var source = clip(fields.sourcePage, 120) || "/talent-network";

  if (!name || !email || !expertise || !isEmail(email)) { res.status(400).json({ ok: false, error: "validation" }); return; }
  if (linkedin && !/^https?:\/\/.+\..+/.test(linkedin)) { res.status(400).json({ ok: false, error: "validation" }); return; }
  // Both consents are mandatory and must be recorded.
  if (consentPrivacy !== "yes" || consentStore !== "yes") { res.status(400).json({ ok: false, error: "consent" }); return; }

  // Optional CV — validate size + extension + MIME.
  var attachments;
  if (parsed.fileBuf && parsed.fileBuf.length > 0) {
    if (parsed.truncated || parsed.fileBuf.length > MAX_BYTES) { res.status(400).json({ ok: false, error: "file_size" }); return; }
    var ext = (parsed.fileName || "").toLowerCase().split(".").pop();
    if (!ALLOWED[ext]) { res.status(400).json({ ok: false, error: "file_type" }); return; }
    var type = parsed.fileType || "";
    var typeOk = ALLOWED[ext].indexOf(type) >= 0 || type === "" || type === "application/octet-stream";
    if (!typeOk) { res.status(400).json({ ok: false, error: "file_type" }); return; }
    var safeName = "CV-" + (name.replace(/[^a-z0-9]+/gi, "_").slice(0, 40) || "candidate") + "." + ext;
    attachments = [{ filename: safeName, content: parsed.fileBuf }];
  }

  var subject = "New Talent Network profile — " + name + " — " + expertise;
  var rows = [
    ["Full name", name], ["Email", email], ["LinkedIn", linkedin || "—"], ["Current location", location || "—"],
    ["Preferred work location", pref || "—"], ["Area of expertise", expertise], ["Seniority", seniority || "—"],
    ["Preferred work format", workFormat || "—"], ["Summary", summary || "—"],
    ["CV attached", attachments ? "Yes" : "No"],
    ["Consent — read Candidate Privacy Notice", consentPrivacy === "yes" ? "Yes" : "No"],
    ["Consent — store up to 12 months", consentStore === "yes" ? "Yes" : "No"],
    ["Submitted", new Date().toISOString()], ["Source page", source],
  ];
  // Lead source (UTM + referrer) — internal notification only; omitted when absent.
  [["utm_source", "UTM source"], ["utm_medium", "UTM medium"], ["utm_campaign", "UTM campaign"], ["utm_content", "UTM content"], ["referrer", "Referring page"]].forEach(function (p) {
    var v = clip(fields[p[0]], 300); if (v) rows.push([p[1], v]);
  });
  var html = table("New Talent Network profile", rows);

  var resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({ from: FROM, to: TO, replyTo: email, subject: subject, html: html, attachments: attachments });
    var first = name.split(/\s+/)[0] || name;
    await resend.emails.send({ from: FROM, to: email, subject: "Your profile has been received by LinkPeople", html: confirmTalent(first) });
  } catch (e) {
    console.error("talent-submission: send failed:", e && e.message);
    res.status(502).json({ ok: false, error: "send_failed" }); return;
  }
  res.status(200).json({ ok: true });
}
