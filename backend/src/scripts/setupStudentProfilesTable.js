import pool from '../config/db.js';

export async function setupStudentProfilesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      full_name VARCHAR(255),
      phone VARCHAR(20),
      gender VARCHAR(20),
      dob DATE,
      home_address TEXT,
      hometown VARCHAR(100),
      pincode VARCHAR(20),
      parent_1_name VARCHAR(100),
      parent_1_relation VARCHAR(50),
      parent_1_phone VARCHAR(255),
      parent_2_name VARCHAR(100),
      parent_2_relation VARCHAR(50),
      parent_2_phone VARCHAR(255),
      guardian_name VARCHAR(100),
      guardian_relation VARCHAR(50),
      guardian_phone VARCHAR(255),
      blood_group VARCHAR(10),
      allergies TEXT,
      medical_details TEXT,
      food_preference VARCHAR(50),
      occupation VARCHAR(50) DEFAULT 'Student',
      college_name VARCHAR(255),
      course_name VARCHAR(255),
      course_year VARCHAR(50),
      admission_year VARCHAR(20),
      college_id_number VARCHAR(255),
      workplace_name VARCHAR(255),
      designation VARCHAR(100),
      passport_photo LONGTEXT,
      aadhar_front LONGTEXT,
      aadhar_back LONGTEXT,
      college_id_image LONGTEXT,
      bio TEXT,
      interests TEXT,
      hobbies TEXT,
      vibe VARCHAR(100),
      socials JSON,
      suggestions TEXT,
      is_public TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.execute(sql);
  console.log('student_profiles table ready.');
}

if (process.argv[1] && process.argv[1].includes('setupStudentProfilesTable.js')) {
  setupStudentProfilesTable()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
