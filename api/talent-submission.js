// Vercel Serverless Function (Node, Web-standard handler) — talent profile + optional CV -> Resend.
// The CV is read in memory, validated, attached to the notification email, and discarded.
// It is never written to disk, a public folder, a URL, or a database.
// Requires RESEND_API_KEY + a verified Resend sending domain.
import { Resend } from "resend";

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
function json(body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { "content-type": "application/json" } });
}
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
    "<p>Thank you for sharing your profile with LinkPeople.</p>" +
    "<p>We have received your information and will review it for relevant current and future opportunities.</p>" +
    "<p>Please note that submitting a profile does not guarantee employment, an interview or an individual response.</p>" +
    "<p>Best,<br>LinkPeople Talent Network<br>talent@linkpeople.agency</p></div>";
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!process.env.RESEND_API_KEY) { console.error("talent-submission: RESEND_API_KEY missing"); return json({ ok: false, error: "server_config" }, 500); }

  let form;
  try { form = await request.formData(); } catch (e) { return json({ ok: false, error: "bad_request" }, 400); }

  // Spam: honeypot + minimum completion time
  if (String(form.get("company_url") || "").trim() !== "") return json({ ok: true });
  var t0 = Number(form.get("t0") || 0);
  var elapsed = Date.now() - t0;
  if (!t0 || elapsed < 2500 || elapsed > 1000 * 60 * 60) return json({ ok: false, error: "timing" }, 400);

  var name = clip(form.get("name"), 120), email = clip(form.get("email"), 200),
    linkedin = clip(form.get("linkedin"), 300), location = clip(form.get("location"), 160),
    pref = clip(form.get("preferred_location"), 160), expertise = clip(form.get("expertise"), 80),
    seniority = clip(form.get("seniority"), 80), workFormat = clip(form.get("work_format"), 80),
    summary = clip(form.get("summary"), 4000);

  if (!name || !email || !expertise || !isEmail(email)) return json({ ok: false, error: "validation" }, 400);
  if (linkedin && !/^https?:\/\/.+\..+/.test(linkedin)) return json({ ok: false, error: "validation" }, 400);

  // Optional CV — validate extension + MIME + size, keep only in memory.
  var attachments;
  var file = form.get("cv");
  if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
    var ext = (file.name || "").toLowerCase().split(".").pop();
    if (!ALLOWED[ext]) return json({ ok: false, error: "file_type" }, 400);
    if (file.size > MAX_BYTES) return json({ ok: false, error: "file_size" }, 400);
    var type = file.type || "";
    var typeOk = ALLOWED[ext].indexOf(type) >= 0 || type === "" || type === "application/octet-stream";
    if (!typeOk) return json({ ok: false, error: "file_type" }, 400);
    var buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) return json({ ok: false, error: "file_size" }, 400);
    var safeName = "CV-" + (name.replace(/[^a-z0-9]+/gi, "_").slice(0, 40) || "candidate") + "." + ext;
    attachments = [{ filename: safeName, content: buf }];
  }

  var subject = "New Talent Network profile — " + name + " — " + expertise;
  var html = table("New Talent Network profile", [
    ["Full name", name], ["Email", email], ["LinkedIn", linkedin || "—"], ["Current location", location || "—"],
    ["Preferred work location", pref || "—"], ["Area of expertise", expertise], ["Seniority", seniority || "—"],
    ["Preferred work format", workFormat || "—"], ["Summary", summary || "—"],
    ["Submitted", new Date().toISOString()], ["CV attached", attachments ? "Yes" : "No"],
  ]);

  var resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({ from: FROM, to: TO, replyTo: email, subject: subject, html: html, attachments: attachments });
    var first = name.split(/\s+/)[0] || name;
    await resend.emails.send({ from: FROM, to: email, subject: "Your LinkPeople profile has been received", html: confirmTalent(first) });
  } catch (e) {
    console.error("talent-submission: send failed:", e && e.message);
    return json({ ok: false, error: "send_failed" }, 502);
  }
  return json({ ok: true });
}
