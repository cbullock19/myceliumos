# 📧 Resend Email Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. **Sign Up for Resend**
- Go to [https://resend.com](https://resend.com)
- Sign up with your email (free tier: 3,000 emails/month)
- Verify your email address

### 2. **Get Your API Key**
- Login to Resend dashboard
- Go to **API Keys** section
- Click **Create API Key**
- Copy the key (starts with `re_`)

### 3. **Add to Environment Variables**
Add these to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=onboarding@yourdomain.com

# Optional: Custom app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. **Domain Setup (Optional but Recommended)**
For production, add your domain:
- In Resend dashboard, go to **Domains**
- Add your domain (e.g., `youragency.com`)
- Add the DNS records they provide
- Update `FROM_EMAIL` to use your domain

## 🎯 **Email Features**

### ✨ **What You Get**
- **Beautiful React Email Templates**: Professional, responsive emails
- **99%+ Deliverability**: Emails actually reach inboxes
- **Real-time Analytics**: See opens, clicks, bounces
- **Automatic Fallback**: Graceful degradation if service is down
- **Professional Branding**: Organization colors and logos

### 📊 **Pricing**
- **Free Tier**: 3,000 emails/month (perfect for testing)
- **Pro Tier**: $20/month for 50,000 emails/month
- **No Hidden Fees**: Simple, transparent pricing

## 🧪 **Testing**

### Test Email Delivery
1. Set up your API key
2. Go to Team Management → Invite Team Member
3. Fill out the invitation form
4. Check the console logs for delivery status
5. Check your email inbox!

### Fallback Mode
If no API key is set, the system will:
- Show detailed setup instructions in console
- Provide the email HTML content for manual sending
- Include temporary password in API response
- Continue working without blocking user creation

## 🔧 **Troubleshooting**

### Common Issues
1. **"API Key not configured"**: Add `RESEND_API_KEY` to `.env.local`
2. **"Domain not verified"**: Use default domain or verify your custom domain
3. **Emails in spam**: Set up SPF/DKIM records (Resend provides these)

### Console Logs
Check browser console and server logs for detailed debugging info:
```
📧 ===== RESEND EMAIL DELIVERY =====
📧 Sending invitation email to: user@example.com
✅ Email sent successfully!
📧 Message ID: abc123...
```

## 🚀 **Next Steps**

Once email delivery is working:
1. **Customize Email Templates**: Edit `src/emails/InvitationEmail.tsx`
2. **Add More Email Types**: Deliverable notifications, client updates
3. **SMS Integration**: Add Twilio for text notifications
4. **Analytics**: Track email engagement metrics

---

**🎉 That's it! Your invitation emails will now be delivered professionally with beautiful templates and excellent deliverability!** 