// Vercel Serverless Function (Node, Web-standard handler) — employer enquiry -> Resend email.
// Deployed automatically by Vercel; requires RESEND_API_KEY + a verified Resend sending domain.
import { Resend } from "resend";

const FROM = process.env.FORM_FROM_EMAIL || "LinkPeople Website <website@linkpeople.agency>";
const TO = process.env.EMPLOYER_INBOX || "hello@linkpeople.agency";

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
function confirmEmployer(first) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111315;line-height:1.6;max-width:560px">' +
    "<p>Hi " + esc(first) + ",</p>" +
    "<p>Thank you for contacting LinkPeople.</p>" +
    "<p>We have received your enquiry and will review the information you provided. We will contact you shortly to discuss the hiring need and the most appropriate way to support it.</p>" +
    "<p>Best,<br>LinkPeople<br>Recruitment &amp; HR Advisory<br>hello@linkpeople.agency</p></div>";
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  if (!process.env.RESEND_API_KEY) { console.error("employer-enquiry: RESEND_API_KEY missing"); return json({ ok: false, error: "server_config" }, 500); }

  let data;
  try { data = await request.json(); } catch (e) { return json({ ok: false, error: "bad_request" }, 400); }

  // Spam: honeypot (silently accept, send nothing) + minimum completion time
  if (String(data.company_url || "").trim() !== "") return json({ ok: true });
  var elapsed = Date.now() - Number(data.t0 || 0);
  if (!data.t0 || elapsed < 2500 || elapsed > 1000 * 60 * 60) return json({ ok: false, error: "timing" }, 400);

  var name = clip(data.name, 120), company = clip(data.company, 160), email = clip(data.email, 200),
    website = clip(data.website, 300), help = clip(data.help, 80), roles = clip(data.roles, 40),
    timeline = clip(data.timeline, 80), message = clip(data.message, 4000);

  if (!name || !company || !email || !help || !message || !isEmail(email)) return json({ ok: false, error: "validation" }, 400);
  if (website && !/^https?:\/\/.+\..+/.test(website)) return json({ ok: false, error: "validation" }, 400);

  var ua = request.headers.get("user-agent") || "unknown";
  var source = clip(data.sourcePage, 120) || "/contact";
  var subject = "New employer enquiry — " + company + " — " + help;
  var html = table("New employer enquiry", [
    ["Full name", name], ["Company", company], ["Work email", email], ["Company website", website || "—"],
    ["Needs help with", help], ["Number of roles", roles || "—"], ["Expected timeline", timeline || "—"],
    ["Message", message], ["Submitted", new Date().toISOString()], ["Source page", source], ["User agent", ua],
  ]);

  var resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({ from: FROM, to: TO, replyTo: email, subject: subject, html: html });
    var first = name.split(/\s+/)[0] || name;
    await resend.emails.send({ from: FROM, to: email, subject: "We received your LinkPeople enquiry", html: confirmEmployer(first) });
  } catch (e) {
    console.error("employer-enquiry: send failed:", e && e.message);
    return json({ ok: false, error: "send_failed" }, 502);
  }
  return json({ ok: true });
}
