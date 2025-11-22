# Email Configuration Guide for Toast2Host

This guide will help you set up transactional email notifications for connection requests.

## Email Provider Options

We recommend **Resend** for its simplicity and generous free tier (3,000 emails/month for free).

### Alternative Providers
- **SendGrid**: 100 emails/day free
- **AWS SES**: $0.10 per 1,000 emails (requires AWS account)
- **Mailgun**: 5,000 emails/month free for 3 months

## Option 1: Resend (Recommended)

### Step 1: Create Resend Account
1. Go to https://resend.com/signup
2. Sign up with your email
3. Verify your email address

### Step 2: Get API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it "Toast2Host Production"
4. Select "Full Access"
5. Click "Add"
6. **Copy the API key** (you won't see it again!)

### Step 3: Verify Domain (Optional but Recommended)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `toast2host.net`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually 5-10 minutes)

### Step 4: Install Resend Plugin

```bash
cd apps/backend
pnpm add @strapi/provider-email-resend
```

### Step 5: Configure Strapi

Add to `apps/backend/config/plugins.ts`:

```typescript
export default ({ env }) => ({
  // ... other plugins
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
})
```

### Step 6: Add Environment Variables

Add to `apps/backend/.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

### Step 7: Test Email

Restart Strapi and create a test connection request to verify emails are being sent.

---

## Option 2: SendGrid

### Step 1: Create SendGrid Account
1. Go to https://signup.sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify your email

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it "Toast2Host"
4. Select "Full Access"
5. Click "Create & View"
6. **Copy the API key**

### Step 3: Install SendGrid Plugin

```bash
cd apps/backend
pnpm add @strapi/provider-email-sendgrid
```

### Step 4: Configure Strapi

Add to `apps/backend/config/plugins.ts`:

```typescript
export default ({ env }) => ({
  // ... other plugins
  email: {
    config: {
      provider: 'sendgrid',
      providerOptions: {
        apiKey: env('SENDGRID_API_KEY'),
      },
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@toast2host.net'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'support@toast2host.net'),
      },
    },
  },
})
```

### Step 5: Add Environment Variables

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

---

## Option 3: AWS SES

### Step 1: Set Up AWS SES
1. Log in to AWS Console
2. Go to Amazon SES
3. Verify your sender email or domain
4. Request production access (if needed)

### Step 2: Create IAM User
1. Go to IAM → Users → Add User
2. Name: `toast2host-ses`
3. Attach policy: `AmazonSESFullAccess`
4. Save Access Key ID and Secret Access Key

### Step 3: Install AWS SES Plugin

```bash
cd apps/backend
pnpm add @strapi/provider-email-amazon-ses
```

### Step 4: Configure Strapi

Add to `apps/backend/config/plugins.ts`:

```typescript
export default ({ env }) => ({
  // ... other plugins
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
})
```

### Step 5: Add Environment Variables

```bash
AWS_SES_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

---

## Testing Emails

After configuration:

1. Restart Strapi backend
2. Create a test connection request from the frontend
3. Check the recipient's email inbox
4. Check Strapi logs for any errors:
   ```bash
   pm2 logs strapi-backend
   ```

## Email Template Customization

The email template is located at:
```
apps/backend/src/utils/email-templates/connection-request.html
```

You can customize:
- Colors (currently using #ffc510 yellow theme)
- Logo (update {{LOGO_URL}})
- Text content
- Button styling

## Troubleshooting

### Emails not sending?
1. Check Strapi logs: `pm2 logs strapi-backend`
2. Verify API key is correct in `.env`
3. Check email provider dashboard for errors
4. Ensure `EMAIL_FROM` address is verified with your provider

### Emails going to spam?
1. Verify your domain with the email provider
2. Add SPF and DKIM DNS records
3. Use a custom domain for sending (not Gmail/Yahoo)
4. Warm up your sender reputation gradually

### Logo not showing?
1. Ensure logo is accessible at: `https://api.toast2host.net/t2h_logo.png`
2. Check if the logo file exists in `apps/backend/public/`
3. Verify `server.url` is set correctly in Strapi config

## Environment Variables Summary

Add these to your production server's `.env` file:

```bash
# Email Provider (choose one)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# OR
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
# OR
AWS_SES_KEY=AKIAXXXXXXXXXXXXXXXX
AWS_SES_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_REGION=us-east-1

# Email Configuration
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

## Next Steps

1. Choose an email provider (Resend recommended)
2. Install the provider plugin
3. Configure `config/plugins.ts`
4. Add environment variables
5. Deploy and test
6. Monitor email delivery in provider dashboard
