# Email Configuration Guide for Toast2Host

This guide covers transactional email for connection-request / connection-approved notifications, sent from `src/utils/email-service.ts` via Strapi's built-in email plugin.

**What's actually wired up in this codebase today is Brevo via SMTP (`@strapi/provider-email-nodemailer`)** — configured in `apps/backend/config/plugins.ts`. If you've seen older instructions in this repo mentioning Resend/SendGrid/AWS SES as the primary path, those don't match the current `plugins.ts` and would require swapping the provider package (see "Alternative Providers" below) rather than just adding an API key.

## Current Setup: Brevo (SMTP) via Nodemailer

`config/plugins.ts` already contains:

```typescript
email: {
  config: {
    provider: 'nodemailer',
    providerOptions: {
      host: env('SMTP_HOST', 'smtp-relay.brevo.com'),
      port: env('SMTP_PORT', 587),
      auth: {
        user: env('SMTP_USERNAME'),
        pass: env('SMTP_PASSWORD'),
      },
      secure: false,
      tls: { rejectUnauthorized: true },
    },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
    },
  },
},
```

`@strapi/provider-email-nodemailer` is already in `apps/backend/package.json` — no package install needed.

### Step 1: Create a Brevo Account and Get SMTP Credentials

1. Sign up at https://www.brevo.com (formerly Sendinblue)
2. Go to **Settings → SMTP & API → SMTP** in the Brevo dashboard
3. Note your **SMTP login** (usually your Brevo account email) and generate an **SMTP key** (this is a separate secret from your account password)

### Step 2: Add Environment Variables

Add to `apps/backend/.env`:

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-brevo-smtp-login
SMTP_PASSWORD=your-brevo-smtp-key
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net   # or http://localhost:3000 for local dev — used to build the "View Connection Request" link
```

`EMAIL_FROM` must be an address verified with Brevo (or a domain you've verified there), or sends will be rejected/bounced.

### Step 3: Restart Strapi

```bash
cd apps/backend
pnpm dev
```

### Step 4: Test

Trigger a real connection request from the frontend (Search → Connect on another profile) — `connection.ts`'s resolver calls `sendConnectionRequestEmail` on request creation and `sendConnectionApprovedEmail` on acceptance. Both are **best-effort**: failures are caught and logged, not thrown, so a broken email config will never block the underlying connection action — check the Strapi console output for `Error sending connection request email:` if nothing arrives.

## Alternative Providers

Since Strapi's email plugin abstracts the provider, swapping providers means: install a different `@strapi/provider-email-*` package, and replace the `provider`/`providerOptions` block in `config/plugins.ts` — the `settings` block (`defaultFrom`/`defaultReplyTo`) and everything in `email-service.ts` stays the same either way.

### Resend

```bash
cd apps/backend
pnpm add @strapi/provider-email-resend
```

```typescript
email: {
  config: {
    provider: 'resend',
    providerOptions: {
      apiKey: env('RESEND_API_KEY'),
    },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
    },
  },
},
```

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

Get a key at https://resend.com/api-keys (free tier: 3,000 emails/month). Optionally verify a domain at https://resend.com/domains.

### SendGrid

```bash
pnpm add @strapi/provider-email-sendgrid
```

```typescript
email: {
  config: {
    provider: 'sendgrid',
    providerOptions: { apiKey: env('SENDGRID_API_KEY') },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
    },
  },
},
```

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
```

Free tier: 100 emails/day. Create a key under Settings → API Keys in the SendGrid dashboard.

### AWS SES

```bash
pnpm add @strapi/provider-email-amazon-ses
```

```typescript
email: {
  config: {
    provider: 'amazon-ses',
    providerOptions: {
      key: env('AWS_SES_KEY'),
      secret: env('AWS_SES_SECRET'),
      amazon: env('AWS_SES_REGION', 'us-east-1'),
    },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
    },
  },
},
```

```bash
AWS_SES_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_REGION=us-east-1
```

Requires a verified sender identity/domain in the SES console, and production access requested if you're out of the SES sandbox.

## Email Templates

Two HTML templates in `apps/backend/src/utils/email-templates/`:

- **`connection-request.html`** — sent to the host when someone requests to connect. Placeholders: `{{HOST_FIRST_NAME}}`, `{{GUEST_FULL_NAME}}`, `{{GUEST_FIRST_NAME}}`, `{{GUEST_UNIVERSITY}}`, `{{GUEST_BATCH}}`, `{{CONNECTIONS_URL}}`, `{{LOGO_URL}}`, and an optional `{{#if GUEST_LINKEDIN}}...{{/if}}` block for `{{GUEST_LINKEDIN}}`
- **`connection-approved.html`** — sent to the guest when their request is accepted. Placeholders: `{{GUEST_FIRST_NAME}}`, `{{HOST_FULL_NAME}}`, `{{HOST_EMAIL}}`, `{{HOST_UNIVERSITY}}`, `{{HOST_BATCH}}`, `{{CONNECTIONS_URL}}`, `{{LOGO_URL}}`, and an optional `{{#if HOST_LOCATION}}...{{/if}}` block

Both are read from `src/utils/email-templates/` at send time via `fs.readFileSync` (note: from `src/`, not `dist/`, even in a built deployment — see `email-service.ts`), so edits take effect without a rebuild in dev, but **do** require the `src/` directory to exist alongside `dist/` in whatever you deploy.

`LOGO_URL` is built as `${strapi.config.get('server.url')}/t2h_logo.png` — the logo must be present under `apps/backend/public/`.

## Troubleshooting

### Emails not sending

1. Check the Strapi backend console/logs for `Error sending connection request email:` or `Error sending connection approved email:` — these are logged, not thrown, so they're easy to miss if you're only watching the frontend
2. Verify `SMTP_USERNAME`/`SMTP_PASSWORD` (or the equivalent for whatever provider you're using) are correct
3. Check your provider's dashboard for bounce/rejection details
4. Confirm `EMAIL_FROM` is a verified sender for your provider

### Emails going to spam

1. Verify your sending domain with your provider (SPF/DKIM records)
2. Avoid sending from a raw Gmail/Yahoo-style address
3. Warm up sender reputation gradually if sending volume ramps up quickly

### Logo not showing in emails

1. Confirm `apps/backend/public/t2h_logo.png` exists
2. Confirm `server.url` (`PUBLIC_URL` env var, or the `server.ts` default) is reachable from wherever the recipient opens the email — `http://localhost:1337/...` will never load in someone else's inbox, so this only works end-to-end in a deployed environment with a public URL

## Environment Variables Summary

```bash
# Brevo/Nodemailer (current default provider)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# Shared across all providers
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

## Next Steps

1. Get Brevo SMTP credentials (or swap to an alternative provider above)
2. Add the env vars to `apps/backend/.env`
3. Restart Strapi
4. Trigger a real connection request from the frontend and confirm delivery
5. If deploying, confirm `PUBLIC_URL`/`FRONTEND_URL` point at your real domains so links and the logo resolve correctly
