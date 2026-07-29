# Quick Email Setup (5 Minutes)

Toast2Host's backend already has `@strapi/provider-email-nodemailer` installed and configured in `apps/backend/config/plugins.ts` for **Brevo SMTP** — no package install needed, just credentials.

## Setup with Brevo

### 1. Get Brevo SMTP Credentials
```bash
# Visit: https://www.brevo.com → sign up
# Settings → SMTP & API → SMTP → note your SMTP login, generate an SMTP key
```

### 2. Add to `.env`
```bash
# Add these lines to apps/backend/.env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-brevo-smtp-login
SMTP_PASSWORD=your-brevo-smtp-key
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

`EMAIL_FROM` must be a sender address/domain verified with Brevo, or sends will bounce.

### 3. Restart Strapi

```bash
cd apps/backend
pnpm dev
```
(Or, for a built/deployed instance: `pnpm build` then restart whatever's running `pnpm start`.)

### 4. Deploy (if applicable)

```bash
# From project root
rsync -avz --exclude .env --exclude node_modules apps/backend/dist/ apps/backend/src/ apps/backend/config/ azureuser@172.183.133.80:~/backend/
ssh azureuser@172.183.133.80 "cd ~/backend && pm2 restart strapi-backend"
```

### 5. Test

Send a real connection request from the frontend (Search → Connect on a profile) — the target user should receive an email. Failures are logged server-side (`Error sending connection request email:`) rather than shown in the UI, so check Strapi's console/PM2 logs if nothing arrives.

## Email Template Preview

`src/utils/email-templates/connection-request.html` and `connection-approved.html` include:
- Toast2Host yellow (`#ffc510`) branding
- Logo served from your backend's `public/t2h_logo.png` (must be reachable at your deployed `server.url` for the image to load in a recipient's inbox)
- Guest's name, university, and batch year
- Optional LinkedIn profile link
- A button linking to `${FRONTEND_URL}/connections`
- Mobile-responsive layout

## Troubleshooting

**No emails received?**
```bash
ssh azureuser@172.183.133.80 "pm2 logs strapi-backend --lines 50"
```
Look for `Error sending connection request email:` / `Error sending connection approved email:` — these are caught and logged, never thrown, so a broken email config never blocks the underlying connection request/approval itself.

**Emails going to spam?**
- Verify your sending domain with Brevo and add the SPF/DKIM records they provide

For alternative providers (Resend, SendGrid, AWS SES) and full detail on what env vars map to what, see [EMAIL_SETUP.md](./EMAIL_SETUP.md).
