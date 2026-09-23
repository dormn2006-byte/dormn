import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../schemas/userSchema.js';

dotenv.config({ quiet: true });

/**
 * CLI Script to Seed/Update Master Super Admin & Master Event Manager Accounts
 *
 * Usage:
 *   node src/scripts/seedAdmins.js
 */

const MASTER_ACCOUNTS = [
  {
    full_name: 'Dormn Super Admin',
    email: 'sd@dormn.com',
    password: 'SuperAdmin@Dormn2026',
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
    await connectDB();

    for (const acc of MASTER_ACCOUNTS) {
      const email = acc.email.toLowerCase();
      const existing = await User.findOne({ email }).select('_id role').lean();

      const hashedPassword = await bcrypt.hash(acc.password, 10);

      if (existing) {
        // Update role and password if user already exists
        await User.updateOne(
          { _id: existing._id },
          {
            role: acc.role,
            password: hashedPassword,
            full_name: acc.full_name,
            is_email_verified: 1,
          }
        );
        console.log(`✅ [UPDATED] Account: ${acc.email} | Role: ${acc.role}`);
      } else {
        // Create new master account
        await User.create({
          full_name: acc.full_name,
          email,
          password: hashedPassword,
          role: acc.role,
          gender: acc.gender,
          is_email_verified: 1,
          auth_provider: 'local',
        });
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
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    process.exit(process.exitCode || 0);
  }
}

seedMasterAdmins();
