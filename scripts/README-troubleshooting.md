# Database Troubleshooting System

## Quick Commands

When you encounter Prisma P1001 "Can't reach database server" errors, use these commands:

```bash
# Automatic troubleshooter (run this first!)
npm run db:troubleshoot

# Quick connection test
npm run db:check

# Enhanced db push (auto-runs troubleshooter on failure)
npm run db:push

# Full database reset if needed
npm run db-reset
```

## What the troubleshooter checks:

### 1. WiFi Connection ✅
- Most common cause of P1001 errors
- Switch from WiFi extender to main router
- Test with: `ping db.dvvskiztdlrxecaheuis.supabase.co`

### 2. Supabase Project Status ✅  
- Check if project is paused/sleeping
- Login to supabase.com dashboard
- Hit "Resume" button if needed

### 3. Environment Variables ✅
- Verify `.env.local` has correct DATABASE_URL
- Check credentials haven't expired
- Compare with `.env` file

### 4. Quick Fixes ✅
- Regenerate Prisma client
- Retry database push
- Restart development server

## Files Created:

- `scripts/troubleshoot-database.js` - Main troubleshooter
- `scripts/db-connection-test.js` - Automated connection tester
- Enhanced npm scripts in `package.json`

## Remember:
**90% of P1001 errors are caused by WiFi issues or paused Supabase projects!**

Always run `npm run db:troubleshoot` first before deeper debugging. 