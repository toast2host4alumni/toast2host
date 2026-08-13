# Email Configuration Guide for Toast2Host

This guide covers transactional email for connection-request / connection-approved notifications, sent from `src/utils/email-service.ts` via Strapi's built-in email plugin.

**What's actually wired up in this codebase today is AWS SES (`@strapi/provider-email-amazon-ses`)** — configured in `apps/backend/config/plugins.ts`. If you've seen older instructions in this repo mentioning Brevo/Resend/SendGrid as the primary path, those don't match the current `plugins.ts` and would require swapping the provider package (see "Alternative Providers" below) rather than just adding an API key.

## Current Setup: AWS SES

`config/plugins.ts` already contains:

```typescript
email: {
  config: {
    provider: 'amazon-ses',
    providerOptions: {
      key: env('AWS_SES_KEY'),
      secret: env('AWS_SES_SECRET'),
      // Must be a full endpoint URL, not a bare region string - the provider
      // parses the region back out of this via a `email.<region>.amazonaws.com`
      // regex match. Passing just "us-east-1" here silently sets an invalid
      // SESClient `endpoint` instead of the intended region.
      amazon: `https://email.${env('AWS_SES_REGION', 'us-east-1')}.amazonaws.com`,
    },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
    },
  },
},
```

`@strapi/provider-email-amazon-ses` is already in `apps/backend/package.json` — no package install needed.

### Step 1: Get AWS SES Credentials

1. In the AWS Console, go to **SES → Verified identities** and verify the sender address/domain you'll use for `EMAIL_FROM` (SES will refuse to send from an unverified identity)
2. If your SES account is still in the **sandbox**, recipient addresses must *also* be verified identities — request production access under **SES → Account dashboard** to send to arbitrary recipients
3. Create an IAM user (or role) with `ses:SendEmail`/`ses:SendRawEmail` permission, and generate an **access key ID** and **secret access key** for it (IAM → Users → Security credentials → Create access key)
4. Note which **region** your SES identity was verified in (e.g. `us-east-1`) — SES is region-scoped, so this must match

### Step 2: Add Environment Variables

Add to `apps/backend/.env`:

```bash
AWS_SES_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net   # or http://localhost:3000 for local dev — used to build the "View Connection Request" link
```

`EMAIL_FROM` must be a verified identity in SES (or a domain you've verified there), or sends will be rejected.

### Step 3: Restart Strapi

```bash
cd apps/backend
pnpm dev
```

### Step 4: Test

Trigger a real connection request from the frontend (Search → Book on another profile) — `connection.ts`'s resolver calls `sendConnectionRequestEmail` on request creation and `sendConnectionApprovedEmail` on acceptance. Both are **best-effort**: failures are caught and logged, not thrown, so a broken email config will never block the underlying booking action — check the Strapi console output for `Error sending connection request email:` if nothing arrives.

## Alternative Providers

Since Strapi's email plugin abstracts the provider, swapping providers means: install a different `@strapi/provider-email-*` package, and replace the `provider`/`providerOptions` block in `config/plugins.ts` — the `settings` block (`defaultFrom`/`defaultReplyTo`) and everything in `email-service.ts` stays the same either way.

### Brevo (SMTP via Nodemailer)

```bash
cd apps/backend
pnpm add @strapi/provider-email-nodemailer
```

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

```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USERNAME=your-brevo-smtp-login
SMTP_PASSWORD=your-brevo-smtp-key
```

Sign up at https://www.brevo.com, then **Settings → SMTP & API → SMTP** for your SMTP login and key.

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

## Email Templates

Two HTML templates in `apps/backend/src/utils/email-templates/`:

- **`connection-request.html`** — sent to the host when someone requests to connect. Placeholders: `{{HOST_FIRST_NAME}}`, `{{GUEST_FULL_NAME}}`, `{{GUEST_FIRST_NAME}}`, `{{GUEST_UNIVERSITY}}`, `{{GUEST_BATCH}}`, `{{CONNECTIONS_URL}}`, `{{LOGO_URL}}`, and an optional `{{#if GUEST_LINKEDIN}}...{{/if}}` block for `{{GUEST_LINKEDIN}}`
- **`connection-approved.html`** — sent to the guest when their request is accepted. Placeholders: `{{GUEST_FIRST_NAME}}`, `{{HOST_FULL_NAME}}`, `{{HOST_EMAIL}}`, `{{HOST_UNIVERSITY}}`, `{{HOST_BATCH}}`, `{{CONNECTIONS_URL}}`, `{{LOGO_URL}}`, and an optional `{{#if HOST_LOCATION}}...{{/if}}` block

Both are read from `src/utils/email-templates/` at send time via `fs.readFileSync` (note: from `src/`, not `dist/`, even in a built deployment — see `email-service.ts`), so edits take effect without a rebuild in dev, but **do** require the `src/` directory to exist alongside `dist/` in whatever you deploy.

`LOGO_URL` is built as `${strapi.config.get('server.url')}/t2h_logo.png` — the logo must be present under `apps/backend/public/`.

## Troubleshooting

### Emails not sending

1. Check the Strapi backend console/logs for `Error sending connection request email:` or `Error sending connection approved email:` — these are logged, not thrown, so they're easy to miss if you're only watching the frontend
2. Verify `AWS_SES_KEY`/`AWS_SES_SECRET`/`AWS_SES_REGION` (or the equivalent for whatever provider you're using) are correct
3. If SES is still in the sandbox, confirm the recipient is also a verified identity — sandbox SES silently rejects sends to unverified recipients
4. Check your provider's dashboard for bounce/rejection details
5. Confirm `EMAIL_FROM` is a verified sender for your provider

### Emails going to spam

1. Verify your sending domain with your provider (SPF/DKIM records)
2. Avoid sending from a raw Gmail/Yahoo-style address
3. Warm up sender reputation gradually if sending volume ramps up quickly

### Logo not showing in emails

1. Confirm `apps/backend/public/t2h_logo.png` exists
2. Confirm `server.url` (`PUBLIC_URL` env var, or the `server.ts` default) is reachable from wherever the recipient opens the email — `http://localhost:1337/...` will never load in someone else's inbox, so this only works end-to-end in a deployed environment with a public URL

## Environment Variables Summary

```bash
# AWS SES (current default provider)
AWS_SES_KEY=
AWS_SES_SECRET=
AWS_SES_REGION=us-east-1

# Shared across all providers
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

## Next Steps

1. Get AWS SES credentials and verify your sender identity (or swap to an alternative provider above)
2. Add the env vars to `apps/backend/.env`
3. Restart Strapi
4. Trigger a real connection request from the frontend and confirm delivery
5. If deploying, confirm `PUBLIC_URL`/`FRONTEND_URL` point at your real domains so links and the logo resolve correctly
