import 'dotenv/config';
import { verifyEmailService, sendEmail } from '../utils/emailService.js';

async function main() {
  console.log('====================================================');
  console.log('           DORMN EMAIL SERVICE DIAGNOSTIC           ');
  console.log('====================================================\n');

  console.log('1. Checking Environment Variables:');
  console.log('   SMTP_USER:', process.env.SMTP_USER || process.env.EMAIL_USER || '❌ (NOT SET)');
  console.log('   SMTP_PASS:', process.env.SMTP_PASS || process.env.EMAIL_PASS ? '✅ (SET)' : '❌ (NOT SET)');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
  console.log('   SMTP_SERVICE:', process.env.SMTP_SERVICE || '(none)');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || 'auto');
  console.log('   SMTP_FROM:', process.env.SMTP_FROM || '(defaults to SMTP_USER)');
  console.log('\n----------------------------------------------------\n');

  console.log('2. Verifying SMTP Connection...');
  const result = await verifyEmailService();

  if (!result.configured) {
    console.log('\n❌ FAILED: SMTP is not configured in backend/.env!');
    console.log('\n👉 HOW TO FIX:');
    console.log('   Add the following lines to backend/.env:');
    console.log('   SMTP_USER=your_email@gmail.com');
    console.log('   SMTP_PASS=your_16_character_app_password');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    console.log('\n   Note for Gmail: You MUST use a 16-character Google "App Password"');
    console.log('   (Generated from: Google Account -> Security -> 2-Step Verification -> App Passwords).');
    process.exit(1);
  }

  if (!result.verified) {
    console.log('\n❌ FAILED: SMTP connection failed!');
    console.log('   Error:', result.error);
    console.log('   Error Code:', result.code);
    console.log('\n👉 COMMON CAUSES:');
    console.log('   1. Invalid password: If using Gmail, you cannot use your regular account password.');
    console.log('      Generate an App Password at: https://myaccount.google.com/apppasswords');
    console.log('   2. Blocked port: If port 465 is blocked by your ISP, try SMTP_PORT=587.');
    console.log('   3. Antivirus/firewall blocking outbound SMTP on port 465/587.');
    process.exit(1);
  }

  console.log('✅ SUCCESS:', result.message);

  const testRecipient = process.argv[2] || process.env.SMTP_USER || process.env.EMAIL_USER;
  if (testRecipient) {
    console.log(`\n3. Sending Test Email to ${testRecipient}...`);
    const sent = await sendEmail(
      testRecipient,
      '🧪 Dormn Email Service Test',
      '<div style="font-family:sans-serif;padding:20px;"><h2>✅ Email Service Working!</h2><p>Your Dormn SMTP email configuration is active and working properly.</p></div>'
    );
    if (sent) {
      console.log('🎉 Test email delivered successfully to', testRecipient);
    } else {
      console.log('❌ Test email send failed.');
    }
  }

  process.exit(0);
}

main();
