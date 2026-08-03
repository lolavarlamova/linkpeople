# Form + email setup (Resend)

The contact (`/contact`) and Talent Network (`/talent-network`) forms POST to Vercel
serverless functions (`api/employer-enquiry.js`, `api/talent-submission.js`) which send email
via [Resend](https://resend.com). **The forms only send real email once the steps below are done.**
Until then, submissions return a normal error and nothing is sent (no fake success is shown).

## 1. Create a Resend account
Sign up at https://resend.com.

## 2. Add and verify `linkpeople.agency` as a sending domain
In Resend → **Domains → Add Domain** → `linkpeople.agency`.

## 3. Add only the DNS records Resend provides
Resend gives you records to add (typically an SPF/`TXT` and DKIM `CNAME`/`TXT`, and often a
`MX` for a `send.` subdomain used only for bounce handling). Add **exactly those** in your DNS
(Vercel → Domains → `linkpeople.agency` → DNS records).

> **Do NOT remove or replace your existing Google Workspace MX records.** Those deliver your
> normal mailboxes (`hello@`, `talent@`). Resend's records are separate and additive.

Wait for Resend to show the domain as **Verified**.

## 4. Create a Resend API key
Resend → **API Keys → Create** (sending permission). Copy it — you will not see it again.

## 5. Add environment variables in Vercel
Vercel → Project → **Settings → Environment Variables**. Add:

| Name | Value |
| --- | --- |
| `RESEND_API_KEY` | *(your Resend key — keep secret)* |
| `FORM_FROM_EMAIL` | `LinkPeople Website <website@linkpeople.agency>` |
| `EMPLOYER_INBOX` | `hello@linkpeople.agency` |
| `TALENT_INBOX` | `talent@linkpeople.agency` |
| `SITE_URL` | `https://www.linkpeople.agency` |

- `RESEND_API_KEY` must be a **plain server variable** — never `NEXT_PUBLIC_` and never in client code.
- The inbox/from values also have safe defaults hardcoded server-side; the env vars let you change them without a code change.

## 6. Apply to the right environments
Add the variables to **Production** (and **Preview**/**Development** if you test there).

## 7. Redeploy
Environment variable changes only take effect on a new deployment. Trigger a redeploy
(push a commit or use Vercel → Deployments → Redeploy).

## 8. Test after deployment
- Submit `/contact` with valid details → expect the success message, and an email in
  `hello@linkpeople.agency` plus a confirmation to the address you entered.
- Submit `/talent-network` with a valid PDF CV → expect the success message, an email in
  `talent@linkpeople.agency` with the CV attached, plus a confirmation to the candidate.
- Try an invalid email, a missing required field, a non-PDF/DOC/DOCX file, and a file > 4 MB →
  expect clear errors and no email.

## Notes / limits
- Vercel serverless request bodies are limited to ~4.5 MB, so the CV cap is **4 MB**.
- CVs are processed **in memory only** and attached to the notification email — never stored on
  disk, in a public folder/URL, or in a database.
- Final legal review of the Privacy and Terms pages is still recommended before relying on them.
