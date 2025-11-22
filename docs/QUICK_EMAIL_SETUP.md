# Quick Email Setup (5 Minutes)

## Setup with Resend (Recommended - Easiest)

### 1. Get Resend API Key
```bash
# Visit: https://resend.com/signup
# Create account → API Keys → Create → Copy the key
```

### 2. Install Resend Provider
```bash
cd apps/backend
pnpm add @strapi/provider-email-resend
```

### 3. Add to .env
```bash
# Add these lines to apps/backend/.env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@toast2host.net
EMAIL_REPLY_TO=support@toast2host.net
FRONTEND_URL=https://app.toast2host.net
```

### 4. Rebuild and Deploy
```bash
cd apps/backend
pnpm build
```

### 5. Deploy to Server
```bash
# From project root
rsync -avz --exclude .env --exclude node_modules apps/backend/dist/ apps/backend/src/ apps/backend/config/ azureuser@172.183.133.80:~/backend/
ssh azureuser@172.183.133.80 "cd ~/backend && pm2 restart strapi-backend"
```

### 6. Test
Create a connection request from the frontend - the target user should receive an email!

## Email Template Preview

The email includes:
- ✅ Toast2Host yellow (#ffc510) branding
- ✅ Logo from your frontend
- ✅ Guest's name, university, and batch year
- ✅ Optional LinkedIn profile link
- ✅ "View Connection Request" button linking to /requests page
- ✅ Mobile-responsive design

## Troubleshooting

**No emails received?**
```bash
# Check Strapi logs
ssh azureuser@172.183.133.80 "pm2 logs strapi-backend --lines 50"
```

**Emails going to spam?**
- Verify your domain at https://resend.com/domains
- Add SPF/DKIM DNS records provided by Resend

For detailed setup with other providers (SendGrid, AWS SES), see `EMAIL_SETUP.md`.
