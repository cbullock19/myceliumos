#!/usr/bin/env node

const chalk = require('chalk');

console.log(chalk.red.bold('\n🚨 PRISMA P1001 ERROR DETECTED: "Can\'t reach database server"\n'));

console.log(chalk.blue.bold('🔧 DEVELOPER DEBUGGING CHECKLIST FOR P1001 ERROR:\n'));

console.log(chalk.yellow('1. ✅ CHECK WIFI CONNECTION FIRST!'));
console.log('   - Are you on main WiFi or extender?');
console.log('   - Try switching to main WiFi network');
console.log(chalk.cyan('   - Run: ping db.dvvskiztdlrxecaheuis.supabase.co\n'));

console.log(chalk.yellow('2. ✅ VERIFY SUPABASE PROJECT STATUS:'));
console.log('   - Login to supabase.com dashboard');
console.log('   - Check if project is paused/sleeping');
console.log(chalk.cyan('   - Hit "Resume" if needed\n'));

console.log(chalk.yellow('3. ✅ ENVIRONMENT VARIABLES:'));
console.log('   - Confirm .env.local has correct DATABASE_URL');
console.log('   - Check credentials haven\'t expired');
console.log(chalk.cyan('   - Run: cat .env.local | grep DATABASE_URL\n'));

console.log(chalk.yellow('4. ✅ QUICK FIXES TO TRY:'));
console.log(chalk.cyan('   - npx prisma generate'));
console.log(chalk.cyan('   - npx prisma db push'));
console.log(chalk.cyan('   - Restart dev server (Ctrl+C then npm run dev)\n'));

console.log(chalk.green.bold('💡 REMEMBER: 90% of the time it\'s WiFi or paused Supabase!\n'));

console.log(chalk.magenta('🔗 USEFUL COMMANDS:'));
console.log(chalk.cyan('   npm run db:troubleshoot  # Run this troubleshooter'));
console.log(chalk.cyan('   npm run db:check         # Quick connection test'));
console.log(chalk.cyan('   npm run db:reset         # Reset everything if needed\n')); 