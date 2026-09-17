-- Migration: Create event_ticket_invites table for couple/group ticket invite system

CREATE TABLE IF NOT EXISTS event_ticket_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invite_code VARCHAR(32) NOT NULL UNIQUE,
  ticket_code VARCHAR(32) NOT NULL,
  event_id VARCHAR(100) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  category VARCHAR(50) DEFAULT 'events',
  ticket_type ENUM('couple','group') NOT NULL,

  -- Booker info
  booker_user_id INT NOT NULL,
  booker_name VARCHAR(100) NOT NULL,
  booker_email VARCHAR(150) NOT NULL,
  booker_phone VARCHAR(20),

  -- Invitee info (filled on acceptance)
  invitee_email VARCHAR(150),
  invitee_name VARCHAR(100),
  invitee_user_id INT,
  invitee_phone VARCHAR(20),

  -- Ticket metadata
  base_price DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) DEFAULT 0,
  event_date VARCHAR(100),
  event_location VARCHAR(255),
  event_image VARCHAR(500),
  group_size INT DEFAULT 2,
  slot_number INT DEFAULT 1,

  -- Status
  status ENUM('pending','accepted','expired','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,

  FOREIGN KEY (booker_user_id) REFERENCES users(id),
  INDEX idx_invite_code (invite_code),
  INDEX idx_ticket_code (ticket_code),
  INDEX idx_booker (booker_user_id),
  INDEX idx_invitee (invitee_user_id),
  INDEX idx_status (status)
);
