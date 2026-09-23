import dotenv from 'dotenv';
import {
  verifyEmailService,
  sendMail,
  sendBulkMail,
  buildSender,
  getMailQueueStats,
} from '../utils/emailService.js';

dotenv.config({ quiet: true });

async function main() {
  console.log('====================================================');
  console.log('           DORMN EMAIL SERVICE DIAGNOSTIC           ');
  console.log('====================================================\n');

  console.log('1. Checking Environment Variables:');
  console.log('   BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ (SET)' : '❌ (NOT SET)');
  console.log('   BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL || '(falls back to SMTP_FROM / SMTP_USER)');
  console.log('   EMAIL_DOMAIN:', process.env.EMAIL_DOMAIN || 'dormn.com (default)');
  console.log('   Build-on-demand sender example:', buildSender('bookings', 'Dormn Bookings').email);
  console.log('   --- Queue (bulk protection) ---');
  console.log('   concurrency:', process.env.MAIL_QUEUE_CONCURRENCY || '3 (default)');
  console.log('   minIntervalMs:', process.env.MAIL_MIN_INTERVAL_MS || '120 (default)');
  console.log('   BREVO_MAX_ATTEMPTS:', process.env.BREVO_MAX_ATTEMPTS || '3 (default)');
  console.log('   --- SMTP fallback ---');
  console.log('   SMTP_USER:', process.env.SMTP_USER || process.env.EMAIL_USER || '❌ (NOT SET)');
  console.log('   SMTP_PASS:', (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.BREVO_SMTP_KEY) ? '✅ (SET)' : '❌ (NOT SET)');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
  console.log('   SMTP_SERVICE:', process.env.SMTP_SERVICE || '(none)');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || 'auto');
  console.log('   SMTP_FROM:', process.env.SMTP_FROM || '(defaults to SMTP_USER)');
  console.log('\n----------------------------------------------------\n');

  console.log('2. Verifying email transport...');
  const result = await verifyEmailService();
  const provider = result.provider || 'smtp';

  if (!result.configured) {
    console.log('\n❌ FAILED: No email transport is configured in backend/.env!');
    console.log('\n👉 HOW TO FIX (Brevo — recommended):');
    console.log('   BREVO_API_KEY=your_brevo_api_v3_key');
    console.log('   BREVO_SENDER_EMAIL=verified-sender@yourdomain.com   # must be verified in Brevo');
    console.log('\n   Get the key at: https://app.brevo.com/settings/keys/api');
    console.log('   Verify a sender at: https://app.brevo.com/senders');
    console.log('\n👉 HOW TO FIX (SMTP fallback):');
    console.log('   SMTP_USER=your_email@gmail.com');
    console.log('   SMTP_PASS=your_16_character_app_password');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    process.exit(1);
  }

  if (!result.verified) {
    console.log(`\n❌ FAILED: ${provider.toUpperCase()} check failed!`);
    console.log('   Error:', result.error);
    console.log('   Error Code:', result.code);

    if (provider === 'brevo') {
      console.log('\n👉 COMMON CAUSES:');
      console.log('   1. Authorised IPs: Brevo blocks API calls from unknown IPs when IP');
      console.log('      restriction is enabled. Add this server\'s IP at');
      console.log('      https://app.brevo.com/security/authorised_ips');
      console.log('   2. Sender not verified: BREVO_SENDER_EMAIL must be a verified sender');
      console.log('      or on a verified domain (https://app.brevo.com/senders).');
      console.log('   3. Invalid or revoked API key.');
    } else {
      console.log('\n👉 COMMON CAUSES:');
      console.log('   1. Invalid password: If using Gmail, you cannot use your regular account password.');
      console.log('      Generate an App Password at: https://myaccount.google.com/apppasswords');
      console.log('   2. Blocked port: If port 465 is blocked by your ISP, try SMTP_PORT=587.');
      console.log('   3. Antivirus/firewall blocking outbound SMTP on port 465/587.');
    }
    process.exit(1);
  }

  console.log(`✅ SUCCESS [${provider}]:`, result.message);

  const testRecipient = process.argv[2] || process.env.SMTP_USER || process.env.EMAIL_USER;
  if (testRecipient) {
    const sender = buildSender('no-reply', 'Dormn Test');
    console.log(`\n3. Sending Test Email from ${sender.name} <${sender.email}> to ${testRecipient}...`);
    const sendResult = await sendMail({
      from: sender,
      to: testRecipient,
      subject: '🧪 Dormn Email Service Test',
      html: '<div style="font-family:sans-serif;padding:20px;"><h2>✅ Email Service Working!</h2><p>Your Dormn email configuration is active and working properly.</p></div>',
    });
    if (sendResult.ok) {
      console.log(`🎉 Test email delivered via ${sendResult.provider} (${sendResult.messageId || 'queued'})`);
    } else {
      console.log('❌ Test email send failed:', sendResult.error);
    }

    const bulkIndex = process.argv.indexOf('--bulk');
    const bulkCount = bulkIndex !== -1 ? parseInt(process.argv[bulkIndex + 1], 10) || 5 : 0;
    if (bulkCount > 0) {
      console.log(`\n4. Bulk test: queueing ${bulkCount} emails...`);
      const messages = Array.from({ length: bulkCount }, (_, i) => ({
        from: 'no-reply',
        to: testRecipient,
        subject: `Dormn bulk test #${i + 1}`,
        html: `<p>Bulk message ${i + 1} of ${bulkCount}.</p>`,
      }));
      const summary = await sendBulkMail(messages);
      console.log(`   Queued ${summary.total}: ${summary.sent} sent, ${summary.failed} failed.`);
    }
  }

  console.log('\nQueue stats:', getMailQueueStats());
  process.exit(0);
}

main();
