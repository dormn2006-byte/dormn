import pool from '../config/db.js';

export async function setupEventsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      tagline VARCHAR(255),
      category VARCHAR(50) NOT NULL,
      category_label VARCHAR(100),
      location VARCHAR(255),
      city VARCHAR(100),
      phone VARCHAR(50),
      single_price INT DEFAULT 0,
      couple_price VARCHAR(50) DEFAULT 'FREE',
      couple_condition VARCHAR(255),
      cover_image TEXT,
      banner_image TEXT,
      gallery JSON,
      about TEXT,
      upcoming_night JSON,
      badge VARCHAR(100),
      rules JSON,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  await pool.execute(sql);
  console.log('Events table ready.');
}

if (process.argv[1] && process.argv[1].includes('setupEventsTable.js')) {
  setupEventsTable()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
