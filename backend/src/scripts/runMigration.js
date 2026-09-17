import pool from "../config/db.js";

async function runMigration() {
  console.log("====================================================");
  console.log("       RUNNING OWNER SUBSCRIPTIONS SQL MIGRATION   ");
  console.log("====================================================\n");

  const alterStatements = [
    { name: "subscription_tier", sql: "ALTER TABLE users ADD COLUMN subscription_tier ENUM('free','standard','pro','custom') DEFAULT 'free'" },
    { name: "subscription_status", sql: "ALTER TABLE users ADD COLUMN subscription_status ENUM('trial','active','expired','cancelled') DEFAULT 'trial'" },
    { name: "subscription_cycle", sql: "ALTER TABLE users ADD COLUMN subscription_cycle ENUM('monthly','yearly') NULL" },
    { name: "subscription_started_at", sql: "ALTER TABLE users ADD COLUMN subscription_started_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { name: "subscription_expires_at", sql: "ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME DEFAULT NULL" },
    { name: "max_pg_listings", sql: "ALTER TABLE users ADD COLUMN max_pg_listings INT DEFAULT 1" },
    { name: "custom_plan_config", sql: "ALTER TABLE users ADD COLUMN custom_plan_config JSON DEFAULT NULL" }
  ];

  console.log("1. Adding subscription columns to `users` table...");
  for (const stmt of alterStatements) {
    try {
      await pool.execute(stmt.sql);
      console.log(`   ✅ Added column: ${stmt.name}`);
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME" || err.message?.includes("Duplicate column")) {
        console.log(`   ℹ️ Column already exists: ${stmt.name}`);
      } else {
        console.error(`   ❌ Error adding ${stmt.name}:`, err.code, err.message, err);
      }
    }
  }

  console.log("\n2. Creating `owner_subscriptions` table...");
  const createTableSql = `
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
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX (owner_id),
      INDEX (status),
      INDEX (razorpay_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.execute(createTableSql);
    console.log("   ✅ Table `owner_subscriptions` created/verified successfully.");
  } catch (err) {
    console.error("   ❌ Error creating table `owner_subscriptions`:", err.code, err.message, err);
  }

  console.log("\n3. Verifying schema structure...");
  try {
    const [userCols] = await pool.execute("DESCRIBE users");
    const subColNames = userCols.map((c) => c.Field);
    console.log("   Users subscription columns present:", alterStatements.map((s) => s.name).filter((n) => subColNames.includes(n)).join(", "));

    const [subCols] = await pool.execute("DESCRIBE owner_subscriptions");
    console.log(`   owner_subscriptions columns (${subCols.length}):`, subCols.map((c) => c.Field).join(", "));
  } catch (err) {
    console.error("   ❌ Verification error:", err.code, err.message, err);
  }

  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
