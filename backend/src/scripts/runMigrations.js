import 'dotenv/config';
import pool from '../config/db.js';

async function runMigrations() {
  try {
    console.log('Connecting and inspecting users table columns...');
    const [cols] = await pool.execute('DESCRIBE users');
    const existingCols = new Set(cols.map(c => c.Field.toLowerCase()));

    const addCol = async (name, typeAndDef) => {
      if (!existingCols.has(name.toLowerCase())) {
        console.log('Adding column to users:', name);
        await pool.query('ALTER TABLE users ADD COLUMN ' + name + ' ' + typeAndDef);
      } else {
        console.log('Column already exists on users:', name);
      }
    };

    await addCol('subscription_tier', "ENUM('free','standard','pro','custom') DEFAULT 'free'");
    await addCol('subscription_status', "ENUM('trial','active','expired','cancelled') DEFAULT 'trial'");
    await addCol('subscription_cycle', "ENUM('monthly','yearly') NULL");
    await addCol('subscription_started_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('subscription_expires_at', 'DATETIME DEFAULT NULL');
    await addCol('max_pg_listings', 'INT DEFAULT 1');
    await addCol('custom_plan_config', 'JSON DEFAULT NULL');

    await addCol('secondary_phone', 'VARCHAR(255) DEFAULT NULL');
    await addCol('bank_name', 'VARCHAR(255) DEFAULT NULL');
    await addCol('account_holder', 'VARCHAR(255) DEFAULT NULL');
    await addCol('account_number', 'VARCHAR(500) DEFAULT NULL');
    await addCol('ifsc_code', 'VARCHAR(255) DEFAULT NULL');
    await addCol('upi_id', 'VARCHAR(255) DEFAULT NULL');
    await addCol('business_name', 'VARCHAR(255) DEFAULT NULL');
    await addCol('office_address', 'TEXT DEFAULT NULL');
    await addCol('city', 'VARCHAR(100) DEFAULT NULL');
    await addCol('state', 'VARCHAR(100) DEFAULT NULL');
    await addCol('pincode', 'VARCHAR(20) DEFAULT NULL');
    await addCol('operating_since', 'VARCHAR(20) DEFAULT NULL');
    await addCol('pan_number', 'VARCHAR(255) DEFAULT NULL');
    await addCol('gstin', 'VARCHAR(255) DEFAULT NULL');
    await addCol('aadhaar_masked', 'VARCHAR(255) DEFAULT NULL');

    // Create owner_subscriptions table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        plan_name VARCHAR(50) NOT NULL,
        billing_cycle ENUM('monthly','yearly') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(255),
        status ENUM('created','successful','failed','refunded') DEFAULT 'created',
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,
        cancelled_at DATETIME NULL,
        custom_plan_config JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (owner_id),
        INDEX (status),
        INDEX (razorpay_order_id)
      )
    `);
    console.log('owner_subscriptions table ensured');

    // Initialize trial subscription for existing owners so their approved PGs are visible!
    const [subUpdate] = await pool.query(`
      UPDATE users 
      SET subscription_status = 'trial', 
          subscription_tier = 'free', 
          subscription_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY), 
          max_pg_listings = 5
      WHERE role = 'owner' AND (subscription_status IS NULL OR subscription_status = 'trial' OR subscription_expires_at IS NULL)
    `);
    console.log('Updated existing owners subscription status, affected:', subUpdate.affectedRows);

    // Expand columns in student_profiles and enrollment_forms for encryption
    try {
      await pool.query('ALTER TABLE enrollment_forms MODIFY COLUMN parent_1_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE enrollment_forms MODIFY COLUMN parent_2_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE enrollment_forms MODIFY COLUMN guardian_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE enrollment_forms MODIFY COLUMN college_id_number VARCHAR(255) DEFAULT NULL');
      console.log('enrollment_forms columns expanded');
    } catch (e) {
      console.log('enrollment_forms modify info:', e.message);
    }

    try {
      await pool.query('ALTER TABLE student_profiles MODIFY COLUMN parent_1_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE student_profiles MODIFY COLUMN parent_2_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE student_profiles MODIFY COLUMN guardian_phone VARCHAR(255) DEFAULT NULL');
      await pool.query('ALTER TABLE student_profiles MODIFY COLUMN college_id_number VARCHAR(255) DEFAULT NULL');
      console.log('student_profiles columns expanded');
    } catch (e) {
      console.log('student_profiles modify info:', e.message);
    }

    console.log('ALL MIGRATIONS EXECUTED CLEANLY!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigrations();
