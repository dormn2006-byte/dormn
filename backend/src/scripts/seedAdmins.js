import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CLI Script to Seed/Update Master Super Admin & Master Event Manager Accounts
 *
 * Usage:
 *   node src/scripts/seedAdmins.js
 */

const MASTER_ACCOUNTS = [
  {
    full_name: 'Dormn Super Admin',
    email: process.env.SUPERADMIN_EMAIL || 'superadmin@dormn.com',
    password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@Dormn2026',
    role: 'superadmin',
    gender: 'male',
  },
  {
    full_name: 'Dormn Event Manager',
    email: process.env.EVENT_ADMIN_EMAIL || 'events@dormn.com',
    password: process.env.EVENT_ADMIN_PASSWORD || 'EventManager@Dormn2026',
    role: 'event_admin',
    gender: 'male',
  },
];

async function seedMasterAdmins() {
  console.log('🚀 Starting Master Admin Seeding Script...');

  try {
    for (const acc of MASTER_ACCOUNTS) {
      const [existing] = await pool.execute(
        'SELECT id, role, password FROM users WHERE email = ?',
        [acc.email]
      );

      const hashedPassword = await bcrypt.hash(acc.password, 10);

      if (existing.length > 0) {
        // Update role and password if user already exists
        await pool.execute(
          `UPDATE users 
           SET role = ?, password = ?, full_name = ?, is_email_verified = 1 
           WHERE email = ?`,
          [acc.role, hashedPassword, acc.full_name, acc.email]
        );
        console.log(`✅ [UPDATED] Account: ${acc.email} | Role: ${acc.role}`);
      } else {
        // Create new master account
        await pool.execute(
          `INSERT INTO users (full_name, email, password, role, gender, is_email_verified, auth_provider)
           VALUES (?, ?, ?, ?, ?, 1, 'local')`,
          [acc.full_name, acc.email, hashedPassword, acc.role, acc.gender]
        );
        console.log(`✨ [CREATED] Account: ${acc.email} | Role: ${acc.role}`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 Master Admin Seeding Completed Successfully!');
    console.log('======================================================');
    console.log('1. Super Admin Portal:');
    console.log(`   Email:    ${MASTER_ACCOUNTS[0].email}`);
    console.log(`   Password: ${MASTER_ACCOUNTS[0].password}`);
    console.log(`   URL:      http://localhost:5173/auth (Auto-redirects to /superadmin/dashboard)\n`);
    console.log('2. Event Manager Portal:');
    console.log(`   Email:    ${MASTER_ACCOUNTS[1].email}`);
    console.log(`   Password: ${MASTER_ACCOUNTS[1].password}`);
    console.log(`   URL:      http://localhost:5173/auth (Auto-redirects to /event-admin/dashboard)`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
  } finally {
    process.exit(0);
  }
}

seedMasterAdmins();
